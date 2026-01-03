const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const { Op } = require('sequelize');
const { protect } = require('../middleware/authMiddleware');

// İlişkiyi Tanımla (Join işlemi için)
Booking.belongsTo(Room, { foreignKey: 'roomId' });

// --- 1. SALONLARI GETİR ---
router.get('/rooms', async (req, res) => {
  try {
    const rooms = await Room.findAll();
    res.json({ success: true, data: rooms });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Salonlar getirilemedi.' });
  }
});

// --- 2. SALON OLUŞTUR (Admin İçin) ---
router.post('/rooms', protect, async (req, res) => {
  try {
    const room = await Room.create(req.body);
    res.json({ success: true, data: room });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Hata.' });
  }
});

// --- 3. REZERVASYONLARI GETİR (Takvim İçin - Sadece Onaylı/Bekleyen) ---
router.get('/bookings/:roomId', async (req, res) => {
  try {
    const bookings = await Booking.findAll({
      where: { 
        roomId: req.params.roomId,
        status: { [Op.ne]: 'reddedildi' } 
      }
    });
    res.json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rezervasyonlar alınamadı.' });
  }
});

// --- 4. YENİ REZERVASYON YAP ---
router.post('/bookings', async (req, res) => {
  try {
    const { title, start, end, roomId, contact_email, contact_phone } = req.body;
    
    // Çakışma Kontrolü
    const conflict = await Booking.findOne({
      where: {
        roomId,
        status: { [Op.ne]: 'reddedildi' },
        [Op.or]: [
          { start: { [Op.between]: [start, end] } },
          { end: { [Op.between]: [start, end] } }
        ]
      }
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: 'Seçilen saatlerde salon dolu.' });
    }

    await Booking.create({ title, start, end, roomId, contact_email, contact_phone });
    res.json({ success: true, message: 'Rezervasyon talebiniz alındı.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Rezervasyon yapılamadı.' });
  }
});

// --- 5. TÜM REZERVASYONLARI GETİR (ADMIN PANELİ İÇİN) ---
router.get('/all', async (req, res) => {
    try {
      // Room modelini de dahil et ki hangi oda olduğunu görelim
      const bookings = await Booking.findAll({
        include: [{ model: Room, attributes: ['name'] }],
        order: [['createdAt', 'DESC']]
      });
      res.json({ success: true, data: bookings });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Veriler alınamadı.' });
    }
});

// --- 6. DURUM GÜNCELLE (ONAYLA / REDDET) ---
router.patch('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body; // 'onaylandi' veya 'reddedildi'
        const booking = await Booking.findByPk(req.params.id);
        
        if(!booking) return res.status(404).json({success: false, message: 'Bulunamadı'});

        booking.status = status;
        await booking.save();

        res.json({ success: true, message: `Rezervasyon ${status} olarak güncellendi.` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Hata oluştu.' });
    }
});

// --- 7. REZERVASYON SİL ---
router.delete('/:id', protect, async (req, res) => {
    try {
        await Booking.destroy({ where: { id: req.params.id } });
        res.json({ success: true, message: 'Silindi.' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Silinemedi.' });
    }
});

module.exports = router;