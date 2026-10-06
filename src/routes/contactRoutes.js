const express = require('express');
const router = express.Router();
const Contact = require('../models/Contact');
const { createTransporter } = require('../utils/mailer');

const escapeHtml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

// --- İLETİŞİM FORMU GÖNDERME ---
router.post('/', async (req, res) => {
  try {
    const { name, ad_soyad, adSoyad, adiniz_soyadiniz, email, phone, telefon, tel, message, mesaj, icerik } = req.body;

    const finalName = name || ad_soyad || adSoyad || adiniz_soyadiniz;
    const finalMessage = message || mesaj || icerik;
    const finalPhone = phone || telefon || tel;

    if (!finalName || !finalMessage) {
        return res.status(400).json({ success: false, message: 'Eksik bilgi.' });
    }

    await Contact.create({
      name: finalName,
      email: email,
      phone: finalPhone,
      message: finalMessage
    });

    // Mesaj veritabanına kaydedildi; e-posta bildirimi başarısız olsa bile kullanıcıya hata dönme
    const notifyTo = process.env.CONTACT_EMAIL || process.env.EMAIL_USER;
    if (notifyTo) {
      try {
        const transporter = createTransporter();
        await transporter.sendMail({
          from: `"ÇAKÜ Teknokent İletişim" <${process.env.EMAIL_USER}>`,
          to: notifyTo,
          replyTo: email || undefined,
          subject: `Yeni İletişim Mesajı: ${finalName}`,
          html: `
            <h3>Yeni Mesaj</h3>
            <p><strong>İsim:</strong> ${escapeHtml(finalName)}</p>
            <p><strong>E-Posta:</strong> ${escapeHtml(email || '-')}</p>
            <p><strong>Telefon:</strong> ${escapeHtml(finalPhone || '-')}</p>
            <p><strong>Mesaj:</strong><br>${escapeHtml(finalMessage).replace(/\n/g, '<br>')}</p>
          `
        });
      } catch (mailError) {
        console.error('Contact Mail Error:', mailError.message);
      }
    }

    res.status(201).json({ success: true, message: 'Mesajınız iletildi.' });

  } catch (error) {
    console.error('Contact Error:', error);
    res.status(500).json({ success: false, message: 'Sunucu hatası oluştu.' });
  }
});

// --- TÜM MESAJLARI GETİR ---
router.get('/', async (req, res) => {
  try {
    const messages = await Contact.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: messages });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Veriler alınamadı.' });
  }
});

// --- MESAJ SİL (YENİ EKLENEN KISIM) ---
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Mesajı bul
    const contact = await Contact.findByPk(id);

    if (!contact) {
      return res.status(404).json({ success: false, message: 'Mesaj bulunamadı.' });
    }

    // Mesajı sil
    await contact.destroy();

    res.json({ success: true, message: 'Mesaj başarıyla silindi.' });

  } catch (error) {
    console.error('Delete Error:', error);
    res.status(500).json({ success: false, message: 'Silme işlemi sırasında hata oluştu.' });
  }
});

module.exports = router;