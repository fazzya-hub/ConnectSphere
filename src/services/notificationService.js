import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import {
  doc,
  getDoc,
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
 * Mendaftarkan FCM token device ke Firestore agar bisa menerima push notification.
 * Panggil ini setelah user berhasil login.
 * @param {string} userId
 * @returns {Promise<{ data: string|null, error: string|null }>}
 */
export async function registerFCMToken(userId) {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('[notificationService] Push notification permission denied');
      return { data: null, error: 'Permission denied' };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId || '44d46c21-913e-4f02-a2ad-d1e51ab09d1d';
    const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
    const fcmToken = tokenData.data;

    await updateDoc(doc(db, 'users', userId), { fcmToken });
    console.log('[notificationService] FCM token registered:', fcmToken);

    // Android: channel wajib dikonfigurasi
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFC107',
      });
    }

    return { data: fcmToken, error: null };
  } catch (error) {
    console.error('[notificationService] registerFCMToken error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menghapus FCM token saat user logout.
 * @param {string} userId
 * @returns {Promise<{ error: string|null }>}
 */
export async function clearFCMToken(userId) {
  try {
    await updateDoc(doc(db, 'users', userId), { fcmToken: null });
    return { error: null };
  } catch (error) {
    console.error('[notificationService] clearFCMToken error:', error.message);
    return { error: error.message };
  }
}

/**
 * Membuat notifikasi in-app di Firestore.
 * Jika notifikasi serupa sudah ada (belum dibaca), group actors.
 * @param {Object} params
 * @param {string} params.type - 'like' | 'comment' | 'follow' | 'dm' | 'follow_request' | 'follow_accept'
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

    // Cek preferensi notifikasi penerima
    const prefKey =
      type === 'follow' || type === 'follow_request' || type === 'follow_accept'
        ? 'newFollower'
        : type === 'like'
        ? 'likes'
        : type === 'comment'
        ? 'comments'
        : type === 'dm'
        ? 'dm'
        : null;

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

    let notifId = null;

    if (!existing.empty) {
      // Update notif yang ada — tambah actor (grouping)
      const existingDoc = existing.docs[0];
      const existingData = existingDoc.data();
      const notifRef = existingDoc.ref;
      notifId = existingDoc.id;

      const hasActor = existingData.actorIds?.includes(actorId);

      const updateData = {
        actorIds: arrayUnion(actorId),
        updatedAt: serverTimestamp(),
      };

      if (!hasActor) {
        updateData.actorCount = increment(1);
      }

      await updateDoc(notifRef, updateData);
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
      notifId = notifRef.id;
    }

    // --- Send Push Notification via Expo HTTP API ---
    const userSnap = await getDoc(doc(db, 'users', recipientId));
    if (userSnap.exists()) {
      const userData = userSnap.data();
      const token = userData.fcmToken;
      const prefs = userData.notificationPrefs || {};

      // Jika token ada dan user belum mematikan notifikasi tipe ini
      if (token && (!prefKey || prefs[prefKey] !== false)) {
        const actorSnap = await getDoc(doc(db, 'users', actorId));
        const actorName = actorSnap.exists() ? actorSnap.data().displayName : 'Seseorang';

        let title = 'Notifikasi Baru';
        let body = '';

        if (type === 'like') {
          title = 'Suka Baru';
          body = `${actorName} menyukai post Anda.`;
        } else if (type === 'comment') {
          title = 'Komentar Baru';
          body = `${actorName} mengomentari post Anda.`;
        } else if (type === 'follow') {
          title = 'Pengikut Baru';
          body = `${actorName} mulai mengikuti Anda.`;
        } else if (type === 'follow_request') {
          title = 'Permintaan Mengikuti';
          body = `${actorName} meminta untuk mengikuti Anda.`;
        } else if (type === 'follow_accept') {
          title = 'Permintaan Diterima';
          body = `${actorName} menerima permintaan mengikuti Anda.`;
        } else if (type === 'dm') {
          title = 'Pesan Baru';
          body = `${actorName} mengirimkan pesan.`;
        }

        if (body) {
          fetch('https://exp.host/--/api/v2/push/send', {
            method: 'POST',
            headers: {
              Accept: 'application/json',
              'Accept-encoding': 'gzip, deflate',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              to: token,
              sound: 'default',
              title,
              body,
              data: { type, postId, conversationId, actorId },
            }),
          }).catch((err) => console.error('[notificationService] push error:', err));
        }
      }
    }

    return { data: notifId, error: null };
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
