import CryptoJS from 'crypto-js';

const SECRET_KEY = process.env.EXPO_PUBLIC_CHAT_ENCRYPTION_KEY || 'connectsphere_dev_secret_key_12345678';

export function encryptMessage(plainText) {
  if (!plainText) return '';
  return CryptoJS.AES.encrypt(plainText, SECRET_KEY).toString();
}

export function decryptMessage(cipherText) {
  if (!cipherText) return '';
  try {
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch {
    return '[pesan tidak dapat didekripsi]';
  }
}
