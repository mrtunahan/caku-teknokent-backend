const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const News = sequelize.define('News', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'haberler'
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false
  },
  image_url: {
    type: DataTypes.STRING,
    allowNull: true
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true
  },
  gallery: {
    type: DataTypes.TEXT,
    allowNull: true,
    get() {
      const val = this.getDataValue('gallery');
      try {
        return val ? JSON.parse(val) : [];
      } catch (e) {
        return val ? [val] : [];
      }
    },
    set(value) {
      this.setDataValue('gallery', Array.isArray(value) ? JSON.stringify(value) : JSON.stringify([value]));
    }
  }
}, {
  tableName: 'News',
  freezeTableName: true
});

module.exports = News;