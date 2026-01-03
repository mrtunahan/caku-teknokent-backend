const nodemailer = require('nodemailer');

const sendEmail = async (to, subject, text) => {
  try {
    // 1. Taşıyıcıyı (Transporter) Ayarla
    // NOT: Gmail kullanacaksanız "Uygulama Şifresi" almanız gerekir.
    // Test için 'ethereal' veya kendi SMTP bilgilerinizi girin.
    const transporter = nodemailer.createTransport({
      service: 'gmail', // veya 'hotmail', 'yahoo' vs.
      auth: {
        user: process.env.EMAIL_USER, // .env dosyasından alacak
        pass: process.env.EMAIL_PASS  // .env dosyasından alacak
      }
    });

    // 2. Mail Seçenekleri
    const mailOptions = {
      from: `"ÇAKÜ Teknokent" <${process.env.EMAIL_USER}>`,
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #005696;">ÇAKÜ Teknokent</h2>
          <p>${text}</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
          <small style="color: #888;">Bu e-posta otomatik olarak gönderilmiştir. Lütfen cevaplamayınız.</small>
        </div>
      `
    };

    // 3. Gönder
    await transporter.sendMail(mailOptions);
    console.log('✅ E-posta gönderildi: ' + to);
    return true;
  } catch (error) {
    console.error('❌ E-posta hatası:', error);
    return false;
  }
};

module.exports = sendEmail;