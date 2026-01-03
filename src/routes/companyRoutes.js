const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Company = require('../models/Company');
const { Op, Sequelize } = require('sequelize');
const { protect } = require('../middleware/authMiddleware');

// --- RESİM YÜKLEME AYARLARI ---
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
    cb(null, 'company-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage });

// ======================================================
// 1. SEKTÖR DAĞILIMI (Bu route önce gelmeli!)
// ======================================================
router.get('/sector-distribution', async (req, res) => {
  try {
    const companies = await Company.findAll({
      attributes: ['sector'],
      where: {
        sector: { [Op.ne]: null }
      }
    });

    // Sektörleri say
    const sectorCounts = {};
    companies.forEach(company => {
      const sector = company.sector || 'Belirtilmemiş';
      sectorCounts[sector] = (sectorCounts[sector] || 0) + 1;
    });

    // Toplam firma sayısı
    const total = companies.length;

    // Chart.js formatına çevir
    const data = Object.entries(sectorCounts).map(([sektor, firma_sayisi]) => ({
      sektor,
      firma_sayisi,
      yuzde: total > 0 ? parseFloat(((firma_sayisi / total) * 100).toFixed(1)) : 0
    }));

    // Firma sayısına göre sırala
    data.sort((a, b) => b.firma_sayisi - a.firma_sayisi);

    res.json({ success: true, data });
  } catch (error) {
    console.error("Sektör dağılımı hatası:", error);
    res.status(500).json({ success: false, message: 'Veri alınamadı.' });
  }
});

// ======================================================
// 2. İSTATİSTİKLER
// ======================================================
router.get('/statistics', async (req, res) => {
  try {
    const totalCompanies = await Company.count();
    const totalSectors = await Company.count({
      distinct: true,
      col: 'sector',
      where: {
        sector: { [Op.ne]: null }
      }
    });

    res.json({
      success: true,
      data: {
        total_companies: totalCompanies,
        total_sectors: totalSectors
      }
    });
  } catch (error) {
    console.error('İstatistikler hatası:', error);
    res.status(500).json({ success: false, message: 'İstatistikler alınamadı.' });
  }
});

// ======================================================
// 3. SEKTÖRE GÖRE FİRMALARI GETİR
// ======================================================
router.get('/by-sector/:sector', async (req, res) => {
  try {
    const companies = await Company.findAll({
      where: { sector: req.params.sector },
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error('Sektöre göre firmalar hatası:', error);
    res.status(500).json({ success: false, message: 'Firmalar getirilemedi.' });
  }
});

// ======================================================
// 4. TÜM FİRMALARI GETİR
// ======================================================
router.get('/', async (req, res) => {
  try {
    const companies = await Company.findAll({
      order: [['name', 'ASC']]
    });
    res.json({ success: true, data: companies });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Veriler alınamadı.' });
  }
});

// ======================================================
// 5. FİRMA EKLE
// ======================================================
router.post('/', protect, upload.any(), async (req, res) => {
  try {
    const file = req.files && req.files.length > 0 ? req.files[0] : null;
    const logo_url = file ? file.filename : null;
    const { name, sector, category } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Firma adı zorunludur.' });
    }

    const newCompany = await Company.create({
      name,
      sector,
      category: category || 'arge',
      logo_url
    });

    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    console.error("Firma Ekleme Hatası:", error);
    res.status(500).json({ success: false, message: 'Firma eklenirken sunucu hatası oluştu.' });
  }
});

// ======================================================
// 6. FİRMA SİL
// ======================================================
router.delete('/:id', protect, async (req, res) => {
  try {
    const company = await Company.findByPk(req.params.id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Bulunamadı' });
    }

    // Resmi klasörden sil
    if (company.logo_url) {
      const filePath = path.join(__dirname, '../../uploads/images', company.logo_url);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (err) {
          console.log("Dosya silinemedi (önemsiz):", err.message);
        }
      }
    }

    await company.destroy();
    res.json({ success: true, message: 'Silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Silinemedi' });
  }
});

// ======================================================
// 7. FİRMA GÜNCELLE
// ======================================================
router.put('/:id', protect, upload.any(), async (req, res) => {
  try {
    const { name, sector, category } = req.body;
    const company = await Company.findByPk(req.params.id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Bulunamadı' });
    }

    company.name = name;
    company.sector = sector;
    company.category = category;

    // Yeni dosya varsa güncelle
    const file = req.files && req.files.length > 0 ? req.files[0] : null;

    if (file) {
      // Eski resmi sil
      if (company.logo_url) {
        const oldPath = path.join(__dirname, '../../uploads/images', company.logo_url);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      company.logo_url = file.filename;
    }

    await company.save();
    res.json({ success: true, message: 'Güncellendi', data: company });
  } catch (error) {
    console.error("Güncelleme Hatası:", error);
    res.status(500).json({ success: false, message: 'Güncellenirken hata oluştu' });
  }
});

module.exports = router;