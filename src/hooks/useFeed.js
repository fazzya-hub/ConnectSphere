import { useState, useEffect, useRef, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { db } from '../config/firebase';

const PAGE_SIZE = 10;
const FEED_CACHE_KEY = 'connectsphere:feed:posts';

export function useFeed(followingIds) {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const unsubscribeRef = useRef(null);
  const lastDocRef = useRef(null);
  const isFetchingMoreRef = useRef(false);

  /**
   * Buat query Firestore berdasarkan followingIds.
   * Firestore `in` operator max 30 items → slice ke 29 item non-self.
   */
  function buildQuery(ids, cursorDoc = null) {
    const batchIds = ids.slice(0, 29);
    const constraints = [
      where('authorId', 'in', batchIds),
      orderBy('createdAt', 'desc'),
      limit(PAGE_SIZE),
    ];
    if (cursorDoc) {
      constraints.push(startAfter(cursorDoc));
    }
    return query(collection(db, 'posts'), ...constraints);
  }

  /**
   * Subscribe realtime ke halaman pertama feed.
   * Dipanggil saat followingIds berubah atau saat refresh.
   */
  function subscribeFirstPage(ids, onSettled) {
    const q = buildQuery(ids);

    return onSnapshot(
      q,
      async (snapshot) => {
        const newPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        // Simpan dokumen terakhir sebagai cursor untuk "load more"
        lastDocRef.current = snapshot.docs[snapshot.docs.length - 1] ?? null;
        setHasMore(snapshot.docs.length === PAGE_SIZE);
        setPosts(newPosts);
        try {
          await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(newPosts));
        } catch (_) {}
        if (onSettled) onSettled();
      },
      async (error) => {
        console.error('[useFeed] onSnapshot error:', error);
        try {
          const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
          if (cached) setPosts(JSON.parse(cached));
        } catch (_) {}
        if (onSettled) onSettled();
      }
    );
  }

  // Setup realtime subscription saat followingIds berubah
  useEffect(() => {
    if (!followingIds || followingIds.length === 0) return;

    setIsLoading(true);
    lastDocRef.current = null;
    isFetchingMoreRef.current = false;

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribeFirstPage(followingIds, () => {
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
   * Refresh: reset ke halaman pertama dan pasang ulang realtime listener.
   */
  function refresh() {
    if (!followingIds || followingIds.length === 0) return;

    setIsRefreshing(true);
    lastDocRef.current = null;
    isFetchingMoreRef.current = false;
    setHasMore(true);

    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    unsubscribeRef.current = subscribeFirstPage(followingIds, () => {
      setIsRefreshing(false);
    });
  }

  /**
   * Load lebih banyak post (infinite scroll).
   * Pakai getDocs + startAfter cursor supaya tidak konflik dengan onSnapshot.
   */
  const loadMore = useCallback(async () => {
    if (
      isFetchingMoreRef.current ||
      !hasMore ||
      !lastDocRef.current ||
      !followingIds ||
      followingIds.length === 0
    ) return;

    isFetchingMoreRef.current = true;
    setIsLoadingMore(true);

    try {
      const q = buildQuery(followingIds, lastDocRef.current);
      const snapshot = await getDocs(q);

      if (snapshot.docs.length === 0) {
        setHasMore(false);
        return;
      }

      const morePosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
      lastDocRef.current = snapshot.docs[snapshot.docs.length - 1];
      setHasMore(snapshot.docs.length === PAGE_SIZE);

      setPosts((prev) => {
        // Hindari duplikat berdasarkan id
        const existingIds = new Set(prev.map((p) => p.id));
        const unique = morePosts.filter((p) => !existingIds.has(p.id));
        return [...prev, ...unique];
      });
    } catch (error) {
      console.error('[useFeed] loadMore error:', error);
    } finally {
      setIsLoadingMore(false);
      isFetchingMoreRef.current = false;
    }
  }, [followingIds, hasMore]);

  function fetchPosts(isRefresh = false) {
    if (isRefresh) {
      refresh();
    }
  }

  return { posts, fetchPosts, loadMore, isLoading, isRefreshing, isLoadingMore, hasMore };
}
