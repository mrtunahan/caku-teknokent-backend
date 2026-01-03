const Identity = require('../models/Identity');
const fs = require('fs');
const path = require('path');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Tüm Kurumsal Kimlik Dosyalarını Getir
exports.getAllIdentities = async (req, res) => {
    try {
        const docs = await Identity.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: docs });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Veriler çekilemedi." });
    }
};

// Yeni Kurumsal Kimlik Dosyası Ekle
exports.createIdentity = async (req, res) => {
    try {
        const { title } = req.body;

        if (!req.file) {
            return res.status(400).json({ success: false, message: "Lütfen bir dosya yükleyin." });
        }

        // ✅ Dosya uzantısını al
        const fileType = path.extname(req.file.originalname).toLowerCase();

        const newDoc = await Identity.create({
            title,
            fileName: req.file.filename,
            fileType: fileType // ✅ Uzantıyı kaydet
        });

        res.status(201).json({ success: true, data: newDoc, message: "Dosya başarıyla eklendi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Ekleme başarısız." });
    }
};

// Dosya Sil
exports.deleteIdentity = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Identity.findByPk(id);

        if (!doc) {
            return res.status(404).json({ success: false, message: "Dosya bulunamadı." });
        }

        // Klasörden sil
        const filePath = path.join(__dirname, '../../uploads/documents', doc.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await doc.destroy();
        res.json({ success: true, message: "Dosya silindi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Silme işlemi başarısız." });
    }
};