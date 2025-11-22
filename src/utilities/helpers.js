/**
 * Format a number as Indonesian Rupiah
 * @param {number} amount - The amount to format
 * @returns {string} Formatted Rupiah string
 */
function formatRupiah(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

/**
 * Validate if a URL is a valid image URL
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid image URL
 */
function isValidImageUrl(url) {
  try {
    const urlObj = new URL(url);
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    return imageExtensions.some(ext => urlObj.pathname.toLowerCase().endsWith(ext)) || 
           url.includes('discord') || 
           url.includes('imgur') ||
           url.includes('cdn');
  } catch {
    return false;
  }
}

/**
 * Generate a unique ticket ID
 * @returns {string} Unique ticket ID
 */
function generateTicketId() {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 7);
  return `${timestamp}-${randomStr}`.toUpperCase();
}

/**
 * Calculate duration between two dates
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (defaults to now)
 * @returns {string} Human-readable duration
 */
function calculateDuration(startDate, endDate = new Date()) {
  const duration = endDate.getTime() - new Date(startDate).getTime();
  
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  const hours = Math.floor((duration % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
  
  const parts = [];
  if (days > 0) parts.push(`${days}d`);
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`);
  
  return parts.join(' ');
}

/**
 * Validate fee configuration
 * @param {number} min - Minimum amount
 * @param {number} max - Maximum amount
 * @param {number} fee - Fee amount
 * @param {number} percentage - Fee percentage
 * @returns {object} Validation result
 */
function validateFeeConfig(min, max, fee, percentage) {
  const errors = [];

  if (min < 0) {
    errors.push('Jumlah minimum tidak boleh negatif');
  }

  if (max !== 0 && max < min) {
    errors.push('Jumlah maksimum harus lebih besar dari minimum');
  }

  if (!percentage && fee <= 0) {
    errors.push('Jumlah biaya harus positif ketika tidak menggunakan persentase');
  }

  if (percentage && (percentage <= 0 || percentage > 100)) {
    errors.push('Persentase harus antara 0 dan 100');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Format timestamp for Discord
 * @param {Date} date - Date to format
 * @param {string} style - Discord timestamp style (t, T, d, D, f, F, R)
 * @returns {string} Discord formatted timestamp
 */
function discordTimestamp(date = new Date(), style = 'F') {
  const timestamp = Math.floor(date.getTime() / 1000);
  return `<t:${timestamp}:${style}>`;
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
function truncate(text, maxLength = 100) {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Check if user is authorized (Access_ID)
 * Supports multiple IDs separated by comma
 * @param {string} userId - User ID to check
 * @returns {boolean} True if user is authorized
 */
function isAuthorized(userId) {
  if (!process.env.Access_ID) return false;
  const authorizedIds = process.env.Access_ID.split(',').map(id => id.trim());
  return authorizedIds.includes(userId);
}

/**
 * Get all authorized user IDs
 * @returns {string[]} Array of authorized user IDs
 */
function getAuthorizedIds() {
  if (!process.env.Access_ID) return [];
  return process.env.Access_ID.split(',').map(id => id.trim());
}

module.exports = {
  formatRupiah,
  isValidImageUrl,
  generateTicketId,
  calculateDuration,
  validateFeeConfig,
  discordTimestamp,
  truncate,
  isAuthorized,
  getAuthorizedIds
};
