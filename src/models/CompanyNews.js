const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const CompanyNews = sequelize.define('CompanyNews', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT, // Rich text (HTML) içerik için
    allowNull: false
  },
  companyName: {
    type: DataTypes.STRING, // Haberin hangi firmaya ait olduğu
    allowNull: true
  },
  image: {
    type: DataTypes.STRING,
    allowNull: true
  },
  publishDate: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true,
  tableName: 'company_news'
});

module.exports = CompanyNews;