import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import useLiveStatusStore from '../store/liveStatusStore';
import { formatLiveStatus } from '../utils/liveStatusFormatter';

/**
 * Subscribe realtime ke live status akun yang di-follow.
 * Query dibagi per 30 UID karena batas operator Firestore "in".
 * @param {string[]} userIds - Daftar UID yang perlu dipantau
 * @returns {{ statuses: Array, isLoading: boolean }}
 */
export function useLiveStatus(userIds = []) {
  const [statuses, setStatuses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const setLiveStatus = useLiveStatusStore((state) => state.setLiveStatus);
  const clearAllLiveStatuses = useLiveStatusStore((state) => state.clearAllLiveStatuses);

  const stableIds = useMemo(
    () => [...new Set(userIds.filter(Boolean))].sort(),
    [JSON.stringify(userIds)]
  );

  useEffect(() => {
    if (stableIds.length === 0) {
      setStatuses([]);
      clearAllLiveStatuses();
      return;
    }

    setIsLoading(true);
    const unsubscribers = [];
    const nextById = new Map();
    const chunks = [];

    for (let i = 0; i < stableIds.length; i += 30) {
      chunks.push(stableIds.slice(i, i + 30));
    }

    chunks.forEach((chunk) => {
      const q = query(collection(db, 'users'), where('uid', 'in', chunk));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          snapshot.docs.forEach((docSnap) => {
            const user = { id: docSnap.id, ...docSnap.data() };
            const liveText = user.liveStatusEnabled ? formatLiveStatus(user.liveStatus) : null;
            const uid = user.uid || user.id;

            if (liveText) {
              nextById.set(uid, { ...user, liveText });
              setLiveStatus(uid, user.liveStatus);
            } else {
              nextById.delete(uid);
            }
          });

          setStatuses([...nextById.values()]);
          setIsLoading(false);
        },
        (error) => {
          console.error('[useLiveStatus] snapshot error:', error);
          setIsLoading(false);
        }
      );
      unsubscribers.push(unsubscribe);
    });

    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, [stableIds, setLiveStatus, clearAllLiveStatuses]);

  return { statuses, isLoading };
}
