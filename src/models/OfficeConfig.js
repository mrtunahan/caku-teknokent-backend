const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfficeConfig = sequelize.define('OfficeConfig', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  key: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'genel'
  },
  label: {
    type: DataTypes.STRING,
    allowNull: true
  },
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  icon: {
    type: DataTypes.STRING,
    defaultValue: '🏢'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  tableName: 'office_configs',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['key']
    }
  ]
});

module.exports = OfficeConfig;