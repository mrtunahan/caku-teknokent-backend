// models/InternshipAd.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const InternshipAd = sequelize.define('InternshipAd', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    companyName: { type: DataTypes.STRING(255), allowNull: false },
    position: { type: DataTypes.STRING(255), allowNull: false },
    location: { type: DataTypes.STRING(255), allowNull: true },
    deadline: { type: DataTypes.DATEONLY, allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    requirements: { type: DataTypes.TEXT, allowNull: true },
    duration: { type: DataTypes.STRING(100), allowNull: true },
    quota: { type: DataTypes.INTEGER, allowNull: true },
    workType: { type: DataTypes.STRING(50), allowNull: true },
    viewCount: { type: DataTypes.INTEGER, defaultValue: 0 },
    contactEmail: { type: DataTypes.STRING(255), allowNull: true },
    contactPhone: { type: DataTypes.STRING(20), allowNull: true },
    type: {
        type: DataTypes.ENUM('Zorunlu Staj', 'Gönüllü Staj', 'İş İlanı', 'Yaz Stajı'),
        allowNull: false,
        defaultValue: 'Zorunlu Staj'
    },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
}, {
    tableName: 'internship_ads',
    timestamps: true
});

module.exports = InternshipAd;
