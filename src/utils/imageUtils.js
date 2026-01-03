/**
 * imageUtils.js
 * Frontend için resim URL yardımcı fonksiyonları
 * src/utils/ klasörüne koyun
 */

// API URL'yi belirle
const getApiUrl = () => {
  // Vite ortam değişkeni
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // Development ortamı
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:5000';
  }
  
  // Production - aynı domain farklı port
  return window.location.origin.replace(':5173', ':5000').replace(':3000', ':5000');
};

/**
 * Resim URL'ini oluşturur
 * @param {string} imagePath - Veritabanından gelen resim yolu
 * @param {string} fallback - Resim yoksa gösterilecek placeholder
 * @returns {string} - Tam resim URL'i
 */
export const getImageUrl = (imagePath, fallback = null) => {
  if (!imagePath) {
    return fallback || getPlaceholder('image');
  }

  const API_URL = getApiUrl();

  // Zaten tam URL
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // /uploads ile başlıyor
  if (imagePath.startsWith('/uploads')) {
    return `${API_URL}${imagePath}`;
  }

  // uploads/ ile başlıyor (/ eksik)
  if (imagePath.startsWith('uploads/')) {
    return `${API_URL}/${imagePath}`;
  }

  // Sadece dosya adı
  return `${API_URL}/uploads/images/${imagePath}`;
};

/**
 * Logo URL'ini oluşturur
 * @param {string} logoPath - Veritabanından gelen logo yolu
 * @returns {string} - Tam logo URL'i
 */
export const getLogoUrl = (logoPath) => {
  return getImageUrl(logoPath, getPlaceholder('logo'));
};

/**
 * Döküman URL'ini oluşturur
 * @param {string} docPath - Veritabanından gelen döküman yolu
 * @returns {string} - Tam döküman URL'i
 */
export const getDocumentUrl = (docPath) => {
  if (!docPath) return '';
  
  const API_URL = getApiUrl();

  if (docPath.startsWith('http://') || docPath.startsWith('https://')) {
    return docPath;
  }

  if (docPath.startsWith('/uploads')) {
    return `${API_URL}${docPath}`;
  }

  if (docPath.startsWith('uploads/')) {
    return `${API_URL}/${docPath}`;
  }

  return `${API_URL}/uploads/documents/${docPath}`;
};

/**
 * CV URL'ini oluşturur
 * @param {string} cvPath - Veritabanından gelen CV yolu
 * @returns {string} - Tam CV URL'i
 */
export const getCvUrl = (cvPath) => {
  if (!cvPath) return '';
  
  const API_URL = getApiUrl();

  if (cvPath.startsWith('http://') || cvPath.startsWith('https://')) {
    return cvPath;
  }

  if (cvPath.startsWith('/uploads')) {
    return `${API_URL}${cvPath}`;
  }

  if (cvPath.startsWith('uploads/')) {
    return `${API_URL}/${cvPath}`;
  }

  return `${API_URL}/uploads/cv/${cvPath}`;
};

/**
 * SVG placeholder oluşturur
 * @param {string} type - Placeholder tipi: 'image', 'logo', 'avatar'
 * @param {number} size - Boyut (px)
 * @returns {string} - Data URI
 */
export const getPlaceholder = (type = 'image', size = 50) => {
  const placeholders = {
    image: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Crect fill='%23e5e7eb' width='${size}' height='${size}' rx='6'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='10'%3EIMG%3C/text%3E%3C/svg%3E`,
    logo: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Crect fill='%23f3f4f6' width='${size}' height='${size}' rx='6'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='8'%3ELOGO%3C/text%3E%3C/svg%3E`,
    avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='${size}' height='${size}'%3E%3Crect fill='%23f3f4f6' width='${size}' height='${size}' rx='${size/2}'/%3E%3Ctext fill='%239ca3af' x='50%25' y='50%25' text-anchor='middle' dy='.3em' font-size='14'%3E👤%3C/text%3E%3C/svg%3E`,
  };
  
  return placeholders[type] || placeholders.image;
};

/**
 * Resim yükleme hatası handle eder
 * @param {Event} e - Error event
 * @param {string} type - Placeholder tipi
 */
export const handleImageError = (e, type = 'image') => {
  e.target.onerror = null; // Sonsuz döngü engelle
  e.target.src = getPlaceholder(type);
};

export default {
  getImageUrl,
  getLogoUrl,
  getDocumentUrl,
  getCvUrl,
  getPlaceholder,
  handleImageError,
};