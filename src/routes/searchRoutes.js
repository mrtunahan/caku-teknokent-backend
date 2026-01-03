const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const News = require('../models/News');
const Company = require('../models/Company');

// --- SABİT SAYFALAR LİSTESİ ---
const staticPages = [
  // MEVCUT SAYFALAR
  { title: "İletişim", keywords: "iletişim, adres, telefon, mail, konum", url: "/iletisim", type: "Sayfa" },
  { title: "Hakkımızda", keywords: "hakkımızda, biz kimiz, teknokent", url: "/hakkimizda", type: "Sayfa" },
  { title: "Yönetim Kurulu", keywords: "yönetim, müdür, rektör, kurul", url: "/yonetim-kurulu", type: "Sayfa" },
  { title: "Misyon & Vizyon", keywords: "misyon, vizyon, hedef, strateji, amaç", url: "/misyon-vizyon", type: "Sayfa" },
  { title: "Ofisler ve Altyapı", keywords: "ofis, kiralama, altyapı, bina", url: "/ofisler", type: "Sayfa" },
  { title: "KVKK", keywords: "kvkk, kişisel veriler, aydınlatma metni", url: "/kvkk", type: "Sayfa" },
  { title: "Başvuru Süreci", keywords: "başvuru, nasıl başvurulur, süreç", url: "/basvuru-sureci", type: "Sayfa" },
  { title: "Salon Kiralama", keywords: "salon, toplantı, konferans, rezervasyon", url: "/salon-kiralama", type: "Hizmet" },
  { title: "ÇAKÜ TTO", keywords: "tto, teknoloji transfer ofisi, proje destek", url: "/caku-tto", type: "Birim" },
  { title: "ÇAKÜ GO", keywords: "go, kuluçka, girişimcilik merkezi", url: "/caku-go", type: "Birim" },
  { title: "Kariyer", keywords: "kariyer, iş ilanı, staj, iş başvurusu", url: "/kariyer", type: "İK" },

  // --- YENİ EKLENEN LİSTELEME SAYFALARI ---
  { title: "Haberler", keywords: "haberler, güncel, gelişmeler, news", url: "/liste/haberler", type: "Kategori" },
  { title: "Duyurular", keywords: "duyurular, ilanlar, çağrılar, announcements", url: "/liste/duyurular", type: "Kategori" },
  { title: "Etkinlikler", keywords: "etkinlikler, events, takvim, seminer", url: "/liste/etkinlikler", type: "Kategori" },
  { title: "Basında ÇAKÜ Teknokent", keywords: "basın, medya, gazete, tv, news, firmalar", url: "/liste/firmalar", type: "Kategori" },
  
  // GİRİŞİMCİLER KATEGORİLERİ
  { title: "ARGE Firmaları", keywords: "arge, firmalar, şirketler, girişimciler", url: "/girisimciler/arge-firmalari", type: "Kategori" },
  { title: "Kuluçka Firmaları", keywords: "kuluçka, startup, girişim", url: "/girisimciler/kulucka-firmalari", type: "Kategori" },
  { title: "Destek Firmaları", keywords: "destek firmaları, hizmet", url: "/girisimciler/destek-firmalari", type: "Kategori" }
];

router.get('/', async (req, res) => {
  try {
    const { q } = req.query; // Arama terimi

    if (!q) {
      return res.json({ success: true, data: [] });
    }

    const lowerQ = q.toLowerCase();

    // 1. SABİT SAYFALARDA ARA
    const staticResults = staticPages
      .filter(page => 
        page.title.toLowerCase().includes(lowerQ) || 
        page.keywords.includes(lowerQ)
      )
      .map(page => ({
        id: `static-${Math.random()}`,
        title: page.title,
        type: page.type,
        url: page.url,
        desc: "Sayfaya Git"
      }));

    // 2. HABERLERDE ARA (Veritabanı)
    const newsResults = await News.findAll({
      where: {
        [Op.or]: [
          { title: { [Op.iLike]: `%${q}%` } },
          { content: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: 5
    });

    // 3. FİRMALARDA ARA (Veritabanı)
    const companyResults = await Company.findAll({
      where: {
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { sector: { [Op.iLike]: `%${q}%` } }
        ]
      },
      limit: 5
    });

    // SONUÇLARI BİRLEŞTİR
    const formattedResults = [
      ...staticResults,
      ...newsResults.map(item => ({
        id: item.id,
        title: item.title,
        type: 'İçerik',
        url: `/haber-detay/${item.id}`,
        desc: item.category ? item.category.toUpperCase() : 'HABER'
      })),
      ...companyResults.map(item => ({
        id: item.id,
        title: item.name,
        type: 'Firma',
        url: `/girisimciler/${item.category === 'akademisyen' ? 'kulucka-akademisyen' : item.category + '-firmalari'}`, 
        desc: item.sector
      }))
    ];

    res.json({ success: true, data: formattedResults });

  } catch (error) {
    console.error("Arama Hatası:", error);
    res.status(500).json({ success: false, message: 'Arama sırasında hata oluştu.' });
  }
});

module.exports = router;