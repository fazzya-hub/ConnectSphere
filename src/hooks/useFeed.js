import { useState, useEffect, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
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
      async (snapshot) => {
        const newPosts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        setPosts(newPosts);
        await AsyncStorage.setItem(FEED_CACHE_KEY, JSON.stringify(newPosts));
        if (onSettled) onSettled();
      },
      async (error) => {
        console.error('[useFeed] onSnapshot error:', error);
        const cached = await AsyncStorage.getItem(FEED_CACHE_KEY);
        if (cached) {
          setPosts(JSON.parse(cached));
        }
        if (onSettled) onSettled();
      }
    );
  }

  useEffect(() => {
    if (!followingIds || followingIds.length === 0) return;

    setIsLoading(true);

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
