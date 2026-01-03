/**
 * Chatbot Knowledge Base'i sitedeki tüm verilerle doldur
 * Çalıştırma: node scripts/seed-chatbot-knowledge.js
 */

require('dotenv').config();
const sequelize = require('../src/config/database');
const ChatbotKnowledge = require('../src/models/ChatbotKnowledge');

// Modelleri import et
const Company = require('../src/models/Company');
const News = require('../src/models/News');
const PageContent = require('../src/models/PageContent');
const Support = require('../src/models/Support');
const TeamMember = require('../src/models/TeamMember');
const TtoService = require('../src/models/TtoService');
const Legislation = require('../src/models/Legislation');
const Booking = require('../src/models/Booking');
const Room = require('../src/models/Room');
const Stakeholder = require('../src/models/Stakeholder');

const seedChatbotKnowledge = async () => {
  try {
    console.log('🌱 Chatbot Knowledge Base doldurulmaya başlanıyor...\n');

    // Önceki verileri temizle (opsiyonel)
    // await ChatbotKnowledge.destroy({ where: {} });

    let insertedCount = 0;

    // ===== 1. FİRMALAR =====
    console.log('📦 Firmalar işleniyor...');
    const companies = await Company.findAll();
    for (const company of companies) {
      await ChatbotKnowledge.create({
        category: 'firma',
        keywords: `${company.name},firma,şirket,${company.sector || ''}`,
        question: `${company.name} hakkında bilgi`,
        answer: `${company.name} teknokent'te bulunan bir firmamızdır. Sektörü: ${company.sector || 'Bilinmiyor'}. Kategori: ${company.category || 'Genel'}.`,
        sourceType: 'company',
        sourceId: company.id,
        priority: 5
      });
      insertedCount++;
    }
    console.log(`✅ ${companies.length} firma eklendi\n`);

    // ===== 2. HABERLER =====
    console.log('📰 Haberler işleniyor...');
    const news = await News.findAll();
    for (const newsItem of news) {
      await ChatbotKnowledge.create({
        category: 'haber',
        keywords: `${newsItem.title},haber,duyuru,${newsItem.category || ''}`,
        question: newsItem.title,
        answer: `${newsItem.title} - ${newsItem.category || 'Haber'}. Tarih: ${newsItem.date || 'Bilinmiyor'}. ${newsItem.content ? newsItem.content.substring(0, 200) : ''}`,
        sourceType: 'news',
        sourceId: newsItem.id,
        priority: 4
      });
      insertedCount++;
    }
    console.log(`✅ ${news.length} haber eklendi\n`);

    // ===== 3. SAYFALAR =====
    console.log('📄 Sayfalar işleniyor...');
    const pages = await PageContent.findAll();
    for (const page of pages) {
      await ChatbotKnowledge.create({
        category: 'sayfa',
        keywords: `${page.slug},${page.title},sayfa,bilgi`,
        question: `${page.title} hakkında`,
        answer: `${page.title}: ${page.content ? page.content.substring(0, 300) : 'Detay sayfasını ziyaret edin.'}`,
        sourceType: 'page',
        sourceId: page.id,
        priority: 3
      });
      insertedCount++;
    }
    console.log(`✅ ${pages.length} sayfa eklendi\n`);

    // ===== 4. DESTEKLER (Hizmetler) =====
    console.log('🎯 Destekler işleniyor...');
    const supports = await Support.findAll();
    for (const support of supports) {
      await ChatbotKnowledge.create({
        category: 'destek',
        keywords: `${support.title},destek,hizmet,${support.type || ''}`,
        question: `${support.title} nedir?`,
        answer: `${support.title} - Tip: ${support.type || 'Genel'}. ${support.description || 'Daha fazla bilgi için detay sayfasını ziyaret edin.'}`,
        sourceType: 'support',
        sourceId: support.id,
        priority: 4
      });
      insertedCount++;
    }
    console.log(`✅ ${supports.length} destek eklendi\n`);

    // ===== 5. TAKIP ÜYELERI =====
    console.log('👥 Takım üyeleri işleniyor...');
    const team = await TeamMember.findAll();
    for (const member of team) {
      await ChatbotKnowledge.create({
        category: 'takım',
        keywords: `${member.name},${member.title || ''},takım,staff,personel`,
        question: `${member.name} kimdir?`,
        answer: `${member.name} - Pozisyon: ${member.title || 'Bilinmiyor'}. ${member.email ? `E-posta: ${member.email}` : ''} ${member.extension ? `Dahili: ${member.extension}` : ''}`,
        sourceType: 'team',
        sourceId: member.id,
        priority: 2
      });
      insertedCount++;
    }
    console.log(`✅ ${team.length} takım üyesi eklendi\n`);

    // ===== 6. TTO HİZMETLERİ =====
    console.log('🚀 TTO hizmetleri işleniyor...');
    const ttoServices = await TtoService.findAll();
    for (const tto of ttoServices) {
      await ChatbotKnowledge.create({
        category: 'tto',
        keywords: `${tto.title},tto,teknoloji,transferi,hizmet`,
        question: `${tto.title} hakkında`,
        answer: `${tto.title}: ${tto.description || 'TTO hizmetimiz hakkında daha fazla bilgi için sayfamızı ziyaret edin.'}`,
        sourceType: 'tto',
        sourceId: tto.id,
        priority: 5
      });
      insertedCount++;
    }
    console.log(`✅ ${ttoServices.length} TTO hizmeti eklendi\n`);

    // ===== 7. MEVZUAT =====
    console.log('⚖️ Mevzuat işleniyor...');
    const legislations = await Legislation.findAll();
    for (const leg of legislations) {
      await ChatbotKnowledge.create({
        category: 'mevzuat',
        keywords: `${leg.title},mevzuat,kanun,yönetmelik,${leg.category || ''}`,
        question: `${leg.title} nedir?`,
        answer: `${leg.title} - Kategorisi: ${leg.category || 'Bilinmiyor'}. Detaylı bilgi için mevzuat bölümünü ziyaret edin.`,
        sourceType: 'legislation',
        sourceId: leg.id,
        priority: 3
      });
      insertedCount++;
    }
    console.log(`✅ ${legislations.length} mevzuat eklendi\n`);

    // ===== 8. ODALAR / MEKANLAR =====
    console.log('🏢 Odalar işleniyor...');
    const rooms = await Room.findAll();
    for (const room of rooms) {
      await ChatbotKnowledge.create({
        category: 'mekan',
        keywords: `${room.name},oda,toplantı,mekan,${room.features || ''}`,
        question: `${room.name} oda hakkında`,
        answer: `${room.name} - Kapasite: ${room.capacity || 'Bilinmiyor'} kişi. Özellikleri: ${room.features || 'Standart'}. ${room.description || ''}`,
        sourceType: 'room',
        sourceId: room.id,
        priority: 3
      });
      insertedCount++;
    }
    console.log(`✅ ${rooms.length} oda eklendi\n`);

    // ===== 9. PAYDAŞLAr =====
    console.log('🤝 Paydaşlar işleniyor...');
    const stakeholders = await Stakeholder.findAll();
    for (const stakeholder of stakeholders) {
      await ChatbotKnowledge.create({
        category: 'paydaş',
        keywords: `${stakeholder.name},partner,iş ortağı,paydaş`,
        question: `${stakeholder.name} kimdir?`,
        answer: `${stakeholder.name} teknokent'in iş ortağlarından biridir.`,
        sourceType: 'stakeholder',
        sourceId: stakeholder.id,
        priority: 2
      });
      insertedCount++;
    }
    console.log(`✅ ${stakeholders.length} paydaş eklendi\n`);

    // ===== 10. GENEL CEVAPLAR =====
    console.log('📚 Genel sorular ekleniyor...');
    const generalAnswers = [
      {
        category: 'genel',
        keywords: 'merhaba,selam,hey,hello,günaydın',
        question: 'Merhaba',
        answer: 'Merhaba! 👋 Ben ÇAKÜ Teknokent asistanıyım. Teknokent hakkında soruları yanıtlayabilirim. Size nasıl yardımcı olabilirim?',
        priority: 10
      },
      {
        category: 'genel',
        keywords: 'başvuru,basvuru,başvurmak,başvuram',
        question: 'Teknokent\'e nasıl başvurabilirim?',
        answer: 'Teknokent\'e başvurmak için başvuru formunu doldurmanız yeterlidir. İlgili sayfanızda başvuru yapabilirsiniz.',
        priority: 9
      },
      {
        category: 'genel',
        keywords: 'iletişim,telefon,mail,e-posta,adres,ulaş,bize yazın,eposta',
        question: 'Nasıl iletişime geçebilirim?',
        answer: 'Bizimle iletişime geçmek için iletişim sayfamızı ziyaret edebilirsiniz. Telefon, e-posta ve adres bilgilerimiz orada mevcuttur.',
        priority: 9
      },
      {
        category: 'genel',
        keywords: 'saatler,çalışma,açık,kapalı,pazartesi,salı,çarşamba,perşembe,cuma',
        question: 'Çalışma saatleri nedir?',
        answer: 'Pazartesi-Cuma: 09:00-17:00 arası açık durumdayız. Daha detaylı bilgi için iletişim sayfamızı ziyaret edin.',
        priority: 8
      },
      {
        category: 'genel',
        keywords: 'hizmet,imkan,vet,varsa,ne sunar,neler',
        question: 'Teknokent hangi hizmetleri sunuyor?',
        answer: 'Teknokent birçok hizmet sunmaktadır: mentoring, danışmanlık, ofis alanı, ağ oluşturma ve daha fazlası. Detaylı bilgi için destekler sayfamızı ziyaret edin.',
        priority: 8
      },
      {
        category: 'genel',
        keywords: 'teşekkür,sağol,aşkına,yardım,sağlasın,yardımcı,çok iyi',
        question: 'Teşekkür',
        answer: 'Başka sorunuz varsa bana sorabilirsiniz! 😊 Sizin yardımcı olabilmek benim görevim.',
        priority: 5
      }
    ];

    for (const answer of generalAnswers) {
      await ChatbotKnowledge.create(answer);
      insertedCount++;
    }
    console.log(`✅ ${generalAnswers.length} genel soru eklendi\n`);

    console.log(`\n🎉 TOPLAM ${insertedCount} kayıt başarıyla eklendi!`);
    console.log('✅ Chatbot Knowledge Base hazır!\n');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Hata:', error.message);
    process.exit(1);
  }
};

seedChatbotKnowledge();
