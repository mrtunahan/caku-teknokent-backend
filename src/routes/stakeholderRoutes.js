const express = require('express');
const router = express.Router();
const controller = require('../controllers/stakeholderController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

// ======================================================
// 1. ESNEK MULTER AYARLARI
// ======================================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../uploads/images');
    // Klasör yoksa oluştur
    if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya ismi
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'stakeholder-' + uniqueSuffix + ext);
  }
});

// upload.any() sayesinde dosya ismi ne olursa olsun kabul eder.
const upload = multer({ storage });

// ======================================================
// 2. DOSYA EŞİTLEYİCİ (Bridge Middleware)
// ======================================================
// Controller 'req.file' (tekil) beklerken, upload.any() 'req.files' (çoğul) verir.
// Bu fonksiyon aradaki çeviriyi yapar.
const fixFileRequest = (req, res, next) => {
    if (req.files && req.files.length > 0) {
        req.file = req.files[0]; // İlk gelen dosyayı al ve controller'a sun
    }
    next();
};

// ======================================================
// 3. ROTALAR
// ======================================================

router.get('/', controller.getAll);

// POST ve PUT işlemlerinde upload.any() ve fixFileRequest ekledik
router.post('/', protect, upload.any(), fixFileRequest, controller.create);
router.put('/:id', protect, upload.any(), fixFileRequest, controller.update);
router.delete('/:id', protect, controller.delete);

module.exports = router;