const express = require('express');
const router = express.Router();
const newsController = require('../controllers/newsController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

// ======================================================
// MULTER AYARLARI - Çoklu Dosya Desteği
// ======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/images');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'news-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req, file, cb) => {
  // Sadece resim dosyaları
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Sadece resim dosyaları yüklenebilir!'), false);
  }
};

const upload = multer({ 
  storage,
  fileFilter,
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB per file
    files: 10 // Maksimum 10 dosya
  }
});

// Çoklu dosya yükleme alanları
const uploadFields = upload.fields([
  { name: 'image', maxCount: 1 },           // Kapak resmi
  { name: 'mainImage', maxCount: 1 },       // Alternatif kapak resmi alanı
  { name: 'gallery', maxCount: 9 },         // Galeri resimleri
  { name: 'galleryImages', maxCount: 9 },   // Alternatif galeri alanı
  { name: 'resim', maxCount: 1 },           // Eski uyumluluk
]);

// Dosya düzeltici middleware
const fixFileRequest = (req, res, next) => {
  // upload.fields kullanıldığında req.files bir obje olur
  if (req.files) {
    // Tüm dosyaları düz bir array'e çevir
    const allFiles = [];
    
    // Kapak resmi
    if (req.files.image) allFiles.push(...req.files.image);
    if (req.files.mainImage) allFiles.push(...req.files.mainImage);
    if (req.files.resim) allFiles.push(...req.files.resim);
    
    // Galeri resimleri
    if (req.files.gallery) allFiles.push(...req.files.gallery);
    if (req.files.galleryImages) allFiles.push(...req.files.galleryImages);
    
    // Eski controller uyumluluğu için
    if (allFiles.length > 0) {
      req.file = allFiles[0]; // İlk dosya
      req.files = allFiles;   // Tüm dosyalar
    }
  }
  next();
};

// ======================================================
// ROTALAR
// ======================================================

// Public
router.get('/', newsController.getAllNews);
router.get('/:id', newsController.getNewsById);

// Protected - Yönetici
router.post('/', protect, uploadFields, fixFileRequest, newsController.createNews);
router.put('/:id', protect, uploadFields, fixFileRequest, newsController.updateNews);
router.delete('/:id', protect, newsController.deleteNews);

// Galeri işlemleri (opsiyonel - ayrı endpoint'ler)
router.post('/:id/gallery', protect, upload.single('image'), newsController.addGalleryImage);
router.delete('/:id/gallery', protect, newsController.removeGalleryImage);

module.exports = router;