const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ContactInfo = sequelize.define('ContactInfo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  phone_1: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ana telefon numarası'
  },
  phone_1_label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Ana telefon etiketi (örn: Sekreterya)'
  },
  phone_2: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İkinci telefon numarası'
  },
  phone_2_label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İkinci telefon etiketi (örn: Müdür)'
  },
  phone_3: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Üçüncü telefon numarası (faks vb.)'
  },
  phone_3_label: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Üçüncü telefon etiketi (örn: Faks)'
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'İletişim e-posta adresi'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Açık adres bilgisi'
  },
  map_lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
    comment: 'Harita enlem (latitude)'
  },
  map_lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
    comment: 'Harita boylam (longitude)'
  },
  map_embed: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Google Maps embed kodu'
  },
}, {
  timestamps: true,
  tableName: 'ContactInfo'
});

module.exports = ContactInfo;