const JobApplication = require('../models/JobApplication');
const fs = require('fs').promises; // Asenkron fs
const path = require('path');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Başvuru Oluştur
exports.createApplication = async (req, res) => {
  try {
    // Dosya yüklendi mi kontrol et
    const cvPath = req.file ? req.file.filename : null;

    const application = await JobApplication.create({
      ...req.body, // Formdan gelen metin verileri
      cv_dosya_yolu: cvPath
    });

    res.status(201).json({
      success: true,
      message: 'Başvurunuz başarıyla alındı.',
      data: application
    });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Başvuruları Listele
exports.getAllApplications = async (req, res) => {
  try {
    const apps = await JobApplication.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: apps });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Başvuru Sil
exports.deleteApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const application = await JobApplication.findByPk(id);
    
    if (!application) {
      return res.status(404).json({ success: false, message: 'Başvuru bulunamadı' });
    }

    // Varsa CV dosyasını güvenli şekilde sil (YENİ EKLENEN KISIM)
    if (application.cv_dosya_yolu) {
        // CV'lerin yüklendiği klasör: uploads/cv
        const filePath = path.join(__dirname, '../../uploads/cv', application.cv_dosya_yolu);
        try {
            await fs.unlink(filePath);
            console.log('CV dosyası silindi:', application.cv_dosya_yolu);
        } catch (err) {
            console.warn('CV dosyası silinemedi (zaten yok olabilir):', err.message);
        }
    }

    await application.destroy();
    res.json({ success: true, message: 'Başvuru başarıyla silindi' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};