import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../config/firebase';

const PAGE_SIZE = 10;

/**
 * Hook untuk feed real-time dengan onSnapshot.
 * Setiap perubahan pada post (likesCount, commentsCount, dll) langsung
 * terefleksi tanpa perlu refresh manual.
 * @param {string[]} followingIds - Array UID yang di-follow + diri sendiri
 * @returns {{ posts, isLoading, isRefreshing, refresh }}
 */
export function useFeed(followingIds) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Set referensi unsubscribe untuk di-cleanup
  const unsubscribeRef = useRef(null);

  function subscribe(ids, onSettled) {
    const batchIds = ids.slice(0, 29);

    const q = query(
      collection(db, 'posts'),
      where('authorId', 'in', batchIds),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const newPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPosts(newPosts);
        if (onSettled) onSettled();
      },
      (error) => {
        console.error('[useFeed] onSnapshot error:', error);
        if (onSettled) onSettled();
      }
    );
  }

  useEffect(() => {
    if (!followingIds || followingIds.length === 0) return;

    setIsLoading(true);

    // Cleanup listener lama jika followingIds berubah
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribe(followingIds, () => {
      setIsLoading(false);
    });

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
        unsubscribeRef.current = null;
      }
    };
  }, [followingIds]);

  /**
   * Trigger pull-to-refresh: re-subscribe listener untuk
   * snapshot terbaru. Listener yang ada sudah real-time,
   * tapi ini memastikan UI terasa responsif saat user swipe-down.
   */
  function refresh() {
    if (!followingIds || followingIds.length === 0) return;

    setIsRefreshing(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribe(followingIds, () => {
      setIsRefreshing(false);
    });
  }

  function fetchPosts(isRefresh = false) {
    if (isRefresh) {
      refresh();
    }
  }

  return { posts, fetchPosts, isLoading, isRefreshing, hasMore: false };
}
