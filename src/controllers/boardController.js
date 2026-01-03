const BoardMember = require('../models/BoardMember');
const fs = require('fs').promises;
const path = require('path');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Güvenli dosya silme - Path Traversal'a karşı koruma
const safeDeleteFile = async (fileName) => {
  if (!fileName) return;
  // Sadece dosya adı olmalı, path içermemeli
  if (fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
    console.warn(`⚠️ Güvenlik uyarısı: Şüpheli dosya adı - ${fileName}`);
    return;
  }
  try {
    await fs.unlink(path.join(__dirname, '../../uploads/images', fileName));
  } catch (e) {
    console.error(`Dosya silinirken hata: ${fileName}`, e.message);
  }
};

exports.getAll = async (req, res) => {
  try {
    // Başkan en üstte görünsün diye sıralama ekledik
    const members = await BoardMember.findAll({ order: [['is_chairman', 'DESC'], ['createdAt', 'ASC']] });
    res.json({ success: true, data: members });
  } catch (error) { return handleError(error, res, 500); }
};

exports.create = async (req, res) => {
  try {
    const imagePath = req.file ? `uploads/images/${req.file.filename}` : null;
    const member = await BoardMember.create({ ...req.body, image_url: imagePath });
    res.status(201).json({ success: true, data: member });
  } catch (error) { return handleError(error, res, 500); }
};

exports.update = async (req, res) => {
  try {
    const member = await BoardMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Bulunamadı' });

    let imagePath = member.image_url;
    if (req.file) {
      imagePath = `uploads/images/${req.file.filename}`;
      if (member.image_url) {
        await safeDeleteFile(path.basename(member.image_url));
      }
    }
    await member.update({ ...req.body, image_url: imagePath });
    res.json({ success: true, data: member });
  } catch (error) { return handleError(error, res, 500); }
};

exports.delete = async (req, res) => {
  try {
    const member = await BoardMember.findByPk(req.params.id);
    if (!member) return res.status(404).json({ message: 'Bulunamadı' });
    if (member.image_url) {
        await safeDeleteFile(path.basename(member.image_url));
    }
    await member.destroy();
    res.json({ success: true, message: 'Silindi' });
  } catch (error) { return handleError(error, res, 500); }
};