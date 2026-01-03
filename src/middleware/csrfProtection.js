/**
 * CSRF Token Middleware
 * Double-submit cookie pattern ile CSRF saldırılarına karşı koruma
 */

const crypto = require('crypto');

// CSRF token oluştur
const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// CSRF token middleware
const csrfProtection = (req, res, next) => {
  // Şimdilik CSRF korumasını devre dışı bırak
  // Frontend'de CSRF token implementasyonu yapıldıktan sonra aktif edilecek
  return next();

  // --- Aşağısı şimdilik devre dışı ---
  /*
  if (req.path.startsWith('/auth')) {
    return next();
  }

  if (process.env.NODE_ENV !== 'production') {
    return next();
  }

  if (req.method === 'GET') {
    const token = generateCsrfToken();
    res.cookie('XSRF-TOKEN', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'Strict',
      maxAge: 3600000
    });
    res.locals.csrfToken = token;
  }

  if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
    const token = req.headers['x-csrf-token'] || req.body._csrf;
    const cookieToken = req.cookies['XSRF-TOKEN'];

    if (!token || !cookieToken || token !== cookieToken) {
      return res.status(403).json({
        success: false,
        message: 'CSRF token doğrulanması başarısız. Lütfen sayfayı yenileyin.'
      });
    }
  }
  */
};

// CSRF token'ı response'a ekle
const getCsrfToken = (req, res) => {
  const token = generateCsrfToken();
  res.cookie('XSRF-TOKEN', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: 3600000
  });

  res.json({
    success: true,
    csrfToken: token,
    message: 'CSRF token generated'
  });
};

module.exports = {
  generateCsrfToken,
  csrfProtection,
  getCsrfToken
};