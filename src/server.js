require('dotenv').config();
require('./models/OfficeConfig');
const isProduction = process.env.NODE_ENV === 'production';
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const bcrypt = require('bcrypt');
const multer = require('multer');

// --- 1. ROTA DOSYALARINI ÇAĞIR ---
const authRoutes = require('./routes/authRoutes');
const projectRoutes = require('./routes/projectRoutes');
const careerRoutes = require('./routes/careerRoutes');
const internshipRoutes = require('./routes/internshipRoutes');
const newsRoutes = require('./routes/newsRoutes');
const companyRoutes = require('./routes/companyRoutes');
const contactRoutes = require('./routes/contactRoutes');
const pageRoutes = require('./routes/pageRoutes'); 
const boardRoutes = require('./routes/boardRoutes'); 
const stakeholderRoutes = require('./routes/stakeholderRoutes'); 
const bookingRoutes = require('./routes/bookingRoutes'); 
const supportRoutes = require('./routes/supportRoutes');
const chatbotRoutes = require('./routes/chatbotRoutes');
const searchRoutes = require('./routes/searchRoutes');
const ttoRoutes = require('./routes/ttoRoutes');
const legalRoutes = require('./routes/legalRoutes');
const identityRoutes = require('./routes/identityRoutes');
const legislationRoutes = require('./routes/legislationRoutes');
const teamRoutes = require("./routes/teamRoutes");
const officeConfigRoutes = require('./routes/officeConfigRoutes');
const statRoutes = require('./routes/statRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const roomRoutes = require('./routes/roomRoutes');
const contactInfoRoutes = require('./routes/contactInfoRoutes');
const googleSheetsRoutes = require('./routes/googleSheetsRoutes');
const { protect } = require('./middleware/authMiddleware');
const corsOptions = require('./utils/corsConfig');
const cookieParser = require('cookie-parser');
const { csrfProtection } = require('./middleware/csrfProtection');
const { htmlSanitizeMiddleware } = require('./middleware/sanitizeHtml');
// --- 2. VERİTABANI VE MODELLER ---
const sequelize = require('./config/database');
const User = require('./models/User'); 
const Room = require('./models/Room');
const ContactInfo = require('./models/ContactInfo');

// Modelleri başlat (İlişkilerin kurulması için require edilmeleri yeterlidir)
require('./models/JobApplication');
require('./models/InternshipAd');
require('./models/News');
require('./models/Company');
require('./models/Contact');
require('./models/ProjectApplication');
require('./models/PageContent'); 
require('./models/BoardMember'); 
require('./models/Stakeholder'); 
require('./models/Booking'); 
require('./models/Support');
require('./models/Legislation');
require('./models/Identity');
require('./models/Legal');
require('./models/TtoService');
require('./models/ChatbotKnowledge');
require('./models/ContactInfo');

// --- 3. UYGULAMA AYARLARI ---
const app = express();
const PORT = process.env.PORT || 5000;

// IIS (ARR) reverse proxy arkasında gerçek istemci IP'sini X-Forwarded-For'dan al
app.set('trust proxy', 1);

// Güvenlik (Helmet) 
app.use(helmet({
  crossOriginResourcePolicy: false,
}));

// Morgan logging - Production'da combined format, Development'da dev format
if (isProduction) {
  app.use(morgan('combined'));
} else {
  app.use(morgan('dev'));
}

// Rate Limit - Endpoint specific


const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000, // Production: 100, Development: 1000
  message: { success: false, message: "Çok fazla istek gönderdiniz." },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.method === 'OPTIONS', // OPTIONS preflight'ı atla
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  skipSuccessfulRequests: true,
  message: { success: false, message: "Çok fazla giriş denemesi. 15 dakika bekleyiniz." }
});

// Body Parser - Yüksek limitli
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// HTML Sanitization - XSS koruması (veritabanına kaydetmeden önce)
app.use(htmlSanitizeMiddleware);

// Cookie Parser - CSRF protection için gerekli
app.use(cookieParser());

// CORS - Güvenli konfigürasyon (Production'da localhost kaldırılır)
app.use(cors(corsOptions));

// Production ortamında CORS origin'leri kontrol et
if (process.env.NODE_ENV === 'production') {
  if (!process.env.FRONTEND_URL) {
    console.error('🚨 HATA: Production ortamında FRONTEND_URL ortam değişkeni ayarlanmalı!');
    process.exit(1);
  }
  console.log(`✅ CORS kaynakları: ${process.env.FRONTEND_URL}`);
} else {
  console.log('🔷 Development CORS: localhost portları aktif');
}

// Rate limit - CORS sonrası
// Diğer tüm /api route'larına rate limit uygula (upload endpoint'i hariç)
app.use('/api', generalLimiter);

// CSRF Protection - CSRF saldırılarına karşı koruma (Double-submit cookie)
app.use('/api', csrfProtection);

// --- 4. KLASÖR YAPISI VE STATİK DOSYALAR ---
const uploadsPath = process.env.UPLOADS_PATH || path.resolve(__dirname, '../uploads');
const imagesPath = path.join(uploadsPath, 'images');
const documentsPath = path.join(uploadsPath, 'documents');

// Klasörleri Kontrol Et ve Oluştur
[uploadsPath, imagesPath, documentsPath].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Klasör oluşturuldu: ${dir}`);
    }
});

// Statik Dosya Servisi - PUBLIC KLASÖRÜ
const publicPath = process.env.PUBLIC_PATH || path.resolve(__dirname, '../../public');
console.log(`📁 Public klasörü: ${publicPath}`);
console.log(`📁 Public klasörü var mı: ${fs.existsSync(publicPath)}`);
app.use('/public', express.static(publicPath));

// Statik Dosya Servisi - UPLOADS KLASÖRÜ
app.use('/uploads', (req, res, next) => {
  // Cache control header'ı ekle (1 ay)
  res.set('Cache-Control', 'public, max-age=2592000');
  next();
}, express.static(uploadsPath));

// --- 5. GENEL RESİM YÜKLEME ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Backend içinden çıkıp ana dizindeki uploads/images'a gider
    const uploadPath = path.join(__dirname, '../uploads/images/');
    
    // Klasör yoksa hata vermemesi için oluşturma kontrolü (opsiyonel ama önerilir)
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Sadece resim dosyaları yüklenebilir!'));
    }
  }
});
// --- 6. UPLOAD ENDPOINT (Rate limit öncesi) ---
app.post('/api/upload', protect, upload.single('image'), (req, res) => {
  try {
    const type = req.body.type || 'images';
    const fileUrl = `uploads/images/${type}/${req.file.filename}`;
    res.json({ success: true, url: fileUrl });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Hata oluştu' });
  }
});

// --- 7. API ROTALARI ---

// CSRF Token Endpoint'i (Frontend token alması için)
const { getCsrfToken } = require('./middleware/csrfProtection');
app.get('/api/csrf-token', getCsrfToken);

app.use('/api/auth', authRoutes);
app.use('/api', projectRoutes); 
app.use('/api/career', careerRoutes);
app.use('/api/internship', internshipRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/pages', pageRoutes); 
app.use('/api/board-members', boardRoutes);
app.use('/api/stakeholders', stakeholderRoutes);
app.use('/api/reservation', bookingRoutes); 
app.use('/api/supports', supportRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/legislations', legislationRoutes);
app.use('/api/identities', identityRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/tto', ttoRoutes);
app.use("/api/team", teamRoutes);
app.use('/api/office-config', officeConfigRoutes);
app.use('/api/stats', statRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api', googleSheetsRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/contact-info', contactInfoRoutes);

// Sağlık Kontrolü
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server aktif.', timestamp: new Date() });
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint bulunamadı.' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('🔥 Sunucu Hatası:', err.stack || err.message);
  
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ success: false, message: `Dosya yükleme hatası: ${err.message}` });
  }

  res.status(500).json({ 
    success: false, 
    message: 'Sunucu tarafında bir hata oluştu.',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// --- 7. SUNUCUYU BAŞLAT ---
const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı.');
    
    // Sequelize sync ile index hatası varsa, sadece table'ları oluştur
    try {
      await sequelize.sync({ alter: false, logging: console.log }); 
      console.log('✅ Tablolar senkronize edildi.');
    } catch (syncErr) {
      console.warn('⚠️ Sync hatası (devam ediliyor):', syncErr.message);
      // Sync başarısız olsa bile server başlatsın
    }

    // =====================================================
    // 🔐 OTOMATİK ADMIN OLUŞTURMA (.env'den okur)
    // =====================================================
    const adminUsername = process.env.ADMIN_EMAIL || 'admin';
    const adminPassword = process.env.ADMIN_PASS || 'admin123';
    const adminEmail = process.env.ADMIN_EMAIL 
      ? `${process.env.ADMIN_EMAIL}@caku.edu.tr` 
      : 'admin@caku.edu.tr';

    console.log(`\n🔍 Admin kontrolü yapılıyor: "${adminUsername}"`);

    const adminExists = await User.findOne({ where: { username: adminUsername } });

    if (!adminExists) {
      console.log('⚙️ Admin kullanıcısı oluşturuluyor...');
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      await User.create({
        username: adminUsername,
        password: hashedPassword,
        email: adminEmail, 
        role: 'admin'
      });
      console.log(`✅ Admin oluşturuldu: ${adminUsername}`);
    } else {
      console.log(`ℹ️ Admin zaten mevcut: ${adminUsername}`);
    }
    // =====================================================

    // Health Check Endpoint
    app.get('/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Graceful error handling with port fallback
    function tryListen(portNum, retryCount = 0, maxRetries = 5) {
      if (retryCount > maxRetries) {
        console.error('❌ Kullanılabilir port bulunamadı!');
        process.exit(1);
      }

      const currentServer = app.listen(portNum, '0.0.0.0', () => {
        console.log(`\n🚀 Server http://0.0.0.0:${portNum} adresinde çalışıyor.`);
        console.log(`📋 Admin Giriş Bilgileri:`);
        console.log(`   Kullanıcı: ${adminUsername}`);
        console.log(`   Şifre: .env dosyasında ADMIN_PASSWORD olarak ayarlandı\n`);
      });

      currentServer.on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          const nextPort = 5000 + retryCount + 1;
          console.warn(`⚠️ Port ${portNum} zaten kullanımda. Deneme ${retryCount + 1}/${maxRetries} - port ${nextPort} deneniyor...`);
          tryListen(nextPort, retryCount + 1, maxRetries);
        } else {
          console.error('❌ Sunucu hatası:', err);
          process.exit(1);
        }
      });
    }

    tryListen(PORT);
  } catch (error) {
    console.error('❌ Sunucu başlatılamadı:', error);
    process.exit(1);
  }
};

startServer();