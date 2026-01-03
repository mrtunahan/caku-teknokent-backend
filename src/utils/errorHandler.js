/**
 * Güvenli Hata İşleme Utility
 * Production'da detaylı hata mesajları gizler
 * Development'ta debugging için detayları gösterir
 */

const handleError = (error, res, statusCode = 500) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Production: Detaylı bilgi gizle
  const response = {
    success: false,
    message: 'Sunucu tarafında bir hata oluştu.'
  };

  // Development: Debugging için detayları göster
  if (isDevelopment) {
    response.error = error.message;
    response.stack = error.stack;
  }

  // Console'a her zaman log et (admin görmek için)
  console.error('🔥 Hata:', {
    status: statusCode,
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  });

  return res.status(statusCode).json(response);
};

// Validasyon hatası (400)
const handleValidationError = (error, res) => {
  return handleError(error, res, 400);
};

// Yetkilendirme hatası (401)
const handleAuthError = (error, res) => {
  return handleError(error, res, 401);
};

// Yasaklanan hata (403)
const handleForbiddenError = (error, res) => {
  return handleError(error, res, 403);
};

// Bulunamadı hatası (404)
const handleNotFoundError = (message, res) => {
  const error = new Error(message || 'Kayıt bulunamadı');
  return handleError(error, res, 404);
};

module.exports = {
  handleError,
  handleValidationError,
  handleAuthError,
  handleForbiddenError,
  handleNotFoundError
};
