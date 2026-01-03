const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const JobApplication = sequelize.define('JobApplication', {
  ad_soyad: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: { isEmail: true }
  },
  basvuru_tipi: { // 'is' veya 'staj'
    type: DataTypes.STRING,
    allowNull: false
  },
  firma_adi: {
    type: DataTypes.STRING,
    allowNull: false
  },
  yetkinlikler: {
    type: DataTypes.TEXT
  },
  github_link: {
    type: DataTypes.STRING
  },
  cv_dosya_yolu: { // Yüklenen dosyanın adı burada tutulacak
    type: DataTypes.STRING,
    allowNull: true 
  },
  motivasyon_mektubu: {
    type: DataTypes.TEXT
  }
});

module.exports = JobApplication;