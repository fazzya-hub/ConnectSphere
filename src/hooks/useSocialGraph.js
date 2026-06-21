import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, limit, getDocs,
  doc, getDoc, onSnapshot, orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Subscribe realtime ke daftar follower atau following user.
 * Pencarian dilakukan client-side untuk menghemat Firestore reads.
 * @param {string} userId
 * @param {'followers' | 'following'} type
 * @returns {{ list: Object[], isLoading: boolean, searchQuery: string, setSearchQuery: Function }}
 */
export function useFollowList(userId, type) {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }

    // followers → cari dokumen follows di mana followingId == userId (orang yg follow kita)
    // following → cari dokumen follows di mana followerId == userId (orang yg kita follow)
    const filterField = type === 'followers' ? 'followingId' : 'followerId';
    const targetField = type === 'followers' ? 'followerId' : 'followingId';

    const q = query(collection(db, 'follows'), where(filterField, '==', userId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const targetUserIds = snapshot.docs.map(d => d.data()[targetField]);
      if (targetUserIds.length === 0) {
        setList([]);
        setIsLoading(false);
        return;
      }
      try {
        // Firestore 'in' query max 30 items
        const batchIds = targetUserIds.slice(0, 30);
        const userDocs = await Promise.all(
          batchIds.map(uid => getDoc(doc(db, 'users', uid)))
        );
        setList(userDocs.filter(d => d.exists()).map(d => ({ id: d.id, uid: d.id, ...d.data() })));
      } catch (error) {
        console.error('[useSocialGraph] useFollowList fetch error:', error);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('[useSocialGraph] useFollowList snapshot error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId, type]);

  // Filter lokal — hemat Firestore reads
  const filteredList = searchQuery.trim()
    ? list.filter(user => {
        const q = searchQuery.toLowerCase();
        return user.username?.toLowerCase().includes(q) || user.displayName?.toLowerCase().includes(q);
      })
    : list;

  return { list: filteredList, isLoading, searchQuery, setSearchQuery };
}

/**
 * Subscribe realtime ke follow requests masuk untuk user tertentu.
 * @param {string} userId
 * @returns {{ requests: Object[], isLoading: boolean }}
 */
export function useFollowRequests(userId) {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }

    const q = query(
      collection(db, 'followRequests'),
      where('toUserId', '==', userId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      try {
        const fromIds = snapshot.docs.map(d => ({ docId: d.id, ...d.data() }));
        const enriched = await Promise.all(
          fromIds.map(async (req) => {
            const userDoc = await getDoc(doc(db, 'users', req.fromUserId));
            return userDoc.exists()
              ? { requestDocId: req.docId, ...req, ...userDoc.data(), id: userDoc.id, uid: userDoc.id }
              : null;
          })
        );
        setRequests(enriched.filter(Boolean));
      } catch (error) {
        console.error('[useSocialGraph] useFollowRequests error:', error);
      } finally {
        setIsLoading(false);
      }
    }, (error) => {
      console.error('[useSocialGraph] useFollowRequests snapshot error:', error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [userId]);

  return { requests, isLoading };
}

/**
 * Saran follow berdasarkan mutual followers.
 * Algoritma: ambil follower dari user yang kita follow,
 * filter yang belum kita follow dan bukan diri sendiri.
 * @param {string} currentUserId
 * @param {string[]} followingIds - Array UID yang sudah di-follow
 * @returns {{ suggestions: Object[], isLoading: boolean }}
 */
export function usePeopleYouMayKnow(currentUserId, followingIds) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId) { setIsLoading(false); return; }

    let cancelled = false;

    async function fetchSuggestions() {
      try {
        // Ambil follower dari user-user yang kita follow (mutual network)
        const sampleFollowing = followingIds.slice(0, 5);
        let candidateIds = new Set();

        if (sampleFollowing.length > 0) {
          const followerSets = await Promise.all(
            sampleFollowing.map(uid =>
              getDocs(query(collection(db, 'follows'), where('followingId', '==', uid), limit(10)))
            )
          );
          followerSets.forEach(snap => {
            snap.docs.forEach(d => {
              const { followerId } = d.data();
              if (followerId !== currentUserId && !followingIds.includes(followerId)) {
                candidateIds.add(followerId);
              }
            });
          });
        }

        // Jika belum cukup, ambil user acak
        if (candidateIds.size < 5) {
          const randomSnap = await getDocs(query(collection(db, 'users'), limit(20)));
          randomSnap.docs.forEach(d => {
            if (d.id !== currentUserId && !followingIds.includes(d.id) && !candidateIds.has(d.id)) {
              candidateIds.add(d.id);
            }
          });
        }

        const userDocs = await Promise.all(
          [...candidateIds].slice(0, 10).map(uid => getDoc(doc(db, 'users', uid)))
        );

        if (!cancelled) {
          setSuggestions(
            userDocs.filter(d => d.exists()).map(d => ({ id: d.id, uid: d.id, ...d.data() }))
              .sort(() => 0.5 - Math.random())
              .slice(0, 5)
          );
        }
      } catch (error) {
        console.error('[useSocialGraph] usePeopleYouMayKnow error:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchSuggestions();
    return () => { cancelled = true; };
  }, [currentUserId, JSON.stringify(followingIds)]);

  return { suggestions, isLoading };
}

/**
 * Menghitung mutual followers antara current user dan target.
 * Output UI: "Diikuti oleh si_a, si_b, dan 5 lainnya"
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {{ mutualCount: number, mutualPreview: Object[] }}
 */
export function useMutualFollowers(currentUserId, targetUserId) {
  const [mutualCount, setMutualCount] = useState(0);
  const [mutualPreview, setMutualPreview] = useState([]);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) return;

    let cancelled = false;

    async function fetchMutuals() {
      try {
        const myFollowingSnap = await getDocs(
          query(collection(db, 'follows'), where('followerId', '==', currentUserId))
        );
        const myFollowingIds = new Set(myFollowingSnap.docs.map(d => d.data().followingId));

        const targetFollowersSnap = await getDocs(
          query(collection(db, 'follows'), where('followingId', '==', targetUserId))
        );
        const targetFollowerIds = targetFollowersSnap.docs.map(d => d.data().followerId);

        const mutuals = targetFollowerIds.filter(id => myFollowingIds.has(id));
        if (cancelled) return;

        setMutualCount(mutuals.length);

        if (mutuals.length > 0) {
          const previewDocs = await Promise.all(
            mutuals.slice(0, 2).map(uid => getDoc(doc(db, 'users', uid)))
          );
          if (!cancelled) {
            setMutualPreview(previewDocs.filter(d => d.exists()).map(d => ({ id: d.id, ...d.data() })));
          }
        }
      } catch (error) {
        console.error('[useSocialGraph] useMutualFollowers error:', error);
      }
    }

    fetchMutuals();
    return () => { cancelled = true; };
  }, [currentUserId, targetUserId]);

  return { mutualCount, mutualPreview };
}

/**
 * Cek status follow antara dua user secara realtime.
 * Menggunakan onSnapshot per dokumen (bukan query) untuk menghindari kebutuhan composite index
 * dan masalah permission-denied saat dokumen belum ada.
 * @param {string} followerId
 * @param {string} targetId
 * @returns {{ status: 'following'|'pending'|'not_following', isLoading: boolean }}
 */
export function useFollowStatus(followerId, targetId) {
  const [status, setStatus] = useState('not_following');
  const [isLoading, setIsLoading] = useState(true);
  // Track kedua state secara terpisah
  const isFollowing = useRef(false);
  const isPending = useRef(false);

  useEffect(() => {
    if (!followerId || !targetId || followerId === targetId) {
      setIsLoading(false);
      return;
    }

    function syncStatus() {
      if (isFollowing.current) setStatus('following');
      else if (isPending.current) setStatus('pending');
      else setStatus('not_following');
      setIsLoading(false);
    }

    // Doc ID deterministik — tidak butuh composite index
    const unsubFollow = onSnapshot(
      doc(db, 'follows', `${followerId}_${targetId}`),
      (snap) => {
        isFollowing.current = snap.exists();
        syncStatus();
      },
      () => { setIsLoading(false); }
    );

    // followRequests dibaca sebagai single doc — lebih aman terhadap rules
    const unsubRequest = onSnapshot(
      doc(db, 'followRequests', `${followerId}_${targetId}`),
      (snap) => {
        isPending.current = snap.exists() && snap.data()?.status === 'pending';
        syncStatus();
      },
      () => {
        // Permission denied (dokumen tidak ada) — anggap bukan pending
        isPending.current = false;
        syncStatus();
      }
    );

    return () => { unsubFollow(); unsubRequest(); };
  }, [followerId, targetId]);

  return { status, isLoading };
}

