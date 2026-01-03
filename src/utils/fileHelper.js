/**
 * fileHelper.js
 * Tüm controller'lar için ortak dosya işlem fonksiyonları
 * Bu dosyayı utils/ klasörüne koyun
 */

const fs = require('fs').promises;
const path = require('path');

// Uploads klasörünün ana yolu
const UPLOADS_BASE = path.join(__dirname, '../../uploads');

/**
 * Yüklenen dosyanın URL'ini oluşturur
 * @param {Object} file - Multer dosya objesi
 * @param {string} subfolder - Alt klasör (images, documents, cv)
 * @returns {string|null} - Dosya URL'i veya null
 */
const getUploadedFileUrl = (file, subfolder = 'images') => {
  if (!file) return null;
  // HER ZAMAN / ile başlayan tutarlı format
  return `/uploads/${subfolder}/${file.filename}`;
};

/**
 * Dosya URL'inden dosya adını çıkarır
 * @param {string} fileUrl - Veritabanındaki dosya URL'i
 * @returns {string|null} - Dosya adı veya null
 */
const extractFileName = (fileUrl) => {
  if (!fileUrl) return null;
  
  // Farklı formatları handle et
  // /uploads/images/file.jpg
  // uploads/images/file.jpg
  // file.jpg
  
  if (fileUrl.startsWith('/uploads/')) {
    return path.basename(fileUrl);
  } else if (fileUrl.startsWith('uploads/')) {
    return path.basename(fileUrl);
  } else {
    return path.basename(fileUrl);
  }
};

/**
 * Dosyayı güvenli şekilde siler
 * @param {string} fileUrl - Veritabanındaki dosya URL'i
 * @param {string} subfolder - Alt klasör (images, documents, cv)
 */
const safeDeleteFile = async (fileUrl, subfolder = 'images') => {
  if (!fileUrl) return;
  
  try {
    const fileName = extractFileName(fileUrl);
    
    // Güvenlik kontrolü - path traversal engelle
    if (!fileName || fileName.includes('..') || fileName.includes('/') || fileName.includes('\\')) {
      console.warn(`⚠️ Güvenlik uyarısı: Geçersiz dosya adı - ${fileName}`);
      return;
    }
    
    const filePath = path.join(UPLOADS_BASE, subfolder, fileName);
    
    // Dosya var mı kontrol et
    try {
      await fs.access(filePath);
    } catch {
      console.warn(`⚠️ Dosya bulunamadı: ${fileName}`);
      return;
    }
    
    await fs.unlink(filePath);
    console.log(`✅ Dosya silindi: ${fileName}`);
  } catch (err) {
    console.warn(`⚠️ Dosya silinemedi: ${err.message}`);
  }
};

/**
 * Klasör yoksa oluşturur
 * @param {string} subfolder - Alt klasör adı
 */
const ensureUploadDir = async (subfolder = 'images') => {
  const dir = path.join(UPLOADS_BASE, subfolder);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (err) {
    // Klasör zaten varsa sorun yok
  }
};

/**
 * Dosya URL'ini normalize eder (tutarlı format için)
 * @param {string} fileUrl - Mevcut URL
 * @returns {string|null} - Normalize edilmiş URL
 */
const normalizeFileUrl = (fileUrl) => {
  if (!fileUrl) return null;
  
  // Zaten doğru formattaysa
  if (fileUrl.startsWith('/uploads/')) {
    return fileUrl;
  }
  
  // uploads/ ile başlıyorsa / ekle
  if (fileUrl.startsWith('uploads/')) {
    return '/' + fileUrl;
  }
  
  // Sadece dosya adı ise
  if (!fileUrl.includes('/')) {
    return `/uploads/images/${fileUrl}`;
  }
  
  return fileUrl;
};

module.exports = {
  getUploadedFileUrl,
  extractFileName,
  safeDeleteFile,
  ensureUploadDir,
  normalizeFileUrl,
  UPLOADS_BASE
};