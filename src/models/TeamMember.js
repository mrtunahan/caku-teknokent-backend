const { DataTypes } = require("sequelize");
const sequelize = require("../config/database"); // Veritabanı bağlantı yolun

const TeamMember = sequelize.define("TeamMember", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  title: { // Ünvan (Örn: İdari İşler Sorumlusu)
    type: DataTypes.STRING,
    allowNull: false,
  },
  image: {
    type: DataTypes.STRING, // Resim URL'i
    allowNull: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  extension: { // Dahili No
    type: DataTypes.STRING,
    allowNull: true,
  },
  linkedin: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  order: { // Sıralama için
    type: DataTypes.INTEGER,
    defaultValue: 0
  }
});

module.exports = TeamMember;