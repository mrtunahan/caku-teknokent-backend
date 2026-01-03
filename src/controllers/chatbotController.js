/**
 * Chatbot Controller - Veritabanı Entegreli Versiyon
 * Sitedeki tüm verilerden akıllı cevaplar üretir
 */

const ChatbotKnowledge = require('../models/ChatbotKnowledge');
const Sequelize = require('sequelize');
const { Op } = Sequelize;

/**
 * Mesaj benzerliğini hesapla (basit Levenshtein distance)
 */
function calculateSimilarity(str1, str2) {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) return 1.0;

  const editDistance = getEditDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

/**
 * Edit distance hesapla
 */
function getEditDistance(s1, s2) {
  const costs = [];
  for (let i = 0; i <= s1.length; i++) {
    let lastValue = i;
    for (let j = 0; j <= s2.length; j++) {
      if (i === 0) {
        costs[j] = j;
      } else if (j > 0) {
        let newValue = costs[j - 1];
        if (s1.charAt(i - 1) !== s2.charAt(j - 1)) {
          newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1;
        }
        costs[j - 1] = lastValue;
        lastValue = newValue;
      }
    }
    if (i > 0) costs[s2.length] = lastValue;
  }
  return costs[s2.length];
}

/**
 * Ana Chatbot Endpoint
 */
exports.chat = async (req, res) => {
  try {
    const { message, context = '' } = req.body;

    // Validasyon
    if (!message || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Mesaj boş olamaz'
      });
    }

    const lowerMessage = message.toLowerCase().trim();
    console.log('📝 Kullanıcı mesajı:', message);

    // ===== KNOWLEDGE BASE'de ARA =====
    const results = await searchKnowledgeBase(lowerMessage);

    let reply = '';
    let confidence = 0;

    if (results.length > 0) {
      // En yüksek skoru alan cevabı seç
      const bestMatch = results[0];
      reply = bestMatch.answer;
      confidence = bestMatch.confidence;

      // Arama sayısını güncelle (analiz için)
      await ChatbotKnowledge.increment('searchCount', {
        where: { id: bestMatch.id }
      });

      console.log(`✅ Bulunan cevap (${Math.round(confidence * 100)}% güven): ${bestMatch.category}`);
    } else {
      // Fallback: Genel cevap
      reply = 'Üzgünüm, bu konuda bilgim yok. Lütfen iletişim sayfamızdan bizimle iletişime geçin veya daha detaylı bilgi için teknokent hakkında sayfamızı ziyaret edin.';
      confidence = 0;
    }

    res.json({
      success: true,
      reply,
      confidence: Math.min(confidence, 1),
      context: context || 'chat'
    });

  } catch (error) {
    console.error('❌ Chatbot hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot hata verdi',
      reply: 'Şu anda bir hata oluştu. Lütfen daha sonra tekrar deneyin.'
    });
  }
};

/**
 * Knowledge Base'de Ara
 */
async function searchKnowledgeBase(message) {
  try {
    // Tüm aktif kayıtları çek
    const allRecords = await ChatbotKnowledge.findAll({
      where: { isActive: true },
      order: [['priority', 'DESC']]
    });

    if (allRecords.length === 0) {
      return [];
    }

    const scoredResults = [];

    for (const record of allRecords) {
      let score = 0;

      // 1. Keyword Matching (Ağırlık: 0.6)
      const keywords = record.keywords.split(',').map(k => k.trim().toLowerCase());
      const matchedKeywords = keywords.filter(kw => message.includes(kw)).length;
      const keywordScore = (matchedKeywords / Math.max(keywords.length, 1)) * 0.6;

      // 2. Question Similarity (Ağırlık: 0.3)
      const questionScore = calculateSimilarity(message, record.question.toLowerCase()) * 0.3;

      // 3. Priority Boost (Ağırlık: 0.1)
      const priorityScore = Math.min(record.priority / 10, 1) * 0.1;

      score = keywordScore + questionScore + priorityScore;

      if (score > 0.1) {
        // Minimum 10% güven eşiği
        scoredResults.push({
          id: record.id,
          answer: record.answer,
          category: record.category,
          confidence: score
        });
      }
    }

    // Güven puanına göre sırala
    return scoredResults.sort((a, b) => b.confidence - a.confidence).slice(0, 3);
  } catch (error) {
    console.error('Knowledge base arama hatası:', error);
    return [];
  }
}

/**
 * Admin: Yeni Knowledge kaydı ekle
 */
exports.addKnowledge = async (req, res) => {
  try {
    const { category, keywords, question, answer, sourceType, sourceId, priority } = req.body;

    if (!category || !keywords || !question || !answer) {
      return res.status(400).json({
        success: false,
        message: 'Gerekli alanlar eksik'
      });
    }

    const knowledge = await ChatbotKnowledge.create({
      category,
      keywords,
      question,
      answer,
      sourceType,
      sourceId,
      priority: priority || 0
    });

    res.json({
      success: true,
      message: 'Knowledge başarıyla eklendi',
      data: knowledge
    });
  } catch (error) {
    console.error('Knowledge ekleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Knowledge eklenirken hata oluştu'
    });
  }
};

/**
 * Admin: Knowledge güncelle
 */
exports.updateKnowledge = async (req, res) => {
  try {
    const { id } = req.params;
    const { category, keywords, question, answer, priority, isActive } = req.body;

    const knowledge = await ChatbotKnowledge.findByPk(id);
    if (!knowledge) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge bulunamadı'
      });
    }

    await knowledge.update({
      category: category || knowledge.category,
      keywords: keywords || knowledge.keywords,
      question: question || knowledge.question,
      answer: answer || knowledge.answer,
      priority: priority !== undefined ? priority : knowledge.priority,
      isActive: isActive !== undefined ? isActive : knowledge.isActive
    });

    res.json({
      success: true,
      message: 'Knowledge başarıyla güncellendi',
      data: knowledge
    });
  } catch (error) {
    console.error('Knowledge güncelleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Knowledge güncellenirken hata oluştu'
    });
  }
};

/**
 * Admin: Knowledge sil
 */
exports.deleteKnowledge = async (req, res) => {
  try {
    const { id } = req.params;

    const knowledge = await ChatbotKnowledge.findByPk(id);
    if (!knowledge) {
      return res.status(404).json({
        success: false,
        message: 'Knowledge bulunamadı'
      });
    }

    await knowledge.destroy();

    res.json({
      success: true,
      message: 'Knowledge başarıyla silindi'
    });
  } catch (error) {
    console.error('Knowledge silme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Knowledge silinirken hata oluştu'
    });
  }
};

/**
 * Admin: Tüm Knowledge'ları listele
 */
exports.listKnowledge = async (req, res) => {
  try {
    const { category, isActive, limit = 50, offset = 0 } = req.query;
    
    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const { count, rows } = await ChatbotKnowledge.findAndCountAll({
      where,
      order: [['priority', 'DESC'], ['searchCount', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        total: count,
        limit: parseInt(limit),
        offset: parseInt(offset),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Knowledge listeleme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Knowledge listelenemedi'
    });
  }
};

/**
 * Admin: Statistics - En çok aranan sorular
 */
exports.getStatistics = async (req, res) => {
  try {
    const topSearched = await ChatbotKnowledge.findAll({
      where: { isActive: true },
      order: [['searchCount', 'DESC']],
      limit: 10
    });

    const totalRecords = await ChatbotKnowledge.count();
    const activeRecords = await ChatbotKnowledge.count({ where: { isActive: true } });
    const categories = await ChatbotKnowledge.findAll({
      attributes: [
        'category',
        [Sequelize.fn('COUNT', Sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });
    const totalSearches = await ChatbotKnowledge.sum('searchCount');

    res.json({
      success: true,
      statistics: {
        totalKnowledge: totalRecords,
        activeKnowledge: activeRecords,
        totalCategories: categories.length,
        totalSearches: totalSearches || 0
      },
      topSearched,
      categories
    });
  } catch (error) {
    console.error('Statistics hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler alınamadı'
    });
  }
};

/**
 * Admin: Chatbot durumu kontrol endpoint'i
 */
exports.checkStatus = async (req, res) => {
  res.json({
    success: true,
    message: 'Chatbot servisi çalışıyor',
    model: 'knowledge-base',
    status: 'online',
    version: '2.0.0'
  });
};

/**
 * Admin: Seed Data Yükle (Knowledge Base'i otomatik doldur)
 */
exports.seedData = async (req, res) => {
  try {
    console.log('🌱 Chatbot Knowledge Base doldurulmaya başlanıyor...\n');

    // Modelleri import et
    const Company = require('../models/Company');
    const News = require('../models/News');
    const PageContent = require('../models/PageContent');
    const Support = require('../models/Support');
    const TeamMember = require('../models/TeamMember');
    const TtoService = require('../models/TtoService');
    const Legislation = require('../models/Legislation');
    const Room = require('../models/Room');
    const Stakeholder = require('../models/Stakeholder');

    let insertedCount = 0;

    // Önceki verileri temizle
    await ChatbotKnowledge.destroy({ where: {} });

    // ===== 1. FİRMALAR =====
    const companies = await Company.findAll();
    for (const company of companies) {
      await ChatbotKnowledge.create({
        category: 'firma',
        keywords: `${company.name},firma,şirket,${company.sector || ''}`,
        question: `${company.name} hakkında bilgi`,
        answer: `${company.name} teknokent'te bulunan bir firmamızdır. Sektörü: ${company.sector || 'Bilinmiyor'}. Kategori: ${company.category || 'Genel'}.`,
        sourceType: 'company',
        sourceId: company.id,
        priority: 5,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 2. HABERLER =====
    const news = await News.findAll();
    for (const newsItem of news) {
      await ChatbotKnowledge.create({
        category: 'haber',
        keywords: `${newsItem.title},haber,duyuru,${newsItem.category || ''}`,
        question: newsItem.title,
        answer: `${newsItem.title} - ${newsItem.category || 'Haber'}. Tarih: ${newsItem.date || 'Bilinmiyor'}.`,
        sourceType: 'news',
        sourceId: newsItem.id,
        priority: 4,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 3. SAYFALAR =====
    const pages = await PageContent.findAll();
    for (const page of pages) {
      await ChatbotKnowledge.create({
        category: 'sayfa',
        keywords: `${page.slug},${page.title},sayfa,bilgi`,
        question: `${page.title} hakkında`,
        answer: `${page.title}: Detaylı bilgi için sayfamızı ziyaret edin.`,
        sourceType: 'page',
        sourceId: page.id,
        priority: 3,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 4. DESTEKLER =====
    const supports = await Support.findAll();
    for (const support of supports) {
      await ChatbotKnowledge.create({
        category: 'destek',
        keywords: `${support.title},destek,hizmet,${support.type || ''}`,
        question: `${support.title} nedir?`,
        answer: `${support.title} - Tip: ${support.type || 'Genel'}. Daha fazla bilgi için destek sayfasını ziyaret edin.`,
        sourceType: 'support',
        sourceId: support.id,
        priority: 4,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 5. TAKIP ÜYELERİ =====
    const team = await TeamMember.findAll();
    for (const member of team) {
      await ChatbotKnowledge.create({
        category: 'takım',
        keywords: `${member.name},${member.title || ''},takım,personel`,
        question: `${member.name} kimdir?`,
        answer: `${member.name} - Pozisyon: ${member.title || 'Bilinmiyor'}`,
        sourceType: 'team',
        sourceId: member.id,
        priority: 2,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 6. TTO HİZMETLERİ =====
    const ttoServices = await TtoService.findAll();
    for (const tto of ttoServices) {
      await ChatbotKnowledge.create({
        category: 'tto',
        keywords: `${tto.title},tto,teknoloji,transferi,hizmet`,
        question: `${tto.title} hakkında`,
        answer: `${tto.title}: TTO hizmetimiz hakkında daha fazla bilgi için sayfamızı ziyaret edin.`,
        sourceType: 'tto',
        sourceId: tto.id,
        priority: 5,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 7. MEVZUAT =====
    const legislations = await Legislation.findAll();
    for (const leg of legislations) {
      await ChatbotKnowledge.create({
        category: 'mevzuat',
        keywords: `${leg.title},mevzuat,kanun,yönetmelik,${leg.category || ''}`,
        question: `${leg.title} nedir?`,
        answer: `${leg.title} - Kategorisi: ${leg.category || 'Bilinmiyor'}. Detaylı bilgi için mevzuat bölümünü ziyaret edin.`,
        sourceType: 'legislation',
        sourceId: leg.id,
        priority: 3,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 8. ODALAR =====
    const rooms = await Room.findAll();
    for (const room of rooms) {
      await ChatbotKnowledge.create({
        category: 'mekan',
        keywords: `${room.name},oda,toplantı,mekan`,
        question: `${room.name} oda hakkında`,
        answer: `${room.name} - Kapasite: ${room.capacity || 'Bilinmiyor'} kişi.`,
        sourceType: 'room',
        sourceId: room.id,
        priority: 3,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 9. PAYDAŞLAR =====
    const stakeholders = await Stakeholder.findAll();
    for (const stakeholder of stakeholders) {
      await ChatbotKnowledge.create({
        category: 'paydaş',
        keywords: `${stakeholder.name},partner,iş ortağı,paydaş`,
        question: `${stakeholder.name} kimdir?`,
        answer: `${stakeholder.name} teknokent'in iş ortağlarından biridir.`,
        sourceType: 'stakeholder',
        sourceId: stakeholder.id,
        priority: 2,
        isActive: true
      });
      insertedCount++;
    }

    // ===== 10. GENEL SORULAR =====
    const generalAnswers = [
      {
        category: 'genel',
        keywords: 'merhaba,selam,hey,hello',
        question: 'Merhaba',
        answer: 'Merhaba! 👋 Ben ÇAKÜ Teknokent asistanıyım. Size nasıl yardımcı olabilirim?',
        priority: 10
      },
      {
        category: 'genel',
        keywords: 'başvuru,basvuru',
        question: 'Teknokent\'e nasıl başvurabilirim?',
        answer: 'Teknokent\'e başvuru formu ile başvurabilirsiniz. Başvuru sayfasını ziyaret edin.',
        priority: 9
      },
      {
        category: 'genel',
        keywords: 'iletişim,contact,telefon,mail',
        question: 'İletişim bilgileri nelerdir?',
        answer: 'İletişim sayfamızda tüm iletişim bilgilerini bulabilirsiniz.',
        priority: 8
      }
    ];

    for (const answer of generalAnswers) {
      await ChatbotKnowledge.create({
        ...answer,
        isActive: true
      });
      insertedCount++;
    }

    res.json({
      success: true,
      message: `${insertedCount} bilgi başarıyla yüklendi!`,
      count: insertedCount
    });

  } catch (error) {
    console.error('Seed hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Seed işlemi başarısız!',
      error: error.message
    });
  }
};

module.exports = exports;