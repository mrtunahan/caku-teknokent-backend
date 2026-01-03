const sequelize = require('../config/database');
const ProjectApplication = require('../models/ProjectApplication');

const runMigration = async () => {
  try {
    console.log('🔄 Migration başlatılıyor...');
    
    // force: true sadece geliştirme ortamında kullanın!
    // Production'da force: false kullanmalısınız
    await sequelize.sync({ 
      force: process.env.NODE_ENV === 'development',
      alter: process.env.NODE_ENV !== 'development' 
    });
    
    console.log('✅ Migration başarıyla tamamlandı!');
    console.log('📋 Oluşturulan tablo: project_applications');
    
    // Test verisi ekleyelim (opsiyonel)
    if (process.env.NODE_ENV === 'development') {
      await ProjectApplication.create({
        adiniz_soyadiniz: 'Ahmet Yılmaz',
        tc_kimlik_no: '12345678901',
        email: 'ahmet@example.com',
        telefon: '0555 123 45 67',
        egitim_durumu: 'Lisans Öğrencisi',
        sirketlesme_durumu: 'Şirketim Yok (Girişimci)',
        proje_adi: 'Yapay Zeka Destekli Tarım Uygulaması',
        proje_alani: 'Yazılım ve Bilişim',
        nace_kodu: '62.01.01',
        anahtar_kelimeler: 'Yapay Zeka, Tarım, IoT',
        proje_ozeti: 'Bu proje tarımda yapay zeka kullanımını hedeflemektedir.',
        yenilikci_yonu: 'Makine öğrenmesi ile mahsul tahmini',
        kullanilacak_yontem: 'Python, TensorFlow, IoT sensörler',
        pazar_ticarillesme: 'Çiftçilere abonelik modeli ile sunulacak',
        talep_edilen_ofis: 'Kuluçka Ofisi (Açık Ofis)',
        personel_sayisi: 3,
        kvkk_onay: true
      });
      console.log('✅ Test verisi eklendi!');
    }
    
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