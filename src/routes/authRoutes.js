const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { createTransporter } = require('../utils/mailer');
const User = require('../models/User'); 
const { protect } = require('../middleware/authMiddleware');
const rateLimit = require('express-rate-limit');

// Auth endpoints için strict rate limiter (Brute force koruması)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 3, // 15 dakikada sadece 3 deneme (çok katı)
  skipSuccessfulRequests: true, // Başarılı girişleri saymaz
  message: { success: false, message: 'Çok fazla giriş denemesi. 15 dakika bekleyiniz.' },
  standardHeaders: true,
  legacyHeaders: false
});

// --- 1. LOGIN (GİRİŞ) ---
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Şifre hatalı.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      message: 'Giriş başarılı.',
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });

  } catch (error) {
    console.error('Login Hatası:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

// --- 2. YENİ YÖNETİCİ EKLEME (Register - Sadece Adminler) ---
// *** EKSİK OLAN 3. ADIM BURASI ***
router.post('/register', protect, async (req, res) => {
  try {
    const { username, password, email } = req.body;

    // Kullanıcı adı dolu mu?
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }

    // Şifreyi hashle
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Kullanıcıyı oluştur
    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: 'admin' 
    });

    res.status(201).json({ success: true, message: 'Yeni yönetici başarıyla oluşturuldu.', user: newUser });

  } catch (error) {
    console.error('Register Hatası:', error);
    res.status(500).json({ success: false, message: 'Kayıt oluşturulamadı.' });
  }
});

// --- 3. ŞİFREMİ UNUTTUM (Mail Gönderme) ---
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const token = crypto.randomBytes(20).toString('hex');
    // Token'ı hashle ve DB'ye kaydet (güvenlik için)
    user.resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 dakika
    await user.save();

    const transporter = createTransporter();

    // GÜVENLİK DÜZELTMESİ: URL'i .env dosyasından alıyoruz
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/admin/reset-password/${token}`;

    await transporter.sendMail({
      from: `"ÇAKÜ Teknokent" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: 'Şifre Sıfırlama Talebi',
      html: `<p>Şifrenizi sıfırlamak için tıklayın: <a href="${resetLink}">${resetLink}</a></p>`
    });

    res.json({ success: true, message: 'Mail gönderildi.' });

  } catch (error) {
    console.error('Forgot Password Error:', error);
    res.status(500).json({ success: false, message: 'Mail gönderilemedi.' });
  }
});

// --- 4. ŞİFRE SIFIRLAMA (Token ile - Giriş Yapmadan) ---
router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Token'ı hashle ve DB'deki hashed token ile karşılaştır
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      where: {
        resetPasswordToken: hashedToken,
        resetPasswordExpire: { [Op.gt]: Date.now() }
      }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Geçersiz veya süresi dolmuş bağlantı.' });
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    user.resetPasswordToken = null;
    user.resetPasswordExpire = null;
    
    await user.save();

    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });

  } catch (error) {
    console.error('Reset Password Error:', error);
    res.status(500).json({ success: false, message: 'İşlem başarısız.' });
  }
});

// --- 5. ŞİFRE GÜNCELLEME (Giriş Yapmış Admin İçin) ---
// DÜZELTME: 'protect' kullanarak kodu temizledik ve güvenli hale getirdik.
router.put('/update-password', protect, async (req, res) => {
  try {
    // req.user, protect middleware'inden geliyor (User ID içerir)
    const user = await User.findByPk(req.user.id);
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'Kullanıcı bulunamadı.' });
    }

    const { oldPassword, newPassword } = req.body;

    // Eski Şifre Doğru mu?
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Mevcut şifreniz hatalı.' });
    }

    // Yeni Şifreyi Hashle ve Kaydet
    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    res.json({ success: true, message: 'Şifreniz başarıyla güncellendi.' });

  } catch (error) {
    console.error('Update Password Error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası.' });
  }
});

module.exports = router;