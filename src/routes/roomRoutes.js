const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const upload = require('../middleware/imageUpload');
const { protect } = require('../middleware/authMiddleware');

// Tüm salonları getir (Herkes görebilir)
router.get('/', roomController.getAllRooms);

// Tek salon getir
router.get('/:id', roomController.getRoomById);

// Admin işlemleri
// Yeni salon oluştur
router.post('/', protect, upload.single('image'), roomController.createRoom);

// Salon güncelle
router.put('/:id', protect, upload.single('image'), roomController.updateRoom);

// Salon sil
router.delete('/:id', protect, roomController.deleteRoom);

module.exports = router;
