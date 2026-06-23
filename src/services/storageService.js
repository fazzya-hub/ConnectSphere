import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../config/firebase';

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

export async function uploadChatImage(conversationId, localUri) {
  try {
    const filename = `chats/${conversationId}/${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    const response = await fetch(localUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return { data: downloadURL, error: null };
  } catch (error) {
    console.error('[storageService] uploadChatImage error:', error.message);
    return { data: null, error: error.message };
  }
}

export async function uploadChatAudio(conversationId, localUri) {
  try {
    const extension = localUri.split('.').pop() || 'm4a';
    const filename = `chats/${conversationId}/audio-${Date.now()}.${extension}`;
    const storageRef = ref(storage, filename);
    const response = await fetch(localUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    const downloadURL = await getDownloadURL(storageRef);
    return { data: downloadURL, error: null };
  } catch (error) {
    console.error('[storageService] uploadChatAudio error:', error.message);
    return { data: null, error: error.message };
  }
}
