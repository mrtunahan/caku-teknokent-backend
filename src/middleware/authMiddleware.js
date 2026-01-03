// src/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  let token;

  // Header'da "Authorization: Bearer <token>" var mı kontrol et
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // "Bearer " kısmını atıp sadece tokenı al
      token = req.headers.authorization.split(' ')[1];

      // Tokenı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Token içindeki ID'den kullanıcıyı bul ve request'e ekle
      req.user = await User.findByPk(decoded.id, {
        attributes: { exclude: ['password'] } // Şifreyi getirme
      });

      return next(); // Her şey yolundaysa sonraki işleme geç
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Yetkisiz işlem, geçersiz token' });
    }
  }

  // Token bulunamadıysa hata döndür ve DURDUR
  return res.status(401).json({ success: false, message: 'Yetkisiz işlem, token bulunamadı' });
};

module.exports = { protect };