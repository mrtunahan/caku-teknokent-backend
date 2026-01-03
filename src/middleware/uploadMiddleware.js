const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Yükleme klasörünü ayarla
const uploadDir = path.join(__dirname, '../../uploads/cv');
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Magic bytes doğrulama
const getMimeType = (buffer) => {
  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
  }
  // JPEG: FFD8FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) {
    return 'image/jpeg';
  }
  // PNG: 89504E47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) {
    return 'image/png';
  }
  // DOCX: 504B0304
  if (buffer[0] === 0x50 && buffer[1] === 0x4B && buffer[2] === 0x03 && buffer[3] === 0x04) {
    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
  }
  // DOC: D0CF11E0
  if (buffer[0] === 0xD0 && buffer[1] === 0xCF && buffer[2] === 0x11 && buffer[3] === 0xE0) {
    return 'application/msword';
  }
  return null;
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/jpg'
  ];

  // İlk: MIME type kontrolü
  if (!allowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Desteklenmeyen dosya formatı! (Sadece PDF, Word ve Resim)'), false);
  }

  // Magic bytes kontrolü için file buffer'ı sakla
  req.fileBuffer = true;
  cb(null, true);
};

const upload = multer({ 
  storage: storage,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 100MB → 10MB (10 katı azalttı)
    fieldSize: 10 * 1024 * 1024 
  },
  fileFilter: fileFilter
});

// Magic bytes doğrulama middleware'i
const validateMagicBytes = (req, res, next) => {
  if (!req.file) return next();
  
  fs.readFile(req.file.path, (err, data) => {
    if (err) return next(err);
    
    const actualMimeType = getMimeType(data);
    const allowedMimeTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];

    if (!actualMimeType || !allowedMimeTypes.includes(actualMimeType)) {
      // Kötü dosyayı sil
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Dosya doğrulaması başarısız. Gerçek dosya türü uyuşmuyor.' 
      });
    }

    // MIME type ile magic bytes uyuşuyor mu?
    if (actualMimeType !== req.file.mimetype) {
      console.warn(`⚠️ MIME type uyuşmazlığı: Declared=${req.file.mimetype}, Actual=${actualMimeType}`);
      // Saldırı denemesi, dosyayı sil
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Dosya doğrulaması başarısız. Dosya türü uyuşmuyor.' 
      });
    }

    next();
  });
};

module.exports = upload;
module.exports.validateMagicBytes = validateMagicBytes;