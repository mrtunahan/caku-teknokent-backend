const { Sequelize } = require('sequelize');
require('dotenv').config();

let sequelize;

// PostgreSQL kullanıyoruz
try {
  console.log('📦 PostgreSQL Database kullanılıyor...');
  
  const password = process.env.DB_PASSWORD ? process.env.DB_PASSWORD : null;
  
  sequelize = new Sequelize(
    process.env.DB_NAME || 'caku_teknokent',
    process.env.DB_USER || 'postgres',
    password,
    {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      logging: false,
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
      }
    }
  );
} catch (error) {
  console.error('❌ Database bağlantı hatası:', error.message);
  process.exit(1);
}

module.exports = sequelize;