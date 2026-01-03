const express = require('express');
const router = express.Router();
const { getContactInfo, updateContactInfo } = require('../controllers/contactInfoController');
const { protect } = require('../middleware/authMiddleware');

// Herkese açık - İletişim bilgilerini getir
router.get('/', getContactInfo);

// Sadece admin - İletişim bilgilerini güncelle
router.put('/', protect, updateContactInfo);

module.exports = router;
