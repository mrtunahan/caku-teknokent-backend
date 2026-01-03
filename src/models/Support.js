const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Support = sequelize.define('Support', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    type: {
        type: DataTypes.STRING, // 'TGB' veya 'CAKU'
        allowNull: false
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    iconKey: {
        type: DataTypes.STRING, // Frontend'deki ikon ismini tutar
        defaultValue: 'building'
    },
    colorTheme: {
        type: DataTypes.STRING, // 'blue', 'red' vb.
        defaultValue: 'blue'
    },
    details: {
        type: DataTypes.JSON, // Alt maddeleri dizi olarak tutar ["madde1", "madde2"]
        defaultValue: []
    }
}, {
    tableName: 'supports',
    timestamps: true
});

module.exports = Support;