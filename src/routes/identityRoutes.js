const express = require('express');
const router = express.Router();
const identityController = require('../controllers/identityController');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Klasör Kontrolü ve Oluşturma
const uploadDir = 'uploads/documents/';
if (!fs.existsSync(uploadDir)){
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Ayarları
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Türkçe karakter sorununu önlemek için güvenli isimlendirme
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 } // 10MB Limit
});

// --- Rotalar ---

// GET: Listele
router.get('/', identityController.getAllIdentities);

// POST: Ekle (DİKKAT: 'file' frontend'deki formData ismiyle aynı olmalı)
const { protect } = require('../middleware/authMiddleware');
router.post('/', protect, upload.single('file'), identityController.createIdentity);
router.delete('/:id', protect, identityController.deleteIdentity);

module.exports = router;