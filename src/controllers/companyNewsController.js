const { CompanyNews } = require('../models');
const fs = require('fs');
const path = require('path');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

exports.createNews = async (req, res) => {
  try {
    const { title, content, companyName } = req.body;
    let imagePath = null;

    if (req.file) {
      imagePath = `/uploads/images/${req.file.filename}`;
    }

    const news = await CompanyNews.create({
      title,
      content,
      companyName,
      image: imagePath
    });

    res.status(201).json({ message: 'Firma haberi başarıyla oluşturuldu.', news });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

exports.getAllNews = async (req, res) => {
  try {
    const news = await CompanyNews.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json(news);
  } catch (error) {
    return handleError(error, res, 500);
  }
};

exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await CompanyNews.findByPk(id);

    if (!news) return res.status(404).json({ error: 'Haber bulunamadı.' });

    // Varsa resmi sil
    if (news.image) {
        const filePath = path.join(__dirname, '../../', news.image);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }

    await news.destroy();
    res.json({ message: 'Haber silindi.' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};