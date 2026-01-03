const express = require('express');
const router = express.Router();
const legislationController = require('../controllers/legislationController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

// --- Klasör Yolu Ayarı ---
const uploadDir = path.join(__dirname, '../../uploads/documents');

if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Magic bytes doğrulama
const getMimeType = (buffer) => {
  // PDF: %PDF
  if (buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46) {
    return 'application/pdf';
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

// --- Multer Depolama Ayarları ---
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'doc-' + uniqueSuffix + ext);
    }
});

// Dosya tipi doğrulama
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Desteklenmeyen dosya formatı! (Sadece PDF, Word)'), false);
  }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 50MB → 10MB
    fileFilter: fileFilter
});

// Magic bytes doğrulama middleware'i
const validateMagicBytes = (req, res, next) => {
  if (!req.file) return next();
  
  fs.readFile(req.file.path, (err, data) => {
    if (err) return next(err);
    
    const actualMimeType = getMimeType(data);
    const allowedMimeTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

    if (!actualMimeType || !allowedMimeTypes.includes(actualMimeType)) {
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Dosya doğrulaması başarısız. Geçersiz dosya türü.' 
      });
    }

    if (actualMimeType !== req.file.mimetype) {
      console.warn(`⚠️ MIME type uyuşmazlığı: Declared=${req.file.mimetype}, Actual=${actualMimeType}`);
      fs.unlink(req.file.path, () => {});
      return res.status(400).json({ 
        success: false, 
        message: 'Dosya doğrulaması başarısız.' 
      });
    }

    next();
  });
};

// --- ROTALAR ---

// 1. Sıralama Rotası (EN ÜSTTE OLMALI)
router.put('/reorder', legislationController.reorderLegislations);

// 2. Listeleme
router.get('/', legislationController.getAllLegislations);

// 3. Oluştur
router.post('/', protect, upload.single('file'), validateMagicBytes, legislationController.createLegislation);

// 4. Güncelle
router.put('/:id', protect, upload.single('file'), validateMagicBytes, legislationController.updateLegislation);

// 5. Sil
router.delete('/:id', protect, legislationController.deleteLegislation);

module.exports = router;