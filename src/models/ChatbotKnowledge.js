const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ChatbotKnowledge = sequelize.define('ChatbotKnowledge', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: false,
    index: true
    // Örnek: 'firma', 'haber', 'sayfa', 'destek', 'takım', 'olay', 'mevzuat'
  },
  keywords: {
    type: DataTypes.TEXT,
    allowNull: false
    // Virgülle ayrılmış keyword'ler: "firma,şirket,işletme"
  },
  question: {
    type: DataTypes.TEXT,
    allowNull: false
    // Örnek soru: "Hangi firmalar teknokent'te var?"
  },
  answer: {
    type: DataTypes.TEXT,
    allowNull: false
    // Cevap metni
  },
  sourceType: {
    type: DataTypes.STRING(50),
    // 'company', 'news', 'page', 'support', 'team', 'tto', 'legislation', 'booking'
  },
  sourceId: {
    type: DataTypes.INTEGER,
    // Hangi kaydın ID'si (firma ID, haber ID vs)
  },
  priority: {
    type: DataTypes.INTEGER,
    defaultValue: 0
    // Aynı anahtar sözcükler için öncelik (yüksek = daha önemli)
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    index: true
  },
  searchCount: {
    type: DataTypes.INTEGER,
    defaultValue: 0
    // Kaç kez sorgulandı (analiz için)
  }
}, {
  timestamps: true,
  indexes: [
    { fields: ['category', 'isActive'] },
    { fields: ['sourceType', 'sourceId'] }
  ]
});

module.exports = ChatbotKnowledge;
