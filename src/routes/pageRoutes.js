const express = require('express');
const router = express.Router();
const pageController = require('../controllers/pageController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware'); // Dosya yükleme aracı (PDF/Word)
const imageUpload = require('../middleware/imageUpload'); // Resim yükleme aracı

// Public: Herkes okuyabilir
router.get('/:slug', pageController.getPage); 

// Protected: Admin güncellerken dosya ('file') da yükleyebilir
router.put('/:slug', protect, upload.single('file'), pageController.updatePage);

// Protected: Ofis resim yükleme
router.post('/upload-office-image', protect, imageUpload.single('image'), pageController.uploadOfficeImage);

module.exports = router;