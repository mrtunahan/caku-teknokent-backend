/**
 * HTML Sanitization Middleware
 * XSS (Cross-Site Scripting) saldırılarından koruma
 * 
 * Risk: Admin panelinde yönetilen HTML içeriğine kötü niyetli kod enjekte edilebilir
 * Çözüm: Veritabanına kaydetmeden önce HTML'i temizle
 */

// İlk başta npm install xss yükle
// const xss = require('xss');

// Eğer xss yüklü değilse basit bir regex-based sanitizer kullan
const sanitizeHtml = (html) => {
  if (!html || typeof html !== 'string') return html;

  // Tehlikeli HTML elementleri ve attribute'ları kaldır
  let sanitized = html;

  // Tehlikeli script tag'ları kaldır
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Event handler'ları kaldır (onclick, onerror, onload, etc.)
  sanitized = sanitized.replace(/on(abort|activate|afterprint|afterupdate|beforeactivate|beforecopy|beforecut|beforedeactivate|beforeedit|beforepaste|beforeprint|beforeunload|beforeupdate|blur|bounce|cellchange|change|click|contextmenu|controlselect|copy|cut|dataavailable|datasetchanged|datasetcomplete|dblclick|deactivate|drag|dragend|dragenter|dragleave|dragover|dragstart|drop|error|errorupdate|filterchange|finish|focus|focusin|focusout|help|input|keydown|keypress|keyup|layoutcomplete|load|losecapture|mousedown|mouseenter|mouseleave|mousemove|mouseout|mouseover|mouseup|mousewheel|move|moveend|movestart|paste|propertychange|reset|resize|resizeend|resizestart|rowenter|rowexit|rowsdelete|rowsinserted|scroll|select|selectionchange|selectstart|start|stop|submit|syncrestored|unload)\s*=\s*"[^"]*"/gi, '');
  
  // iframe, embed, object tag'ları kaldır
  sanitized = sanitized.replace(/<(iframe|embed|object)\b[^<]*(?:(?!<\/(iframe|embed|object)>)<[^<]*)*<\/(iframe|embed|object)>/gi, '');
  
  // javascript: protocol'ü kaldır
  sanitized = sanitized.replace(/javascript:/gi, '');
  
  // data: protocol'ü kaldır (data URI XSS)
  sanitized = sanitized.replace(/data:text\/html/gi, '');

  return sanitized;
};

// Middleware - request body'deki HTML field'larını sanitize et
const htmlSanitizeMiddleware = (req, res, next) => {
  if (!req.body) return next();

  // Sanitize edilmesi gereken alanlar
  const htmlFields = ['content', 'misyon', 'vizyon', 'hedefler', 'details', 'description', 'text', 'body'];

  htmlFields.forEach(field => {
    if (req.body[field] && typeof req.body[field] === 'string') {
      req.body[field] = sanitizeHtml(req.body[field]);
    }
  });

  next();
};

module.exports = {
  sanitizeHtml,
  htmlSanitizeMiddleware
};
