// src/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const sendEmail = require('../utils/emailService');
const { handleError, handleValidationError, handleAuthError } = require('../utils/errorHandler');

const createToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });
};

class AuthController {
  
  // Yönetici Girişi
  async login(req, res) {
    const { username, password } = req.body;
    try {
      const user = await User.findOne({ where: { username } });
      if (!user) return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı' });

      const isValid = await user.validPassword(password);
      if (!isValid) return res.status(401).json({ success: false, message: 'Hatalı şifre' });

      const token = createToken(user.id);
      res.json({ success: true, token, user: { id: user.id, username: user.username, role: user.role } });
    } catch (error) {
      return handleError(error, res, 500);
    }
  }

  // İlk Yöneticiyi Oluşturmak (E-posta alanı eklendi)
  async register(req, res) {
    const { username, password, email } = req.body; // email eklendi
    try {
      const user = await User.create({ username, password, email });
      const token = createToken(user.id);
      res.status(201).json({ success: true, token, user });
    } catch (error) {
      return handleValidationError(error, res);
    }
  }

  // Şifre Değiştirme (Login olmuş kullanıcı için)
  async changePassword(req, res) {
     try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.id);
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) return res.status(400).json({ success: false, message: "Eski şifre hatalı!" });
      
      // Yeni şifreyi hashle
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      user.password = hashedPassword;
      await user.save();
      res.json({ success: true, message: "Şifreniz güncellendi." });
    } catch (error) {
      return handleError(error, res, 500);
    }
  }

  // YENİ: Şifremi Unuttum (Token Gönderimi)
  async forgotPassword(req, res) {
    const { email } = req.body;
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(404).json({ success: false, message: "Bu e-posta ile kayıtlı kullanıcı bulunamadı." });
      }

      // Token oluştur (20 byte hex)
      const resetToken = crypto.randomBytes(20).toString('hex');

      // Token'ı hashle ve DB'ye kaydet 
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      
      // Token süresi: 10 dakika
      user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; 

      await user.save();

      // Sıfırlama URL'i (Frontend'in çalıştığı port, genellikle 5173)
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/admin/reset-password/${resetToken}`;

      const message = `
        <h3>Şifre Sıfırlama Talebi</h3>
        <p>Hesabınız için şifre sıfırlama talebinde bulundunuz.</p>
        <p>Lütfen aşağıdaki linke tıklayarak yeni şifrenizi belirleyin:</p>
        <a href="${resetUrl}" clicktracking=off>${resetUrl}</a><br><br>
        <small>Bu link 10 dakika süreyle geçerlidir.</small>
      `;

      try {
        await sendEmail(user.email, 'Şifre Sıfırlama Talebi', message);
        res.json({ success: true, message: 'Sıfırlama e-postası gönderildi.' });
      } catch (err) {
        // Hata olursa tokenları temizle
        user.resetPasswordToken = null;
        user.resetPasswordExpire = null;
        await user.save();
        return res.status(500).json({ success: false, message: 'E-posta gönderilemedi.' });
      }

    } catch (error) {
      return handleError(error, res, 500);
    }
  }

  // YENİ: Şifre Sıfırlama (Yeni şifreyi kaydetme)
  async resetPassword(req, res) {
    try {
      // URL'den gelen token'ı hashleyip DB'deki ile karşılaştırıyoruz
      const resetPasswordToken = crypto.createHash('sha256').update(req.params.resetToken).digest('hex');

      const user = await User.findOne({
        where: {
          resetPasswordToken,
          resetPasswordExpire: { [require('sequelize').Op.gt]: Date.now() } // Süresi dolmamış olmalı
        }
      });

      if (!user) {
        return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş token.' });
      }

      // Yeni şifreyi kaydet ve tokenları temizle
      user.password = req.body.password;
      user.resetPasswordToken = null;
      user.resetPasswordExpire = null;
      await user.save();

      res.json({ success: true, message: 'Şifreniz başarıyla değiştirildi! Giriş yapabilirsiniz.' });

    } catch (error) {
      return handleError(error, res, 500);
    }
  }
}

module.exports = new AuthController();