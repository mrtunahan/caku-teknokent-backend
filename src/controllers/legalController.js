const Legal = require('../models/Legal');
const path = require('path');
const fs = require('fs').promises;
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Tüm Yasal Belgeleri Getir (Kategoriye göre filtreleme)
exports.getAll = async (req, res) => {
    try {
        const { category } = req.query;
        const whereClause = category ? { category } : {};
        const items = await Legal.findAll({ 
            where: whereClause, 
            order: [['createdAt', 'DESC']] 
        });
        res.json({ success: true, data: items });
    } catch (error) {
        console.error("Legal getAll error:", error);
        return handleError(error, res, 500);
    }
};

// Yeni Yasal Belge Ekle
exports.create = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Lütfen dosya seçin.' });
        }
        
        const { title, category } = req.body;

        // Kategori kontrolü
        const validCategories = ['kvkk', 'cerez', 'gizlilik'];
        if (!validCategories.includes(category)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Geçersiz kategori. Geçerli değerler: kvkk, cerez, gizlilik' 
            });
        }

        // ✅ Dosya uzantısını al
        const fileType = path.extname(req.file.originalname).toLowerCase();

        const newItem = await Legal.create({
            title,
            category,
            fileName: req.file.filename,
            fileType: fileType
        });
        
        res.status(201).json({ success: true, data: newItem, message: 'Belge başarıyla eklendi.' });
    } catch (error) {
        console.error("Legal create error:", error);
        return handleError(error, res, 500);
    }
};

// Yasal Belge Sil
exports.delete = async (req, res) => {
    try {
        const item = await Legal.findByPk(req.params.id);
        if (!item) {
            return res.status(404).json({ success: false, message: 'Belge bulunamadı.' });
        }

        // Dosyayı diskten sil
        const filePath = path.join(__dirname, '../../uploads/documents', item.fileName);
        try { 
            await fs.unlink(filePath); 
        } catch (e) {
            console.log("Dosya silinirken hata (zaten silinmiş olabilir):", e.message);
        }

        await item.destroy();
        res.json({ success: true, message: 'Belge silindi.' });
    } catch (error) {
        console.error("Legal delete error:", error);
        return handleError(error, res, 500);
    }
};