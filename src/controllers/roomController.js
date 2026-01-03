const { Room } = require('../models');
const path = require('path');
const fs = require('fs');

// Tüm salonları getir
exports.getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: rooms });
  } catch (error) {
    console.error('Salonlar getirilirken hata:', error);
    res.status(500).json({ success: false, message: 'Salonlar getirilirken hata oluştu' });
  }
};

// Tek salon getir
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findByPk(req.params.id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }
    res.json({ success: true, data: room });
  } catch (error) {
    console.error('Salon getirilirken hata:', error);
    res.status(500).json({ success: false, message: 'Salon getirilirken hata oluştu' });
  }
};

// Yeni salon oluştur
exports.createRoom = async (req, res) => {
  try {
    const { name, capacity, features, tagline, description } = req.body;

    if (!name || !capacity) {
      return res.status(400).json({ success: false, message: 'Salon adı ve kapasite zorunludur' });
    }

    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : null;

    // Features string ise JSON'a çevir
    let parsedFeatures = features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch (e) {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }

    const room = await Room.create({
      name,
      capacity: parseInt(capacity),
      features: parsedFeatures || [],
      tagline,
      description,
      image_url: imageUrl
    });

    res.status(201).json({ success: true, data: room, message: 'Salon başarıyla oluşturuldu' });
  } catch (error) {
    console.error('Salon oluşturulurken hata:', error);
    res.status(500).json({ success: false, message: 'Salon oluşturulurken hata oluştu' });
  }
};

// Salon güncelle
exports.updateRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, capacity, features, tagline, description } = req.body;

    const room = await Room.findByPk(id);
    if (!room) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }

    // Eski resmi sil
    if (req.file && room.image_url) {
      const oldImagePath = path.join(__dirname, '../../', room.image_url);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    // Yeni resim varsa URL'yi güncelle
    const imageUrl = req.file ? `/uploads/images/${req.file.filename}` : room.image_url;

    // Features string ise JSON'a çevir
    let parsedFeatures = features || room.features;
    if (typeof features === 'string') {
      try {
        parsedFeatures = JSON.parse(features);
      } catch (e) {
        parsedFeatures = features.split(',').map(f => f.trim());
      }
    }

    await room.update({
      name: name || room.name,
      capacity: capacity ? parseInt(capacity) : room.capacity,
      features: parsedFeatures,
      tagline: tagline || room.tagline,
      description: description || room.description,
      image_url: imageUrl
    });

    res.json({ success: true, data: room, message: 'Salon başarıyla güncellendi' });
  } catch (error) {
    console.error('Salon güncellenirken hata:', error);
    res.status(500).json({ success: false, message: 'Salon güncellenirken hata oluştu' });
  }
};

// Salon sil
exports.deleteRoom = async (req, res) => {
  try {
    const { id } = req.params;
    const room = await Room.findByPk(id);

    if (!room) {
      return res.status(404).json({ success: false, message: 'Salon bulunamadı' });
    }

    // Resmi sil
    if (room.image_url) {
      const imagePath = path.join(__dirname, '../../', room.image_url);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await room.destroy();
    res.json({ success: true, message: 'Salon başarıyla silindi' });
  } catch (error) {
    console.error('Salon silinirken hata:', error);
    res.status(500).json({ success: false, message: 'Salon silinirken hata oluştu' });
  }
};
