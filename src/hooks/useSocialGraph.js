import { useState, useEffect, useRef } from 'react';
import {
  collection, query, where, limit, getDocs,
  doc, getDoc, onSnapshot, orderBy,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { getAllBlockedUserIds } from '../services/socialService';

export function useFollowList(userId, type) {
  const [list, setList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!userId) { setIsLoading(false); return; }

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

  const filteredList = searchQuery
    ? list.filter(user => {
        const q = searchQuery.toLowerCase();
        return user.username?.toLowerCase().includes(q) || user.displayName?.toLowerCase().includes(q);
      })
    : list;

  return { list: filteredList, isLoading, searchQuery, setSearchQuery };
}

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

export function usePeopleYouMayKnow(currentUserId, followingIds) {
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUserId || !followingIds || followingIds.length === 0) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchSuggestions() {
      setIsLoading(true);
      try {

        const sampleFollowing = followingIds.slice(0, 5);
        const followerSets = await Promise.all(
          sampleFollowing.map(uid =>
            getDocs(query(collection(db, 'follows'), where('followingId', '==', uid), limit(10)))
          )
        );

        const { data: blockedIds } = await getAllBlockedUserIds(currentUserId);

        const candidateIds = new Set();
        followerSets.forEach(snap => {
          snap.docs.forEach(d => {
            const { followerId } = d.data();
            if (
              followerId !== currentUserId &&
              !followingIds.includes(followerId) &&
              !blockedIds.has(followerId)
            ) {
              candidateIds.add(followerId);
            }
          });
        });

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

export function useFollowStatus(followerId, targetId) {
  const [status, setStatus] = useState('not_following');
  const [isLoading, setIsLoading] = useState(true);

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

    const unsubFollow = onSnapshot(
      doc(db, 'follows', `${followerId}_${targetId}`),
      (snap) => {
        isFollowing.current = snap.exists();
        syncStatus();
      },
      () => { setIsLoading(false); }
    );

    const unsubRequest = onSnapshot(
      doc(db, 'followRequests', `${followerId}_${targetId}`),
      (snap) => {
        isPending.current = snap.exists() && snap.data()?.status === 'pending';
        syncStatus();
      },
      () => {

        isPending.current = false;
        syncStatus();
      }
    );

    return () => { unsubFollow(); unsubRequest(); };
  }, [followerId, targetId]);

  return { status, isLoading };
}
