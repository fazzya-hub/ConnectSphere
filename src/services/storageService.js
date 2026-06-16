import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

/**
 * Upload foto post ke Firebase Storage.
 * @param {string} userId
 * @param {string} localUri - URI lokal dari expo-image-picker
 * @returns {Promise<{ data: string|null, error: string|null }>}
 */
export async function uploadPostImage(userId, localUri) {
  try {
    const filename = `posts/${userId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    const response = await fetch(localUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return { data: downloadURL, error: null };
  } catch (error) {
    console.error('[storageService] uploadPostImage error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Upload foto profil ke Firebase Storage.
 * @param {string} userId
 * @param {string} localUri
 * @returns {Promise<{ data: string|null, error: string|null }>}
 */
export async function uploadProfilePhoto(userId, localUri) {
  try {
    const filename = `avatars/${userId}/profile.jpg`;
    const storageRef = ref(storage, filename);
    const response = await fetch(localUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return { data: downloadURL, error: null };
  } catch (error) {
    console.error('[storageService] uploadProfilePhoto error:', error.message);
    return { data: null, error: error.message };
  }
}
