import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, orderBy, limit, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import useNotificationStore from '../store/notificationStore';
import { getUserById } from '../services/firestoreService';

/**
 * Subscribe ke jumlah notifikasi belum dibaca secara real-time via onSnapshot.
 * Update badge di tab bar otomatis melalui Zustand store.
 * @param {string} userId
 * @returns {{ unreadCount: number }}
 */
export function useUnreadNotifCount(userId) {
  const setUnreadCount = useNotificationStore((s) => s.setUnreadCount);
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.size);
    }, (error) => {
      console.error('[useNotifications] useUnreadNotifCount error:', error);
    });

    return () => unsubscribe();
  }, [userId, setUnreadCount]);

  return { unreadCount };
}

/**
 * Subscribe ke semua notifikasi user secara real-time,
 * dengan enrichment nama & foto dari actor.
 * @param {string} userId
 * @param {number} limitCount - Jumlah notif yang diambil (default 30)
 * @returns {{ notifications: Object[], isLoading: boolean }}
 */
export function useNotifications(userId, limitCount = 30) {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const setStoreNotifications = useNotificationStore((s) => s.setNotifications);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const rawNotifs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));

      // Enrich dengan nama actor
      const enriched = await Promise.all(
        rawNotifs.map(async (notif) => {
          const firstActorId = notif.actorIds?.[0] || notif.actorId;
          if (!firstActorId) return notif;
          try {
            const { data: userData } = await getUserById(firstActorId);
            if (!userData) return notif;
            const othersCount = (notif.actorCount || 1) - 1;
            const otherText = othersCount > 0 ? ` dan ${othersCount} lainnya` : '';
            return {
              ...notif,
              actorName: (userData.displayName || userData.username || 'Pengguna') + otherText,
              actorPhoto: userData.photoURL || null,
            };
          } catch (e) {
            return notif;
          }
        })
      );

      setNotifications(enriched);
      setStoreNotifications(enriched);
      setIsLoading(false);
    }, (error) => {
      console.error('[useNotifications] useNotifications error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, limitCount, setStoreNotifications]);

  return { notifications, isLoading };
}

/**
 * Menandai notifikasi sebagai sudah dibaca.
 * @param {string} notifId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function markNotificationRead(notifId) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
    return { data: true, error: null };
  } catch (error) {
    console.error('[useNotifications] markNotificationRead error:', error);
    return { data: null, error: error.message };
  }
}

/**
 * Menandai semua notifikasi user sebagai sudah dibaca.
 * @param {string} userId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function markAllNotificationsRead(userId) {
  try {
    const { getDocs } = await import('firebase/firestore');
    const q = query(
      collection(db, 'notifications'),
      where('recipientId', '==', userId),
      where('isRead', '==', false)
    );
    const snapshot = await getDocs(q);
    if (snapshot.empty) return { data: true, error: null };

    const batch = writeBatch(db);
    snapshot.docs.forEach(d => batch.update(d.ref, { isRead: true }));
    await batch.commit();
    return { data: true, error: null };
  } catch (error) {
    console.error('[useNotifications] markAllNotificationsRead error:', error);
    return { data: null, error: error.message };
  }
}
