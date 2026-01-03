const PageContent = require('../models/PageContent');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Sayfa İçeriğini Getir
exports.getPage = async (req, res) => {
  try {
    const { slug } = req.params;
    let page = await PageContent.findOne({ where: { slug } });
    
    if (!page) {
      page = await PageContent.create({ 
        slug, 
        title: slug.toUpperCase(), 
        content: "<p>İçerik henüz girilmemiş.</p>" 
      });
    }

    res.json({ success: true, data: page });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Sayfa İçeriğini Güncelle (DOSYA YÜKLEME DAHİL)
exports.updatePage = async (req, res) => {
  try {
    const { slug } = req.params;
    const { title, content } = req.body;
    
    let page = await PageContent.findOne({ where: { slug } });
    
    // 1. Mevcut dosya yolunu al
    let fileUrl = page ? page.file_url : null;

    // 2. Eğer yeni dosya yüklendiyse dosya ismini güncelle
    if (req.file) {
        fileUrl = req.file.filename;
    }
    
    if (!page) {
        page = await PageContent.create({ 
            slug, 
            title, 
            content,
            file_url: fileUrl 
        });
    } else {
        await page.update({ 
            title, 
            content,
            file_url: fileUrl 
        });
    }

    res.json({ success: true, message: "Sayfa ve dosya güncellendi.", data: page });
  } catch (error) {
    console.error("Update Page Error:", error);
    return handleError(error, res, 500);
  }
};

// Ofis Resim Yükle
exports.uploadOfficeImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: "Dosya seçilmedi" });
    }

    const imagePath = `uploads/images/${req.file.filename}`;
    res.json({ success: true, imageUrl: imagePath });
  } catch (error) {
    console.error("Upload Office Image Error:", error);
    return handleError(error, res, 500);
  }
};