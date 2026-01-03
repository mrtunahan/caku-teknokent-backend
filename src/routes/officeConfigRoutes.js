const express = require('express');
const router = express.Router();
const OfficeConfig = require('../models/OfficeConfig');
const { protect } = require('../middleware/authMiddleware');

// =====================
// PUBLIC ROUTES
// =====================

// GET /api/office-config - Tüm aktif ayarları getir (Hesaplayıcı için)
router.get('/', async (req, res) => {
  try {
    const configs = await OfficeConfig.findAll({
      where: { isActive: true },
      order: [['type', 'ASC'], ['createdAt', 'ASC']]
    });

    // Frontend'in beklediği formata dönüştür
    const ofisTurleri = {};
    let isletmeGideri = 150;
    let kdvOrani = 1.20;
    let minMetrekare = 10;
    let maxMetrekare = 500;

    configs.forEach(config => {
      if (config.type === 'ofis') {
        ofisTurleri[config.key] = {
          fiyat: parseFloat(config.value),
          label: config.label,
          icon: config.icon || '🏢',
          aciklama: config.description || ''
        };
      } else if (config.key === 'isletmeGideri') {
        isletmeGideri = parseFloat(config.value);
      } else if (config.key === 'kdvOrani') {
        kdvOrani = parseFloat(config.value);
      } else if (config.key === 'minMetrekare') {
        minMetrekare = parseFloat(config.value);
      } else if (config.key === 'maxMetrekare') {
        maxMetrekare = parseFloat(config.value);
      }
    });

    res.json({
      success: true,
      data: {
        ofisTurleri,
        isletmeGideri,
        kdvOrani,
        minMetrekare,
        maxMetrekare,
        paraBirimi: '₺'
      }
    });
  } catch (error) {
    console.error('Office Config Error:', error);
    res.status(500).json({ success: false, message: 'Ayarlar yüklenemedi.' });
  }
});

// POST /api/office-config/calculate - Hesaplama yap
router.post('/calculate', async (req, res) => {
  try {
    const { ofisTuru, metrekare } = req.body;

    if (!ofisTuru || !metrekare || metrekare <= 0) {
      return res.status(400).json({ success: false, message: 'Geçersiz parametreler.' });
    }

    // İlgili ofis türünü bul
    const ofisConfig = await OfficeConfig.findOne({
      where: { key: ofisTuru, type: 'ofis', isActive: true }
    });

    if (!ofisConfig) {
      return res.status(404).json({ success: false, message: 'Ofis türü bulunamadı.' });
    }

    // Genel ayarları al
    const genelAyarlar = await OfficeConfig.findAll({
      where: { type: 'genel', isActive: true }
    });

    let isletmeGideri = 150;
    let kdvOrani = 1.20;

    genelAyarlar.forEach(ayar => {
      if (ayar.key === 'isletmeGideri') isletmeGideri = parseFloat(ayar.value);
      if (ayar.key === 'kdvOrani') kdvOrani = parseFloat(ayar.value);
    });

    const ofisFiyat = parseFloat(ofisConfig.value);
    const m2 = parseFloat(metrekare);

    const kiraBedeli = m2 * ofisFiyat;
    const isletmeGideriToplam = m2 * isletmeGideri;
    const teminatTutari = kiraBedeli * kdvOrani * 3;
    const aylikToplam = kiraBedeli + isletmeGideriToplam;

    res.json({
      success: true,
      data: {
        ofisTuru,
        ofisBilgi: {
          fiyat: ofisFiyat,
          label: ofisConfig.label,
          icon: ofisConfig.icon
        },
        metrekare: m2,
        kiraBedeli,
        isletmeGideriToplam,
        teminatTutari,
        aylikToplam,
        kdvOrani,
        paraBirimi: '₺'
      }
    });
  } catch (error) {
    console.error('Calculate Error:', error);
    res.status(500).json({ success: false, message: 'Hesaplama yapılamadı.' });
  }
});

// =====================
// ADMIN ROUTES (Auth gerekli)
// =====================

// GET /api/office-config/admin - Tüm ayarları getir (Admin için)
router.get('/admin', protect, async (req, res) => {
  try {
    const configs = await OfficeConfig.findAll({
      order: [['type', 'ASC'], ['createdAt', 'ASC']]
    });
    res.json({ success: true, data: configs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Veriler yüklenemedi.' });
  }
});

// POST /api/office-config - Yeni ayar ekle
router.post('/', protect, async (req, res) => {
  try {
    const { key, type, label, value, icon, description } = req.body;

    if (!key || value === undefined) {
      return res.status(400).json({ success: false, message: 'Anahtar ve değer zorunludur.' });
    }

    // Aynı key var mı kontrol et
    const existing = await OfficeConfig.findOne({ where: { key } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bu anahtar zaten mevcut.' });
    }

    const config = await OfficeConfig.create({
      key,
      type: type || 'genel',
      label,
      value,
      icon: icon || '🏢',
      description
    });

    res.status(201).json({ success: true, data: config, message: 'Ayar eklendi.' });
  } catch (error) {
    console.error('Create Error:', error);
    res.status(500).json({ success: false, message: 'Eklenemedi.' });
  }
});

// PUT /api/office-config/:id - Ayarı güncelle
router.put('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const { key, type, label, value, icon, description, isActive } = req.body;

    const config = await OfficeConfig.findByPk(id);
    if (!config) {
      return res.status(404).json({ success: false, message: 'Ayar bulunamadı.' });
    }

    await config.update({
      key: key || config.key,
      type: type || config.type,
      label: label !== undefined ? label : config.label,
      value: value !== undefined ? value : config.value,
      icon: icon || config.icon,
      description: description !== undefined ? description : config.description,
      isActive: isActive !== undefined ? isActive : config.isActive
    });

    res.json({ success: true, data: config, message: 'Güncellendi.' });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ success: false, message: 'Güncellenemedi.' });
  }
});

// DELETE /api/office-config/:id - Ayarı sil
router.delete('/:id', protect, async (req, res) => {
  try {
    const { id } = req.params;
    const config = await OfficeConfig.findByPk(id);

    if (!config) {
      return res.status(404).json({ success: false, message: 'Ayar bulunamadı.' });
    }

    await config.destroy();
    res.json({ success: true, message: 'Silindi.' });
  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, message: 'Silinemedi.' });
  }
});

// POST /api/office-config/seed - Varsayılan değerleri oluştur
router.post('/seed', protect, async (req, res) => {
  try {
    const count = await OfficeConfig.count();
    if (count > 0) {
      return res.json({ success: false, message: 'Ayarlar zaten mevcut.' });
    }

    await OfficeConfig.bulkCreate([
      { key: 'AR-GE', type: 'ofis', label: 'AR-GE Ofisi', value: 850, icon: '🔬', description: 'Araştırma ve Geliştirme faaliyetleri için' },
      { key: 'Kulucka', type: 'ofis', label: 'Kuluçka Merkezi', value: 650, icon: '🚀', description: 'Yeni girişimler ve startuplar için' },
      { key: 'isletmeGideri', type: 'genel', label: 'İşletme Gideri', value: 150, icon: '📋', description: 'Metrekare başına işletme gideri' },
      { key: 'kdvOrani', type: 'genel', label: 'KDV Oranı', value: 1.20, icon: '💰', description: 'KDV çarpanı (1.20 = %20)' },
      { key: 'minMetrekare', type: 'genel', label: 'Min. Metrekare', value: 10, icon: '📏', description: 'Minimum kiralanabilir alan' },
      { key: 'maxMetrekare', type: 'genel', label: 'Max. Metrekare', value: 500, icon: '📐', description: 'Maximum kiralanabilir alan' }
    ]);

    res.json({ success: true, message: 'Varsayılan ayarlar oluşturuldu.' });
  } catch (error) {
    console.error('Seed Error:', error);
    res.status(500).json({ success: false, message: 'Seed işlemi başarısız.' });
  }
});

module.exports = router;