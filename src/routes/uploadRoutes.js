const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Klasör Kontrolü
const uploadDir = path.join(__dirname, '../../uploads/editor');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer Ayarları
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, 'editor-' + uniqueSuffix + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Sadece resim dosyaları yüklenebilir (JPEG, PNG, GIF, WebP)'), false);
    }
};

const upload = multer({ 
    storage,
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// POST /api/upload/image - Editör için resim yükleme
router.post('/image', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Dosya yüklenemedi.' });
        }

        const imageUrl = `/uploads/editor/${req.file.filename}`;
        
        res.json({ 
            success: true, 
            url: imageUrl,
            message: 'Resim başarıyla yüklendi.'
        });
    } catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ success: false, message: 'Yükleme sırasında hata oluştu.' });
    }
});

// DELETE /api/upload/image/:filename - Resim silme (opsiyonel)
router.delete('/image/:filename', (req, res) => {
    try {
        const filePath = path.join(uploadDir, req.params.filename);
        
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
            res.json({ success: true, message: 'Resim silindi.' });
        } else {
            res.status(404).json({ success: false, message: 'Dosya bulunamadı.' });
        }
    } catch (error) {
        console.error('Delete Error:', error);
        res.status(500).json({ success: false, message: 'Silme sırasında hata oluştu.' });
    }
});

module.exports = router;