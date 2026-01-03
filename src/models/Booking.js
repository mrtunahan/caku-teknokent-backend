const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Booking = sequelize.define('Booking', {
  title: { type: DataTypes.STRING, allowNull: false }, // Firma Adı
  start: { type: DataTypes.DATE, allowNull: false },
  end: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('beklemede', 'onaylandi', 'reddedildi'), defaultValue: 'beklemede' },
  contact_email: { type: DataTypes.STRING },
  contact_phone: { type: DataTypes.STRING },
  roomId: { type: DataTypes.INTEGER, allowNull: false } // Hangi oda?
});

module.exports = Booking;