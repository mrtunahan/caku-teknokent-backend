const express = require('express');
const router = express.Router();
const Stat = require('../models/Stat');
const { protect } = require('../middleware/authMiddleware');
const { handleError } = require('../utils/errorHandler');

// İstatistikleri Getir
router.get('/', async (req, res) => {
    try {
        let stats = await Stat.findAll({ order: [['id', 'ASC']] });
        
        // Eğer tablo boşsa varsayılanları oluştur (Seed)
        if (stats.length === 0) {
            stats = await Stat.bulkCreate([
                { title: "Aktif Firma", count: 59, iconKey: "building", colorClass: "text-blue-600" },
                { title: "Aktif Çalışan", count: 446, iconKey: "users", colorClass: "text-green-600" },
                { title: "Yürütülen Proje", count: 71, iconKey: "project", colorClass: "text-orange-500" },
                { title: "Tamamlanan Proje", count: 7, iconKey: "check", colorClass: "text-purple-600" }
            ]);
        }
        res.json({ success: true, data: stats });
    } catch (error) {
        return handleError(error, res, 500);
    }
});

// İstatistik Güncelle
router.put('/:id', protect, async (req, res) => {
    try {
        const { count, title } = req.body;
        await Stat.update({ count, title }, { where: { id: req.params.id } });
        res.json({ success: true, message: "Güncellendi" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Güncellenemedi" });
    }
});

module.exports = router;