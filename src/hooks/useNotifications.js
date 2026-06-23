import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot,
  updateDoc, doc, orderBy, limit, writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import useNotificationStore from '../store/notificationStore';
import { getUserById } from '../services/firestoreService';

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

export async function markNotificationRead(notifId) {
  try {
    await updateDoc(doc(db, 'notifications', notifId), { isRead: true });
    return { data: true, error: null };
  } catch (error) {
    console.error('[useNotifications] markNotificationRead error:', error);
    return { data: null, error: error.message };
  }
}

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
