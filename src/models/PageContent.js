const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const PageContent = sequelize.define('PageContent', {
  slug: {
    type: DataTypes.STRING, 
    allowNull: false,
    unique: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  content: {
    type: DataTypes.TEXT, 
    allowNull: true
  },
  // EKSİK OLAN KISIM BURASIYDI:
  file_url: { 
    type: DataTypes.STRING,
    allowNull: true
  }
});

module.exports = PageContent;