const express = require('express');
const router = express.Router();

// Google Apps Script URLs
const SCRIPTS = {
  staj: 'https://script.google.com/macros/s/AKfycbzx4_7mp6Jc14Wm6Y194zhxYHQGR6k4nKmKJCYnY11M8ztFRxFQaQ52Tgt6pdL7alHl/exec',
  is: 'https://script.google.com/macros/s/AKfycbyfnqvHvEJB6RwWLsZmsTqI5KV2suksRT_wTzq7_ubV4iumsH1tbwdiWn3mZt3MjY7cMg/exec',
  talep: 'https://script.google.com/a/macros/cakuteknokent.com.tr/s/AKfycbw05p9M1N1f4ADVhU_fpo-4k7rajqs-KnsMLJ_GA6QuzzRa3sCaT_9rMupyb5OuJdhO/exec'
};

// Helper function: String'in başı ve sonundaki boşlukları temizle
function cleanKey(key) {
  return String(key).trim();
}

// Staj Başvuruları
router.get('/google-sheets/staj', async (req, res) => {
  try {
    const response = await fetch(SCRIPTS.staj);
    const data = await response.json();
    
    // Key'leri temizle (boşlukları kaldır)
    const cleanedData = Array.isArray(data) ? data.map(row => {
      const cleanedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        cleanedRow[cleanKey(key)] = value;
      });
      return cleanedRow;
    }) : [];
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json(cleanedData);
  } catch (error) {
    console.error('Staj başvuruları fetch hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// İş Başvuruları
router.get('/google-sheets/is', async (req, res) => {
  try {
    const response = await fetch(SCRIPTS.is);
    const data = await response.json();
    
    // Key'leri temizle (boşlukları kaldır)
    const cleanedData = Array.isArray(data) ? data.map(row => {
      const cleanedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        cleanedRow[cleanKey(key)] = value;
      });
      return cleanedRow;
    }) : [];
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json(cleanedData);
  } catch (error) {
    console.error('İş başvuruları fetch hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

// Stajyer Talepleri
router.get('/google-sheets/talep', async (req, res) => {
  try {
    const response = await fetch(SCRIPTS.talep);
    
    // Response'un JSON olup olmadığını kontrol et
    const contentType = response.headers.get('content-type');
    let data;
    
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      // JSON değilse HTML veya hata, boş array döndür
      console.warn('Stajyer Talep script\'i JSON döndürmüyor. Response:', response.status);
      data = [];
    }
    
    // Key'leri temizle (boşlukları kaldır)
    const cleanedData = Array.isArray(data) ? data.map(row => {
      const cleanedRow = {};
      Object.entries(row).forEach(([key, value]) => {
        cleanedRow[cleanKey(key)] = value;
      });
      return cleanedRow;
    }) : [];
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    res.json(cleanedData);
  } catch (error) {
    console.error('Stajyer talepleri fetch hatası:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
