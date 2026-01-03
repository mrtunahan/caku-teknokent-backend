const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Room = sequelize.define('Room', {
  name: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  capacity: { 
    type: DataTypes.INTEGER,
    allowNull: false
  },
  features: { 
    type: DataTypes.JSON,
    defaultValue: [],
    comment: "Salon özelliklerinin JSON array'si"
  },
  image_url: { 
    type: DataTypes.STRING,
    comment: "Salon resmi URL'si"
  },
  description: { 
    type: DataTypes.TEXT,
    comment: 'Salon detaylı açıklaması'
  },
  tagline: {
    type: DataTypes.STRING,
    comment: 'Salon türü/etiketi (VIP, Konferans vb.)'
  }
});

module.exports = Room;