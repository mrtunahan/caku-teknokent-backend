const sequelize = require('../config/database');

const runMigration = async () => {
  try {
    console.log('🔄 Migration başlatılıyor: ContactInfo tablosuna sütun ekleniyor...');
    
    const queryInterface = sequelize.getQueryInterface();
    
    // phone_1_label sütununu ekle
    await queryInterface.addColumn('ContactInfo', 'phone_1_label', {
      type: sequelize.Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('⚠️  phone_1_label sütunu zaten mevcut');
      } else {
        throw err;
      }
    });
    console.log('✅ phone_1_label sütunu eklendi');
    
    // phone_2_label sütununu ekle
    await queryInterface.addColumn('ContactInfo', 'phone_2_label', {
      type: sequelize.Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('⚠️  phone_2_label sütunu zaten mevcut');
      } else {
        throw err;
      }
    });
    console.log('✅ phone_2_label sütunu eklendi');
    
    // phone_3_label sütununu ekle
    await queryInterface.addColumn('ContactInfo', 'phone_3_label', {
      type: sequelize.Sequelize.STRING(255),
      allowNull: true,
      defaultValue: null
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('⚠️  phone_3_label sütunu zaten mevcut');
      } else {
        throw err;
      }
    });
    console.log('✅ phone_3_label sütunu eklendi');
    
    // map_embed sütununu ekle
    await queryInterface.addColumn('ContactInfo', 'map_embed', {
      type: sequelize.Sequelize.TEXT,
      allowNull: true,
      defaultValue: null
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('⚠️  map_embed sütunu zaten mevcut');
      } else {
        throw err;
      }
    });
    console.log('✅ map_embed sütunu eklendi');
    
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
