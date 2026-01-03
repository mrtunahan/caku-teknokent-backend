const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

async function addGalleryColumn() {
  try {
    // Gallery sütununu ekle (varsa ekleme)
    await sequelize.query(`
      ALTER TABLE "News" 
      ADD COLUMN IF NOT EXISTS gallery TEXT
    `);
    console.log('✅ Gallery sütunu başarıyla eklendi');
    
    // Şuan veritabanındaki sütunları kontrol et
    const result = await sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'News'
    `);
    console.log('\n📋 News tablosunun sütunları:');
    result[0].forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
  } catch (err) {
    console.error('❌ Hata:', err.message);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

addGalleryColumn();
