const getCorsOrigins = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const FRONTEND_URL = process.env.FRONTEND_URL;

  // İzin verilen originler
  const allowedOrigins = [
    // Production
    'https://cakuteknokent.com.tr',
    'https://www.cakuteknokent.com.tr',
    'http://cakuteknokent.com.tr',
    'http://www.cakuteknokent.com.tr',
    // Development
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5176',
  ];

  // FRONTEND_URL varsa ekle
  if (FRONTEND_URL && !allowedOrigins.includes(FRONTEND_URL)) {
    allowedOrigins.push(FRONTEND_URL);
  }

  return allowedOrigins;
};

const corsOptions = {
  origin: function(origin, callback) {
    const allowedOrigins = getCorsOrigins();
    // origin yoksa (Postman gibi) veya izin verilenler arasındaysa kabul et
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('❌ CORS blocked:', origin);
      callback(new Error('CORS not allowed'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token'],
  maxAge: 86400,
  optionsSuccessStatus: 200
};

module.exports = corsOptions;