/**
 * Memvalidasi format email.
 * @param {string} email
 * @returns {boolean}
 */
export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Memvalidasi username (huruf, angka, underscore, 3-20 karakter).
 * @param {string} username
 * @returns {boolean}
 */
export function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

/**
 * Memvalidasi panjang password minimal.
 * @param {string} password
 * @param {number} minLength
 * @returns {boolean}
 */
export function isValidPassword(password, minLength = 6) {
  return password.length >= minLength;
}
