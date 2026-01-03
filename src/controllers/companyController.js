const Company = require('../models/Company');
const fs = require('fs').promises; // Asenkron fs
const path = require('path');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Yeni Firma Ekle
exports.createCompany = async (req, res) => {
  try {
    const logoPath = req.file ? `uploads/images/${req.file.filename}` : null;
    
    const newCompany = await Company.create({
      ...req.body,
      logo_url: logoPath
    });

    res.status(201).json({ success: true, data: newCompany });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Tüm Firmaları Listele
exports.getAllCompanies = async (req, res) => {
  try {
    const companies = await Company.findAll({ order: [['name', 'ASC']] });
    res.json({ success: true, data: companies });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Firma Sil
exports.deleteCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Firma bulunamadı' });
    }

    // Logo dosyasını güvenli şekilde sil
    if (company.logo_url) {
      const filePath = path.join(__dirname, '../../uploads/images', company.logo_url);
      try {
        await fs.unlink(filePath);
      } catch (err) {
        console.warn('Logo dosyası silinemedi:', err.message);
      }
    }

    await company.destroy();
    res.json({ success: true, message: 'Firma silindi' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Firma Güncelle
exports.updateCompany = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await Company.findByPk(id);

    if (!company) {
      return res.status(404).json({ success: false, message: 'Firma bulunamadı' });
    }

    let logoPath = company.logo_url;
    if (req.file) {
      logoPath = `uploads/images/${req.file.filename}`;
      
      // Eski logoyu güvenli şekilde sil
      if (company.logo_url) {
        const oldPath = path.join(__dirname, '../../uploads/images', company.logo_url);
        try {
            await fs.unlink(oldPath);
        } catch (err) {
            console.warn('Eski logo silinemedi:', err.message);
        }
      }
    }

    await company.update({
      name: req.body.name || company.name,
      sector: req.body.sector || company.sector,
      logo_url: logoPath
    });

    res.json({ success: true, data: company, message: 'Firma güncellendi' });

  } catch (error) {
    return handleError(error, res, 500);
  }
};