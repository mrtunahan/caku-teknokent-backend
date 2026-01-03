// models/Company.js
// Bu dosya muhtemelen zaten var, ancak referans olması için ekliyorum

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Company = sequelize.define('Company', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Firma adı'
  },
  sector: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Firma sektörü (örn: YAZILIM, ENERJİ, MEDİKAL)'
  },
  category: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'arge',
    comment: 'Firma kategorisi'
  },
  logo_url: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Logo dosya adı (uploads/images klasöründe)'
  }
}, {
  tableName: 'companies',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['sector']
    },
    {
      fields: ['category']
    }
  ]
});

module.exports = Company;
