const express = require('express');
const router = express.Router();
const controller = require('../controllers/legalController');
const upload = require('../middleware/pdfUpload'); 
const { protect } = require('../middleware/authMiddleware');

router.get('/', controller.getAll);
router.post('/', protect, upload.single('file'), controller.create);
router.delete('/:id', protect, controller.delete);

module.exports = router;