// routes/internshipRoutes.js
const express = require('express');
const router = express.Router();
const InternshipAd = require('../models/InternshipAd');
const JobApplication = require('../models/JobApplication');
const { Op } = require('sequelize');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

// Multer setup - CV yükleme için
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/cv');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    cb(null, `cv_${timestamp}_${randomStr}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Sadece PDF, DOC veya DOCX dosyaları kabul edilir'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// 1. Yeni İlan Ekleme
router.post('/add', async (req, res) => {
    try {
        let { deadline, type, ...otherData } = req.body;

        if (deadline && deadline.includes('.') && !deadline.includes('-')) {
            const parts = deadline.split('.');
            if (parts.length === 3) {
                deadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        const validTypes = ['Zorunlu Staj', 'Gönüllü Staj', 'Yaz Stajı', 'İş İlanı'];
        const finalType = validTypes.includes(type) ? type : 'Zorunlu Staj';

        const newAd = await InternshipAd.create({
            ...otherData,
            deadline: deadline || null,
            type: finalType,
            isActive: true
        });
        
        res.status(201).json({ success: true, data: newAd });
    } catch (error) {
        console.error("Kayıt Hatası Detay:", error);
        res.status(500).json({ success: false, message: "İlan kaydedilemedi.", error: error.message });
    }
});

// 2. İş İlanı Ekleme
router.post('/job-ads/add', async (req, res) => {
    try {
        let { deadline, ...otherData } = req.body;

        if (deadline && deadline.includes('.') && !deadline.includes('-')) {
            const parts = deadline.split('.');
            if (parts.length === 3) {
                deadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        const newAd = await InternshipAd.create({
            ...otherData,
            deadline: deadline || null,
            type: 'İş İlanı',
            isActive: true
        });
        
        res.status(201).json({ success: true, data: newAd });
    } catch (error) {
        console.error("İş İlanı Kayıt Hatası Detay:", error);
        res.status(500).json({ success: false, message: "İş ilanı kaydedilemedi.", error: error.message });
    }
});

// 3. Staj İlanlarını Listeleme
router.get('/staj', async (req, res) => {
    try {
        const ads = await InternshipAd.findAll({
            where: {
                type: { [Op.or]: ['Zorunlu Staj', 'Gönüllü Staj', 'Yaz Stajı'] },
                isActive: true
            },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 4. İş İlanlarını Listeleme
router.get('/is', async (req, res) => {
    try {
        const ads = await InternshipAd.findAll({
            where: {
                type: 'İş İlanı',
                isActive: true
            },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 5. Tüm İlanlar (Admin Paneli İçin)
router.get('/all', async (req, res) => {
    try {
        const ads = await InternshipAd.findAll({ order: [['createdAt', 'DESC']] });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 6. Root GET - Tüm Aktif İlanlar
router.get('/', async (req, res) => {
    try {
        const ads = await InternshipAd.findAll({
            where: { isActive: true },
            order: [['createdAt', 'DESC']]
        });
        res.json({ success: true, data: ads });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 7. İlan Detayı Getirme
router.get('/:id', async (req, res) => {
    try {
        const ad = await InternshipAd.findByPk(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'İlan bulunamadı.' });
        }
        res.json({ success: true, data: ad });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// 8. CV ile Başvuru Yap (YENİ - Direkt CV yükle ve mail gönder)
router.post('/:id/apply', upload.single('cv'), async (req, res) => {
    try {
        const { id } = req.params;
        const { applicantName, applicantEmail, applicantPhone } = req.body;

        // 1. İlanı bul
        const ilan = await InternshipAd.findByPk(id);
        if (!ilan) {
            return res.status(404).json({ success: false, message: 'İlan bulunamadı.' });
        }

        // 2. CV dosyası kontrolü
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Lütfen CV dosyası yükleyin.' });
        }

        // 3. İlan sahibinin email kontrolü
        if (!ilan.contactEmail) {
            return res.status(400).json({ success: false, message: 'İlan sahibinin email adresi bulunamadı.' });
        }

        // 4. Email transporter oluştur
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        // 5. İlan türünü belirle
        const ilanTuru = ilan.type === 'İş İlanı' ? 'iş ilanına' : 'staj ilanına';

        // 6. Mail içeriği
        const mailOptions = {
            from: `"ÇAKÜ Teknokent Kariyer" <${process.env.EMAIL_USER}>`,
            to: ilan.contactEmail,
            subject: `Yeni Başvuru: ${ilan.position} - ${ilan.companyName}`,
            html: `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px;">
                    <div style="background: white; border-radius: 10px; padding: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.2);">
                        
                        <div style="text-align: center; margin-bottom: 30px;">
                            <h1 style="color: #667eea; margin: 0; font-size: 24px;">📩 Yeni Başvuru</h1>
                            <p style="color: #888; margin-top: 5px;">${ilan.position} - ${ilan.companyName}</p>
                        </div>
                        
                        <div style="background: #f8f9fa; border-radius: 10px; padding: 20px; margin-bottom: 20px;">
                            <p style="font-size: 16px; color: #333; line-height: 1.8; margin: 0;">
                                Merhaba,<br><br>
                                Ben ilgili ${ilanTuru} başvuru yapmak istiyorum.<br><br>
                                İyi günler.
                            </p>
                        </div>

                        ${applicantName || applicantEmail || applicantPhone ? `
                        <div style="background: #e8f4fd; border-radius: 10px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #667eea;">
                            <h3 style="color: #667eea; margin: 0 0 15px 0; font-size: 14px; text-transform: uppercase;">Başvuran Bilgileri</h3>
                            ${applicantName ? `<p style="margin: 5px 0; color: #333;"><strong>Ad Soyad:</strong> ${applicantName}</p>` : ''}
                            ${applicantEmail ? `<p style="margin: 5px 0; color: #333;"><strong>E-posta:</strong> ${applicantEmail}</p>` : ''}
                            ${applicantPhone ? `<p style="margin: 5px 0; color: #333;"><strong>Telefon:</strong> ${applicantPhone}</p>` : ''}
                        </div>
                        ` : ''}

                        <div style="background: #fff3cd; border-radius: 10px; padding: 15px; margin-bottom: 20px; border-left: 4px solid #ffc107;">
                            <p style="margin: 0; color: #856404; font-size: 14px;">
                                <strong>📎 Ek:</strong> CV dosyası bu e-postaya eklenmiştir.
                            </p>
                        </div>

                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        
                        <div style="text-align: center;">
                            <p style="color: #888; font-size: 12px; margin: 0;">
                                Bu e-posta ÇAKÜ Teknokent Kariyer Portalı üzerinden otomatik olarak gönderilmiştir.
                            </p>
                        </div>
                    </div>
                </div>
            `,
            attachments: [
                {
                    filename: req.file.originalname,
                    path: req.file.path
                }
            ]
        };

        // 7. Email gönder
        await transporter.sendMail(mailOptions);

        // 8. Başarılı yanıt
        res.json({
            success: true,
            message: 'Başvurunuz başarıyla gönderildi! CV\'niz ilan sahibine iletildi.'
        });

    } catch (error) {
        console.error('Başvuru hatası:', error);
        
        // Hata durumunda yüklenen dosyayı sil
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Dosya silme hatası:', err);
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Başvuru gönderilemedi. Lütfen tekrar deneyin.', 
            error: error.message 
        });
    }
});

// 9. Eski Başvuru Endpoint'i (Geriye Uyumluluk)
router.post('/:ilanId/basvuru', async (req, res) => {
    try {
        const { ilanId } = req.params;
        const { userId } = req.body;

        const ilan = await InternshipAd.findByPk(ilanId);
        if (!ilan) {
            return res.status(404).json({ success: false, message: 'İlan bulunamadı.' });
        }

        const application = await JobApplication.findOne({
            where: { id: userId }
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Başvuru kaydı bulunamadı.' });
        }

        if (!application.cv_dosya_yolu) {
            return res.status(400).json({ success: false, message: 'CV dosyası yüklenmemiş.' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const cvPath = path.join(__dirname, '../../uploads/cv', application.cv_dosya_yolu);

        if (!fs.existsSync(cvPath)) {
            return res.status(400).json({ success: false, message: 'CV dosyası sunucuda bulunamadı.' });
        }

        const ilanTuru = ilan.type === 'İş İlanı' ? 'iş ilanına' : 'staj ilanına';

        const mailOptions = {
            from: `"ÇAKÜ Teknokent" <${process.env.EMAIL_USER}>`,
            to: ilan.contactEmail || process.env.EMAIL_USER,
            subject: `Yeni Başvuru: ${application.ad_soyad} - ${ilan.position} (${ilan.companyName})`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #005696; border-radius: 10px; background-color: #f9f9f9;">
                    <h2 style="color: #005696;">Yeni İlan Başvurusu</h2>
                    <hr style="border: 0; border-top: 2px solid #005696;">
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.8;">
                        Merhaba,<br><br>
                        Ben ilgili ${ilanTuru} başvuru yapmak istiyorum.<br><br>
                        İyi günler.
                    </p>
                    
                    <h3>İlan Bilgileri</h3>
                    <p><strong>Pozisyon:</strong> ${ilan.position}</p>
                    <p><strong>Şirket:</strong> ${ilan.companyName}</p>
                    <p><strong>Lokasyon:</strong> ${ilan.location || 'Belirtilmemiş'}</p>
                    <p><strong>İlan Türü:</strong> ${ilan.type}</p>
                    
                    <h3>Başvuran Bilgileri</h3>
                    <p><strong>Ad Soyad:</strong> ${application.ad_soyad}</p>
                    <p><strong>Email:</strong> ${application.email}</p>
                    
                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #888; font-size: 12px;">
                        <strong>Ek:</strong> CV dosyası bu e-postaya ekli olarak gönderilmiştir.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: application.cv_dosya_yolu,
                    path: cvPath
                }
            ]
        };

        await transporter.sendMail(mailOptions);

        res.json({
            success: true,
            message: 'Başvurunuz başarıyla şirkete gönderildi.'
        });

    } catch (error) {
        console.error('Başvuru gönderme hatası:', error);
        res.status(500).json({ success: false, message: 'Başvuru gönderilemedi.', error: error.message });
    }
});

// 10. İlan Silme
router.delete('/:id', async (req, res) => {
    try {
        const ad = await InternshipAd.findByPk(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'İlan bulunamadı.' });
        }
        
        await ad.destroy();
        res.json({ success: true, message: 'İlan başarıyla silindi.' });
    } catch (error) {
        console.error('İlan silme hatası:', error);
        res.status(500).json({ success: false, message: 'İlan silinemedi.', error: error.message });
    }
});

// 11. CV Yükleme (Eski endpoint - geriye uyumluluk)
router.post('/submit-cv', upload.single('cv'), async (req, res) => {
    try {
        const { adId, position, contactEmail } = req.body;
        
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'CV dosyası bulunamadı' });
        }

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"ÇAKÜ Teknokent" <${process.env.EMAIL_USER}>`,
            to: contactEmail || process.env.EMAIL_USER,
            subject: `Yeni CV Başvurusu: ${position}`,
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #005696; border-radius: 10px; background-color: #f9f9f9;">
                    <h2 style="color: #005696;">Yeni CV Başvurusu</h2>
                    <hr style="border: 0; border-top: 2px solid #005696;">
                    
                    <p style="font-size: 16px; color: #333; line-height: 1.8;">
                        Merhaba,<br><br>
                        Ben ilgili ilana başvuru yapmak istiyorum.<br><br>
                        İyi günler.
                    </p>
                    
                    <p><strong>Pozisyon:</strong> ${position}</p>
                    <p><strong>CV Dosyası:</strong> ${req.file.originalname}</p>
                    <p><strong>Tarih:</strong> ${new Date().toLocaleString('tr-TR')}</p>

                    <hr style="border: 0; border-top: 1px solid #ddd; margin: 20px 0;">
                    <p style="color: #888; font-size: 12px;">
                        CV dosyası bu e-postaya ekli olarak gönderilmiştir.
                    </p>
                </div>
            `,
            attachments: [
                {
                    filename: req.file.originalname,
                    path: req.file.path
                }
            ]
        };

        await transporter.sendMail(mailOptions);
        res.json({ success: true, message: 'CV başarıyla gönderildi!' });

    } catch (error) {
        console.error('CV gönderme hatası:', error);
        if (req.file && req.file.path) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Dosya silme hatası:', err);
            });
        }
        res.status(500).json({ success: false, message: 'CV işlenirken bir hata oluştu', error: error.message });
    }
});

// 11. Staj İlanı Güncelleme (PUT)
router.put('/:id', async (req, res) => {
    try {
        let { deadline, type, ...otherData } = req.body;

        if (deadline && deadline.includes('.') && !deadline.includes('-')) {
            const parts = deadline.split('.');
            if (parts.length === 3) {
                deadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        const ad = await InternshipAd.findByPk(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
        }

        await ad.update({
            ...otherData,
            deadline: deadline || ad.deadline,
            type: type || ad.type
        });

        res.json({ success: true, data: ad, message: 'Staj ilanı başarıyla güncellendi' });
    } catch (error) {
        console.error("İlan Güncelleme Hatası:", error);
        res.status(500).json({ success: false, message: "İlan güncellenemedi.", error: error.message });
    }
});

// 12. İş İlanı Güncelleme (PUT)
router.put('/job-ads/:id', async (req, res) => {
    try {
        let { deadline, ...otherData } = req.body;

        if (deadline && deadline.includes('.') && !deadline.includes('-')) {
            const parts = deadline.split('.');
            if (parts.length === 3) {
                deadline = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        const ad = await InternshipAd.findByPk(req.params.id);
        if (!ad) {
            return res.status(404).json({ success: false, message: 'İlan bulunamadı' });
        }

        await ad.update({
            ...otherData,
            deadline: deadline || ad.deadline,
            type: 'İş İlanı'
        });

        res.json({ success: true, data: ad, message: 'İş ilanı başarıyla güncellendi' });
    } catch (error) {
        console.error("İş İlanı Güncelleme Hatası:", error);
        res.status(500).json({ success: false, message: "İş ilanı güncellenemedi.", error: error.message });
    }
});

module.exports = router;