const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Stat = sequelize.define('Stat', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  count: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  iconKey: { // building, users, project, check
    type: DataTypes.STRING,
    defaultValue: 'building'
  },
  colorClass: {
    type: DataTypes.STRING,
    defaultValue: 'text-blue-600'
  }
}, {
  tableName: 'stats',
  timestamps: true
});

module.exports = Stat;