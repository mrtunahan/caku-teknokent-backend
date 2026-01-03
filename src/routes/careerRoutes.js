const express = require('express');
const router = express.Router();
const careerController = require('../controllers/careerController');
const upload = require('../middleware/uploadMiddleware');
const { protect } = require('../middleware/authMiddleware'); // Admin koruması

// Başvuru yapma (Frontend'de input name="cv" olmalı)
router.post('/apply', upload.single('cv'), careerController.createApplication);

// Başvuruları listeleme (Sadece admin görebilir)
router.get('/list', protect, careerController.getAllApplications);
router.delete('/:id', protect, careerController.deleteApplication);

module.exports = router;