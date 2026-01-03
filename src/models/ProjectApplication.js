const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ProjectApplication = sequelize.define('ProjectApplication', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // Girişimci/Firma Bilgileri
  adiniz_soyadiniz: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'adiniz_soyadiniz'
  },
  tc_kimlik_no: {
    type: DataTypes.STRING(11),
    allowNull: false,
    field: 'tc_kimlik_no',
    validate: {
      len: [11, 11],
      isNumeric: true
    }
  },
  email: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  telefon: {
    type: DataTypes.STRING(20),
    allowNull: false
  },
  egitim_durumu: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'egitim_durumu'
  },
  sirketlesme_durumu: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'sirketlesme_durumu'
  },
  
  // Proje Genel Bilgileri
  proje_adi: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'proje_adi'
  },
  proje_alani: {
    type: DataTypes.STRING(200),
    allowNull: true,
    field: 'proje_alani'
  },
  nace_kodu: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'nace_kodu'
  },
  anahtar_kelimeler: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'anahtar_kelimeler'
  },
  
  // Proje Detayları ve AR-GE Niteliği
  proje_ozeti: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'proje_ozeti'
  },
  yenilikci_yonu: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'yenilikci_yonu'
  },
  kullanilacak_yontem: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'kullanilacak_yontem'
  },
  pazar_ticarillesme: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'pazar_ticarillesme'
  },
  
  // Talep ve Onay
  talep_edilen_ofis: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'talep_edilen_ofis'
  },
  personel_sayisi: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'personel_sayisi'
  },
  kvkk_onay: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    field: 'kvkk_onay'
  },
  
  // Başvuru Durumu
  basvuru_durumu: {
    type: DataTypes.ENUM('beklemede', 'onaylandi', 'reddedildi'),
    defaultValue: 'beklemede',
    field: 'basvuru_durumu'
  },
  basvuru_tarihi: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    field: 'basvuru_tarihi'
  }
}, {
  tableName: 'project_applications',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['tc_kimlik_no']
    },
    {
      fields: ['basvuru_durumu']
    }
  ]
});

module.exports = ProjectApplication;