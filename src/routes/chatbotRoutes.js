const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

// Chatbot endpoint'i için rate limiter (DoS koruması)
const chatbotLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 dakika
  max: 20, // 1 dakikada maksimum 20 istek
  message: { success: false, message: 'Çok fazla istek gönderdiniz. Lütfen biraz bekleyin.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Herkese açık - rate limit ile korunan
router.post('/', chatbotLimiter, chatbotController.chat);

// Admin endpoints
router.post('/knowledge/add', protect, chatbotController.addKnowledge);
router.put('/knowledge/:id', protect, chatbotController.updateKnowledge);
router.delete('/knowledge/:id', protect, chatbotController.deleteKnowledge);
router.get('/knowledge/list', protect, chatbotController.listKnowledge);
router.get('/statistics', protect, chatbotController.getStatistics);

// Seed endpoint (admin only)
router.post('/seed', protect, chatbotController.seedData);

module.exports = router;