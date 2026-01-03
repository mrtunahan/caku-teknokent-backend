const Stakeholder = require('../models/Stakeholder');
const fs = require('fs').promises;
const path = require('path');
const { handleError } = require('../utils/errorHandler');

// Güvenli dosya silme
const safeDeleteFile = async (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    // Dosya adını URL'den çıkar
    let fileName;
    if (imageUrl.startsWith('/uploads/images/')) {
      fileName = imageUrl.replace('/uploads/images/', '');
    } else if (imageUrl.startsWith('uploads/images/')) {
      fileName = imageUrl.replace('uploads/images/', '');
    } else {
      fileName = path.basename(imageUrl);
    }
    
    // Güvenlik kontrolü
    if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      console.warn(`⚠️ Güvenlik uyarısı: Şüpheli dosya adı - ${fileName}`);
      return;
    }
    
    const filePath = path.join(__dirname, '../../uploads/images', fileName);
    await fs.unlink(filePath);
    console.log('✅ Dosya silindi:', fileName);
  } catch (err) {
    console.warn('⚠️ Dosya silinemedi:', err.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    const items = await Stakeholder.findAll();
    res.json({ success: true, data: items });
  } catch (error) { 
    return handleError(error, res, 500); 
  }
};

exports.create = async (req, res) => {
  try {
    // Dosya yolu HER ZAMAN /uploads/images/ ile başlasın
    const logoPath = req.file ? `/uploads/images/${req.file.filename}` : null;
    
    const item = await Stakeholder.create({ 
      ...req.body, 
      logo_url: logoPath 
    });
    
    res.status(201).json({ success: true, data: item });
  } catch (error) { 
    return handleError(error, res, 500); 
  }
};

exports.update = async (req, res) => {
  try {
    const item = await Stakeholder.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Bulunamadı' });
    }

    let logoPath = item.logo_url;
    
    // Yeni dosya yüklendiyse
    if (req.file) {
      logoPath = `/uploads/images/${req.file.filename}`;
      
      // Eski dosyayı sil
      if (item.logo_url) {
        await safeDeleteFile(item.logo_url);
      }
    }
    
    await item.update({ 
      ...req.body, 
      logo_url: logoPath 
    });
    
    res.json({ success: true, data: item });
  } catch (error) { 
    return handleError(error, res, 500); 
  }
};

exports.delete = async (req, res) => {
  try {
    const item = await Stakeholder.findByPk(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Bulunamadı' });
    }
    
    // Dosyayı sil
    if (item.logo_url) {
      await safeDeleteFile(item.logo_url);
    }
    
    await item.destroy();
    res.json({ success: true, message: 'Silindi' });
  } catch (error) { 
    return handleError(error, res, 500); 
  }
};