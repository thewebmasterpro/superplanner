/**
 * Validate phone number format (E.164)
 */
export function isValidPhoneNumber(phone) {
  return /^\+[1-9]\d{6,14}$/.test(phone);
}

/**
 * Validate SMS message content
 */
export function isValidMessage(message) {
  if (!message || typeof message !== 'string') return false;
  const trimmed = message.trim();
  return trimmed.length > 0 && trimmed.length <= 1600;
}

/**
 * Sanitize phone number (remove spaces, dashes)
 */
export function sanitizePhoneNumber(phone) {
  return phone.replace(/[\s\-().]/g, '');
}
