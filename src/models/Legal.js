const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

// ✅ DÜZELTİLDİ: Artık ayrı bir 'legals' tablosu kullanıyor
const Legal = sequelize.define('Legal', {
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
    // ✅ YENİ: Kategori alanı (kvkk, cerez, gizlilik)
    category: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'kvkk'
    },
    // ✅ YENİ: Dosya uzantısı
    fileType: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'legals', // ✅ DÜZELTİLDİ: 'identities' değil, 'legals' tablosu
    timestamps: true
});

module.exports = Legal;