const Contact = require('../models/Contact');
const { handleError, handleValidationError, handleAuthError, handleForbiddenError, handleNotFoundError } = require('../utils/errorHandler');

// Mesaj Gönder (Public)
exports.sendMessage = async (req, res) => {
  try {
    const newMessage = await Contact.create(req.body);
    res.status(201).json({ success: true, message: 'Mesajınız iletildi.', data: newMessage });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Mesajları Listele (Admin)
exports.getAllMessages = async (req, res) => {
  try {
    const messages = await Contact.findAll({ order: [['createdAt', 'DESC']] });
    res.json({ success: true, data: messages });
  } catch (error) {
    return handleError(error, res, 500);
  }
};

// Mesaj Sil (Admin)
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await Contact.destroy({ where: { id } });
    res.json({ success: true, message: 'Mesaj silindi' });
  } catch (error) {
    return handleError(error, res, 500);
  }
};