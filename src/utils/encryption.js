import * as Crypto from 'expo-crypto';
import CryptoJS from 'crypto-js';

const DECRYPT_ERROR_TEXT = '[pesan tidak dapat didekripsi]';
const SECRET_KEY = process.env.EXPO_PUBLIC_CHAT_ENCRYPTION_KEY;
const AES_KEY = SECRET_KEY ? CryptoJS.SHA256(SECRET_KEY) : null;

if (!SECRET_KEY) {
  console.warn('[encryption] EXPO_PUBLIC_CHAT_ENCRYPTION_KEY belum diatur di .env');
}

/**
 * Mengambil secret key chat dari environment.
 * @returns {string}
 */
function getSecretKey() {
  if (!SECRET_KEY) {
    throw new Error('EXPO_PUBLIC_CHAT_ENCRYPTION_KEY belum diatur');
  }

  return SECRET_KEY;
}

/**
 * Mengambil AES key 256-bit dari environment.
 * @returns {CryptoJS.lib.WordArray}
 */
function getAesKey() {
  if (!AES_KEY) {
    throw new Error('EXPO_PUBLIC_CHAT_ENCRYPTION_KEY belum diatur');
  }

  return AES_KEY;
}

/**
 * Mengubah byte array dari Expo Crypto menjadi CryptoJS WordArray.
 * @param {Uint8Array} bytes
 * @returns {CryptoJS.lib.WordArray}
 */
function wordArrayFromBytes(bytes) {
  const words = [];

  for (let index = 0; index < bytes.length; index += 1) {
    words[index >>> 2] |= bytes[index] << (24 - (index % 4) * 8);
  }

  return CryptoJS.lib.WordArray.create(words, bytes.length);
}

/**
 * Menghasilkan IV acak untuk AES-CBC tanpa memakai random bawaan crypto-js.
 * @returns {Promise<CryptoJS.lib.WordArray>}
 */
async function generateIv() {
  const ivBytes = await Crypto.getRandomBytesAsync(16);
  return wordArrayFromBytes(ivBytes);
}

/**
 * Mengecek apakah teks terlihat seperti ciphertext AES.
 * @param {string} text
 * @returns {boolean}
 */
export function isEncryptedMessage(text) {
  if (!text || typeof text !== 'string') return false;
  return text.startsWith('U2FsdGVkX1') || text.startsWith('v1:') || text.split(':').length === 2;
}

/**
 * Mengenkripsi teks pesan sebelum disimpan ke Firestore.
 * @param {string} plainText - Pesan asli dari user
 * @returns {Promise<string>} Ciphertext AES untuk disimpan di Firestore
 */
export async function encryptMessage(plainText) {
  if (!plainText) return '';

  try {
    const iv = await generateIv();
    const encrypted = CryptoJS.AES.encrypt(plainText, getAesKey(), {
      iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    return [
      'v1',
      iv.toString(CryptoJS.enc.Base64),
      encrypted.ciphertext.toString(CryptoJS.enc.Base64),
    ].join(':');
  } catch (error) {
    console.error('[encryption] encryptMessage error:', error.message);
    throw error;
  }
}

/**
 * Mendekripsi format AES-CBC iv:ciphertext dari versi enkripsi sebelumnya.
 * @param {string} encodedText
 * @returns {string}
 */
function decryptIvCiphertextMessage(encodedText) {
  const parts = encodedText.split(':');
  const [ivBase64, ciphertextBase64] = parts[0] === 'v1' ? parts.slice(1) : parts;
  if (!ivBase64 || !ciphertextBase64) return DECRYPT_ERROR_TEXT;

  const cipherParams = CryptoJS.lib.CipherParams.create({
    ciphertext: CryptoJS.enc.Base64.parse(ciphertextBase64),
  });

  const decrypted = CryptoJS.AES.decrypt(cipherParams, getAesKey(), {
    iv: CryptoJS.enc.Base64.parse(ivBase64),
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  });

  return decrypted.toString(CryptoJS.enc.Utf8) || DECRYPT_ERROR_TEXT;
}

/**
 * Mendekripsi teks pesan yang diambil dari Firestore.
 * Jika teks belum terenkripsi, teks asli dikembalikan agar UI tetap aman untuk data lama.
 * @param {string} cipherText - Ciphertext dari Firestore
 * @returns {string} Plaintext untuk ditampilkan di aplikasi
 */
export function decryptMessage(cipherText) {
  if (!cipherText) return '';

  try {
    if (!isEncryptedMessage(cipherText)) {
      return cipherText;
    }

    if (cipherText.includes(':') && !cipherText.startsWith('U2FsdGVkX1')) {
      return decryptIvCiphertextMessage(cipherText);
    }

    const bytes = CryptoJS.AES.decrypt(cipherText, getSecretKey());
    return bytes.toString(CryptoJS.enc.Utf8) || DECRYPT_ERROR_TEXT;
  } catch (error) {
    console.error('[encryption] decryptMessage error:', error.message);
    return DECRYPT_ERROR_TEXT;
  }
}
