const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Identity = sequelize.define('Identity', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    title: {
        type: DataTypes.STRING,
        allowNull: false
    },
    fileName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    // ✅ YENİ: Dosya uzantısı (frontend'de gösterim için)
    fileType: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'identities',
    timestamps: true
});

module.exports = Identity;