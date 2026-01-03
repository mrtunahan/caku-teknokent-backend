const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stakeholder = sequelize.define('Stakeholder', {
  name: { type: DataTypes.STRING, allowNull: false },
  logo_url: { type: DataTypes.STRING, allowNull: true },
  link: { type: DataTypes.STRING, allowNull: true } // Tıklanınca gidilecek site
});

module.exports = Stakeholder;