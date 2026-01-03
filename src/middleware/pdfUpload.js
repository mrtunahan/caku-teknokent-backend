const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads/documents');

// Klasör yoksa oluştur
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Türkçe karakterleri temizle ve benzersiz isim yap
        const originalName = file.originalname.toLowerCase().replace(/ /g, '-').replace(/[^\w.-]/g, '');
        const uniqueSuffix = Date.now();
        cb(null, uniqueSuffix + '-' + originalName);
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
    } else {
        cb(new Error('Sadece PDF dosyaları yüklenebilir!'), false);
    }
};

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 100 * 1024 * 1024 }, // Max 10MB
    fileFilter: fileFilter
});

module.exports = upload;