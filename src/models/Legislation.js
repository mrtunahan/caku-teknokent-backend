const { DataTypes } = require('sequelize');
const sequelize = require('../config/database'); // Veritabanı bağlantı dosyanız

const Legislation = sequelize.define('Legislation', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.ENUM('kanun', 'yonetmelik', 'yonerge'),
        allowNull: false
    },
    fileName: {
        type: DataTypes.STRING, // PDF dosya adı
        allowNull: false
    },
    order: {
        type: DataTypes.INTEGER, // Sıralama için gerekli alan
        defaultValue: 0
    }
}, {
    tableName: 'legislations',
    timestamps: true
});

module.exports = Legislation;