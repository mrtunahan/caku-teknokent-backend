const News = require('../models/News');
const fs = require('fs').promises;
const path = require('path');
const { handleError } = require('../utils/errorHandler');

// Güvenli dosya silme
const safeDeleteFile = async (imageUrl) => {
  if (!imageUrl) return;
  
  try {
    let fileName;
    if (imageUrl.startsWith('/uploads/images/')) {
      fileName = imageUrl.replace('/uploads/images/', '');
    } else if (imageUrl.startsWith('uploads/images/')) {
      fileName = imageUrl.replace('uploads/images/', '');
    } else {
      fileName = path.basename(imageUrl);
    }
    
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

// Çoklu dosya silme
const deleteMultipleFiles = async (urls) => {
  if (!urls || !Array.isArray(urls)) return;
  for (const url of urls) {
    await safeDeleteFile(url);
  }
};

// Yeni Haber Ekle
exports.createNews = async (req, res) => {
  try {
    // Ana kapak resmi (ilk dosya)
    let imagePath = null;
    let galleryPaths = [];

    if (req.files && req.files.length > 0) {
      // İlk resim = kapak resmi
      const mainImageFile = req.files.find(f => f.fieldname === 'image' || f.fieldname === 'resim');
      const galleryFiles = req.files.filter(f => f.fieldname === 'galleryFiles' || f.fieldname === 'gallery');

      if (mainImageFile) {
        imagePath = `/uploads/images/${mainImageFile.filename}`;
      }
      
      // Diğer resimler = galeri
      if (galleryFiles.length > 0) {
        galleryPaths = galleryFiles.map(f => `/uploads/images/${f.filename}`);
      }
    }

    // Eğer body'de gallery varsa (mevcut resimler)
    let existingGallery = [];
    if (req.body.gallery) {
      try {
        existingGallery = JSON.parse(req.body.gallery);
      } catch (e) {
        existingGallery = [];
      }
    }

    const newItem = await News.create({
      title: req.body.title,
      category: req.body.category || 'haberler',
      date: req.body.date,
      content: req.body.content,
      link: req.body.link,
      image_url: imagePath,
      gallery: [...existingGallery, ...galleryPaths]
    });

    res.status(201).json({ success: true, data: newItem });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Tümünü Listele
exports.getAllNews = async (req, res) => {
  try {
    const news = await News.findAll({
      attributes: ['id', 'title', 'category', 'date', 'image_url', 'content', 'link', 'gallery', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: news });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Tekil Haber Getir
exports.getNewsById = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await News.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Haber bulunamadı' });
    }

    res.json({ success: true, data: item });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Güncelle
exports.updateNews = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({ success: false, message: 'Haber bulunamadı' });
    }

    let imagePath = news.image_url;
    let newGalleryPaths = [];

    // Yeni dosyalar yüklendiyse
    if (req.files && req.files.length > 0) {
      // İlk dosya kapak resmi olarak mı geldi?
      const mainImageFile = req.files.find(f => f.fieldname === 'image' || f.fieldname === 'resim');
      const galleryFiles = req.files.filter(f => f.fieldname === 'galleryFiles' || f.fieldname === 'gallery');

      if (mainImageFile) {
        // Eski kapak resmini sil
        if (news.image_url) {
          await safeDeleteFile(news.image_url);
        }
        imagePath = `/uploads/images/${mainImageFile.filename}`;
      }

      // Galeri resimleri
      if (galleryFiles.length > 0) {
        newGalleryPaths = galleryFiles.map(f => `/uploads/images/${f.filename}`);
      }
    }

    // Mevcut galeri + silinen resimler
    let currentGallery = news.gallery || [];
    
    // Silinecek resimler
    if (req.body.deletedImages) {
      try {
        const deletedImages = JSON.parse(req.body.deletedImages);
        await deleteMultipleFiles(deletedImages);
        currentGallery = currentGallery.filter(img => !deletedImages.includes(img));
      } catch (e) {
        console.warn('Silinen resimler parse edilemedi');
      }
    }

    // Body'den gelen mevcut galeri
    if (req.body.gallery) {
      try {
        currentGallery = JSON.parse(req.body.gallery);
      } catch (e) {}
    }

    // Güncelle
    await news.update({
      title: req.body.title || news.title,
      category: req.body.category || news.category,
      date: req.body.date || news.date,
      content: req.body.content !== undefined ? req.body.content : news.content,
      link: req.body.link !== undefined ? req.body.link : news.link,
      image_url: imagePath,
      gallery: [...currentGallery, ...newGalleryPaths]
    });

    res.json({ success: true, data: news, message: 'Haber güncellendi' });

  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Sil
exports.deleteNews = async (req, res) => {
  try {
    const { id } = req.params;
    const item = await News.findByPk(id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı' });
    }

    // Kapak resmini sil
    if (item.image_url) {
      await safeDeleteFile(item.image_url);
    }

    // Galeri resimlerini sil
    if (item.gallery && item.gallery.length > 0) {
      await deleteMultipleFiles(item.gallery);
    }

    await item.destroy();
    res.json({ success: true, message: 'Silindi' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Galeri resmi ekle (ayrı endpoint)
exports.addGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({ success: false, message: 'Haber bulunamadı' });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Resim yüklenmedi' });
    }

    const newImageUrl = `/uploads/images/${req.file.filename}`;
    const currentGallery = news.gallery || [];
    
    await news.update({
      gallery: [...currentGallery, newImageUrl]
    });

    res.json({ success: true, data: { url: newImageUrl }, message: 'Resim eklendi' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Galeri resmi sil (ayrı endpoint)
exports.removeGalleryImage = async (req, res) => {
  try {
    const { id } = req.params;
    const { imageUrl } = req.body;
    
    const news = await News.findByPk(id);

    if (!news) {
      return res.status(404).json({ success: false, message: 'Haber bulunamadı' });
    }

    // Dosyayı sil
    await safeDeleteFile(imageUrl);

    // Galeriden kaldır
    const currentGallery = news.gallery || [];
    const updatedGallery = currentGallery.filter(img => img !== imageUrl);
    
    await news.update({ gallery: updatedGallery });

    res.json({ success: true, message: 'Resim silindi' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};