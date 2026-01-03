const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const TtoService = sequelize.define('TtoService', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    iconKey: { // Frontend'deki ikon ismini tutacak (örn: 'lightbulb')
        type: DataTypes.STRING,
        defaultValue: 'lightbulb'
    },
    colorTheme: { // Renk temasını tutacak (örn: 'blue', 'red')
        type: DataTypes.STRING,
        defaultValue: 'blue'
    },
    items: { // Alt maddeleri JSON listesi olarak tutacağız ["Madde 1", "Madde 2"]
        type: DataTypes.JSON,
        defaultValue: []
    }
}, {
    tableName: 'tto_services',
    timestamps: true
});

module.exports = TtoService;