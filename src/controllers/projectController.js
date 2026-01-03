const sendEmail = require('../utils/emailService');
const ProjectApplication = require('../models/ProjectApplication');
const axios = require('axios');
const ExcelJS = require('exceljs');
const { fn, col } = require('sequelize');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

class ProjectController {
  // Yeni başvuru oluştur
  async createApplication(req, res) {
    try {
      const applicationData = req.body;
      
      // Validasyon
      if (!applicationData.adiniz_soyadiniz || !applicationData.tc_kimlik_no || 
          !applicationData.email || !applicationData.proje_adi) {
        return res.status(400).json({
          success: false,
          message: 'Zorunlu alanlar eksik!'
        });
      }

      // KVKK onayı kontrolü
      if (!applicationData.kvkk_onay) {
        return res.status(400).json({
          success: false,
          message: 'KVKK onayı gereklidir!'
        });
      }

      // Başvuru oluştur
      const newApplication = await ProjectApplication.create(applicationData);
      
      // E-posta gönder (arka planda)
      sendEmail(
        newApplication.email,
        "Proje Başvurunuz Alındı",
        `Sayın <b>${newApplication.adiniz_soyadiniz}</b>,<br><br>
        <b>"${newApplication.proje_adi}"</b> isimli proje başvurunuz sistemimize başarıyla kaydedilmiştir.<br>
        Başvurunuz uzmanlarımız tarafından değerlendirildikten sonra size dönüş yapılacaktır.<br><br>
        Saygılarımızla,<br>Çankırı Teknokent Yönetimi`
      ).catch(err => console.error("E-posta arka planda gönderilemedi:", err));
      
      res.status(201).json({
        success: true,
        message: 'Başvurunuz başarıyla alındı!',
        data: newApplication
      });

    } catch (error) {
      console.error('Başvuru oluşturma hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Excel'e dışa aktar
  async exportProjectsExcel(req, res) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Projeler');

      // Başlıklar
      worksheet.columns = [
        { header: 'ID', key: 'id', width: 10 },
        { header: 'Ad Soyad', key: 'adiniz_soyadiniz', width: 30 },
        { header: 'Proje Adı', key: 'proje_adi', width: 40 },
        { header: 'Durum', key: 'basvuru_durumu', width: 15 },
        { header: 'Tarih', key: 'basvuru_tarihi', width: 20 },
      ];

      const projects = await ProjectApplication.findAll();

      // Veriyi ekle
      projects.forEach(project => {
        worksheet.addRow(project.toJSON());
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=projeler.xlsx');

      await workbook.xlsx.write(res);
      res.end();

    } catch (error) {
      console.error('Excel dışa aktarma hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Tüm başvuruları listele
  async getAllApplications(req, res) {
    try {
      const { page = 1, limit = 10, durum } = req.query;
      const offset = (parseInt(page) - 1) * limit;

      const whereClause = durum ? { basvuru_durumu: durum } : {};

      const applications = await ProjectApplication.findAndCountAll({
        where: whereClause,
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['basvuru_tarihi', 'DESC']]
      });

      res.json({
        success: true,
        data: applications.rows,
        pagination: {
          total: applications.count,
          page: parseInt(page),
          totalPages: Math.ceil(applications.count / limit)
        }
      });

    } catch (error) {
      console.error('Başvuruları listeleme hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Tekil başvuru getir
  async getApplicationById(req, res) {
    try {
      const { id } = req.params;
      const application = await ProjectApplication.findByPk(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Başvuru bulunamadı'
        });
      }

      res.json({
        success: true,
        data: application
      });

    } catch (error) {
      console.error('Başvuru getirme hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Başvuru durumunu güncelle
  async updateApplicationStatus(req, res) {
    try {
      const { id } = req.params;
      const { basvuru_durumu } = req.body;

      const application = await ProjectApplication.findByPk(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Başvuru bulunamadı'
        });
      }

      await application.update({ basvuru_durumu });

      res.json({
        success: true,
        message: 'Başvuru durumu güncellendi',
        data: application
      });

    } catch (error) {
      console.error('Durum güncelleme hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // E-posta ile arama
  async searchByEmail(req, res) {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'E-posta adresi gerekli'
        });
      }

      const applications = await ProjectApplication.findAll({
        where: { email },
        order: [['basvuru_tarihi', 'DESC']]
      });

      res.json({
        success: true,
        data: applications,
        count: applications.length
      });

    } catch (error) {
      console.error('E-posta arama hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // TC ile arama
  async searchByTC(req, res) {
    try {
      const { tc } = req.query;

      if (!tc) {
        return res.status(400).json({
          success: false,
          message: 'TC Kimlik No gerekli'
        });
      }

      const applications = await ProjectApplication.findAll({
        where: { tc_kimlik_no: tc },
        order: [['basvuru_tarihi', 'DESC']]
      });

      res.json({
        success: true,
        data: applications,
        count: applications.length
      });

    } catch (error) {
      console.error('TC arama hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Başvuruyu güncelle
  async updateApplication(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const application = await ProjectApplication.findByPk(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Başvuru bulunamadı'
        });
      }

      await application.update(updateData);

      res.json({
        success: true,
        message: 'Başvuru başarıyla güncellendi',
        data: application
      });

    } catch (error) {
      console.error('Güncelleme hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Başvuruyu sil
  async deleteApplication(req, res) {
    try {
      const { id } = req.params;

      const application = await ProjectApplication.findByPk(id);

      if (!application) {
        return res.status(404).json({
          success: false,
          message: 'Başvuru bulunamadı'
        });
      }

      await application.destroy();

      res.json({
        success: true,
        message: 'Başvuru başarıyla silindi'
      });

    } catch (error) {
      console.error('Silme hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // İstatistikler
  async getStatistics(req, res) {
    try {
      const totalApplications = await ProjectApplication.count();
      const pendingApplications = await ProjectApplication.count({
        where: { basvuru_durumu: 'beklemede' }
      });
      const approvedApplications = await ProjectApplication.count({
        where: { basvuru_durumu: 'onaylandi' }
      });
      const rejectedApplications = await ProjectApplication.count({
        where: { basvuru_durumu: 'reddedildi' }
      });

      // Son 30 günde yapılan başvurular
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentApplications = await ProjectApplication.count({
        where: {
          basvuru_tarihi: {
            [require('sequelize').Op.gte]: thirtyDaysAgo
          }
        }
      });

      res.json({
        success: true,
        data: {
          toplam_basvuru: totalApplications,
          bekleyen: pendingApplications,
          onaylanan: approvedApplications,
          reddedilen: rejectedApplications,
          son_30_gun: recentApplications
        }
      });

    } catch (error) {
      console.error('İstatistik hatası:', error);
      return handleError(error, res, 500);
    }
  }

  // Proje alanlarına göre grupla
  async getApplicationsByField(req, res) {
    try {
      const results = await ProjectApplication.findAll({
        attributes: [
          'proje_alani',
          [fn('COUNT', col('id')), 'count']
        ],
        group: ['proje_alani'],
        order: [[fn('COUNT', col('id')), 'DESC']]
      });

      res.json({
        success: true,
        data: results
      });

    } catch (error) {
      console.error('Gruplama hatası:', error);
      return handleError(error, res, 500);
    }
  }
}

module.exports = new ProjectController();
