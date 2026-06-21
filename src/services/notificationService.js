import * as Notifications from 'expo-notifications';
import {
  doc,
  addDoc,
  updateDoc,
  getDocs,
  collection,
  query,
  where,
  increment,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Platform } from 'react-native';

/**
 * Mendaftarkan push notification dan mendapatkan Expo Push Token.
 * @returns {Promise<string|null>} token string atau null jika gagal
 */
export async function registerForPushNotificationsAsync() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[notificationService] Push notification permission denied');
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    // Android: channel wajib dikonfigurasi
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFC107',
      });
    }

    return token;
  } catch (error) {
    console.warn('[notificationService] registerForPushNotificationsAsync failed (expected in dev if FCM not set):', error.message);
    return null;
  }
}

/**
 * Menyimpan FCM token ke dokumen user di Firestore.
 * @param {string} userId
 * @param {string} token
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function saveFCMToken(userId, token) {
  try {
    await updateDoc(doc(db, 'users', userId), { fcmToken: token });
    console.log('[notificationService] FCM token saved:', token);
    return { data: true, error: null };
  } catch (error) {
    console.error('[notificationService] saveFCMToken error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Membuat notifikasi in-app di Firestore.
 * Jika notifikasi serupa sudah ada (belum dibaca), group actors.
 * @param {Object} params
 * @param {string} params.type - 'like' | 'comment' | 'follow' | 'dm' | 'follow_request'
 * @param {string} params.recipientId - UID penerima notifikasi
 * @param {string} params.actorId - UID yang melakukan aksi
 * @param {string|null} [params.postId] - ID post terkait
 * @param {string|null} [params.conversationId] - ID conversation terkait
 * @returns {Promise<{ data: string|null, error: string|null }>}
 */
export async function createNotification({
  type,
  recipientId,
  actorId,
  postId = null,
  conversationId = null,
}) {
  try {
    // Jangan kirim notifikasi ke diri sendiri
    if (recipientId === actorId) {
      return { data: null, error: null };
    }

    // Cek apakah notif serupa sudah ada (grouping)
    const constraints = [
      where('type', '==', type),
      where('recipientId', '==', recipientId),
      where('isRead', '==', false),
    ];

    if (postId) {
      constraints.push(where('postId', '==', postId));
    }

    const existingQuery = query(collection(db, 'notifications'), ...constraints);
    const existing = await getDocs(existingQuery);

    if (!existing.empty) {
      // Update notif yang ada — tambah actor (grouping)
      const notifRef = existing.docs[0].ref;
      await updateDoc(notifRef, {
        actorIds: arrayUnion(actorId),
        actorCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      return { data: notifRef.id, error: null };
    } else {
      // Buat notif baru
      const notifRef = await addDoc(collection(db, 'notifications'), {
        type,
        recipientId,
        actorIds: [actorId],
        actorCount: 1,
        postId,
        conversationId,
        isRead: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { data: notifRef.id, error: null };
    }
  } catch (error) {
    console.error('[notificationService] createNotification error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mengupdate preferensi notifikasi user.
 * @param {string} userId
 * @param {Object} prefs - { likes?: boolean, comments?: boolean, newFollower?: boolean, dm?: boolean }
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function updateNotificationPreferences(userId, prefs) {
  try {
    const updates = {};
    Object.keys(prefs).forEach((key) => {
      updates[`notificationPrefs.${key}`] = prefs[key];
    });
    await updateDoc(doc(db, 'users', userId), updates);
    return { data: true, error: null };
  } catch (error) {
    console.error('[notificationService] updateNotificationPreferences error:', error.message);
    return { data: null, error: error.message };
  }
}
