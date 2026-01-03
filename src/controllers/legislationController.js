const Legislation = require('../models/Legislation');
const fs = require('fs');
const path = require('path');

// Tüm Mevzuatları Getir
exports.getAllLegislations = async (req, res) => {
    try {
        const { category } = req.query;
        const whereClause = category ? { category } : {};

        const documents = await Legislation.findAll({
            where: whereClause,
            order: [['order', 'ASC'], ['createdAt', 'DESC']]
        });

        res.json({ success: true, data: documents });
    } catch (error) {
        console.error("Listeleme hatası:", error);
        res.status(500).json({ success: false, message: "Veriler çekilemedi." });
    }
};

// Yeni Belge Ekle
exports.createLegislation = async (req, res) => {
    try {
        // Formdan gelen verileri kontrol et
        console.log("Gelen Body:", req.body);
        console.log("Gelen Dosya:", req.file);

        const { title, category } = req.body;

        // 1. Kategori Kontrolü
        if (!category) {
            return res.status(400).json({ success: false, message: "Kategori bilgisi eksik!" });
        }

        // 2. Dosya Kontrolü
        if (!req.file) {
            return res.status(400).json({ success: false, message: "Lütfen geçerli bir PDF dosyası yükleyin." });
        }

        // Sıralama belirle
        const lastItem = await Legislation.findOne({
            where: { category },
            order: [['order', 'DESC']]
        });
        const newOrder = lastItem ? lastItem.order + 1 : 0;

        // Veritabanına kaydet
        const newDoc = await Legislation.create({
            title,
            category,
            fileName: req.file.filename,
            order: newOrder
        });

        res.status(201).json({ success: true, data: newDoc, message: "Belge başarıyla eklendi." });

    } catch (error) {
        console.error("Ekleme Hatası:", error);
        res.status(500).json({ success: false, message: "Veritabanı hatası oluştu." });
    }
};

// Belge Sil
exports.deleteLegislation = async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await Legislation.findByPk(id);

        if (!doc) {
            return res.status(404).json({ success: false, message: "Belge bulunamadı." });
        }

        // Dosyayı klasörden sil
        const filePath = path.join(__dirname, '../../uploads/documents', doc.fileName);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        await doc.destroy();
        res.json({ success: true, message: "Belge silindi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Silme başarısız." });
    }
};

// Sıralama Güncelleme
exports.reorderLegislations = async (req, res) => {
    try {
        const { items } = req.body;
        if (!items || !Array.isArray(items)) return res.status(400).json({ success: false, message: "Geçersiz veri." });

        await Promise.all(items.map(item => 
            Legislation.update({ order: item.order }, { where: { id: item.id } })
        ));

        res.json({ success: true, message: "Sıralama güncellendi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Sıralama hatası." });
    }
};

// Belge Güncelleme
exports.updateLegislation = async (req, res) => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        
        const doc = await Legislation.findByPk(id);
        if (!doc) return res.status(404).json({ success: false, message: "Belge bulunamadı." });

        if (req.file) {
            // Eski dosyayı sil
            const oldPath = path.join(__dirname, '../../uploads/documents', doc.fileName);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
            doc.fileName = req.file.filename;
        }

        if (title) doc.title = title;
        await doc.save();

        res.json({ success: true, message: "Güncellendi." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Güncelleme hatası." });
    }
};