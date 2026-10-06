const nodemailer = require('nodemailer');

// SMTP ayarları .env'den okunur (EMAIL_HOST, EMAIL_PORT, EMAIL_SECURE, EMAIL_USER, EMAIL_PASS)
const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 465;
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: process.env.EMAIL_SECURE ? process.env.EMAIL_SECURE === 'true' : port === 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

module.exports = { createTransporter };
