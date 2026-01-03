/**
 * migrateNews.js
 * News tablosuna yeni sütunları ekler
 * 
 * Kullanım: node migrateNews.js
 */

const sequelize = require('./config/database');

async function migrate() {
  console.log('🔧 News tablosu güncelleniyor...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');

    // Yeni sütunları ekle (varsa hata vermez)
    const queries = [
      `ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "gallery" TEXT;`,
      `ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "summary" VARCHAR(500);`,
      `ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "is_featured" BOOLEAN DEFAULT false;`,
      `ALTER TABLE "News" ADD COLUMN IF NOT EXISTS "view_count" INTEGER DEFAULT 0;`,
    ];

    for (const query of queries) {
      try {
        await sequelize.query(query);
        console.log('✅', query.substring(0, 60) + '...');
      } catch (err) {
        // Sütun zaten varsa sorun yok
        if (err.message.includes('already exists') || err.message.includes('duplicate')) {
          console.log('⏭️ Sütun zaten mevcut, atlanıyor...');
        } else {
          console.warn('⚠️', err.message);
        }
      }
    }

    // Ayrıca eski image_url kayıtlarını düzelt
    console.log('\n🔧 Eski resim yolları düzeltiliyor...');
    try {
      await sequelize.query(`
        UPDATE "News" 
        SET "image_url" = CONCAT('/', "image_url")
        WHERE "image_url" IS NOT NULL 
          AND "image_url" LIKE 'uploads/%'
          AND "image_url" NOT LIKE '/%'
      `);
      console.log('✅ Resim yolları düzeltildi');
    } catch (err) {
      console.warn('⚠️', err.message);
    }

    console.log('\n✅ Migration tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

migrate();