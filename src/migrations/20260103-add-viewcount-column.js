const sequelize = require('../config/database');

const runMigration = async () => {
  try {
    console.log('🔄 Migration başlatılıyor: InternshipAd tablosuna viewCount sütunu ekleniyor...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // viewCount sütununu ekle
    await queryInterface.addColumn('internship_ads', 'viewCount', {
      type: sequelize.Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'İlanın görüntülenme sayısı'
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('⚠️  viewCount sütunu zaten mevcut');
      } else {
        throw err;
      }
    });
    console.log('✅ viewCount sütunu eklendi');
    
    console.log('✅ Migration başarıyla tamamlandı!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration hatası:', error);
    process.exit(1);
  }
};

// Script olarak çalıştırılırsa migration'ı çalıştır
if (require.main === module) {
  runMigration();
}

module.exports = runMigration;
