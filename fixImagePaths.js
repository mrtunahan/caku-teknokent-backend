/**
 * fixImagePaths.js
 * Veritabanındaki tutarsız resim yollarını düzeltir
 * 
 * Kullanım: node fixImagePaths.js
 * 
 * Bu script şunları yapar:
 * - "uploads/images/..." → "/uploads/images/..." (başa / ekler)
 * - Sadece dosya adı olanları düzeltir
 */

const sequelize = require('./config/database');

// Düzeltilecek tablolar ve sütunlar
const TABLES_TO_FIX = [
  { table: 'News', column: 'image_url' },
  { table: 'Companies', column: 'logo_url' },
  { table: 'Companies', column: 'logo' },
  { table: 'BoardMembers', column: 'image_url' },
  { table: 'BoardMembers', column: 'resim' },
  { table: 'Stakeholders', column: 'logo_url' },
  { table: 'Stakeholders', column: 'logo' },
  { table: 'Teams', column: 'image_url' },
  { table: 'Rooms', column: 'image_url' },
];

async function fixImagePaths() {
  console.log('🔧 Resim yolları düzeltiliyor...\n');
  
  try {
    await sequelize.authenticate();
    console.log('✅ Veritabanı bağlantısı başarılı\n');

    for (const { table, column } of TABLES_TO_FIX) {
      try {
        // Tablo ve sütun var mı kontrol et
        const [tableExists] = await sequelize.query(
          `SELECT COUNT(*) as count FROM information_schema.tables WHERE table_name = '${table}'`
        );
        
        if (tableExists[0].count === 0) {
          console.log(`⏭️  ${table} tablosu bulunamadı, atlanıyor...`);
          continue;
        }

        // "uploads/" ile başlayan ama "/" ile başlamayan kayıtları düzelt
        const [result1] = await sequelize.query(`
          UPDATE "${table}" 
          SET "${column}" = CONCAT('/', "${column}")
          WHERE "${column}" IS NOT NULL 
            AND "${column}" LIKE 'uploads/%'
            AND "${column}" NOT LIKE '/%'
        `);
        
        console.log(`✅ ${table}.${column}: ${result1?.affectedRows || 0} kayıt düzeltildi (uploads/ → /uploads/)`);

      } catch (err) {
        console.log(`⚠️  ${table}.${column}: ${err.message}`);
      }
    }

    console.log('\n✅ Tüm düzeltmeler tamamlandı!');
    
  } catch (error) {
    console.error('❌ Hata:', error.message);
  } finally {
    await sequelize.close();
  }
}

// Script'i çalıştır
fixImagePaths();