import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import {
  followUser,
  unfollowUser,
  cancelFollowRequest,
} from '../services/socialService';

/**
 * Hook untuk memantau status follow secara real-time via onSnapshot.
 * Status: 'following' | 'pending' | 'not_following' | 'loading'
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {{ status: string, isLoading: boolean, handleFollow: Function, handleUnfollow: Function, handleCancelRequest: Function }}
 */
export function useFollowStatus(currentUserId, targetUserId) {
  const [status, setStatus] = useState('loading');
  const [isLoading, setIsLoading] = useState(true);
  const [isActioning, setIsActioning] = useState(false);

  useEffect(() => {
    if (!currentUserId || !targetUserId || currentUserId === targetUserId) {
      setStatus('self');
      setIsLoading(false);
      return;
    }

    let followStatus = 'not_following';
    let requestStatus = 'none';
    let followLoaded = false;
    let requestLoaded = false;

    function updateCombinedStatus() {
      if (!followLoaded || !requestLoaded) return;

      if (followStatus === 'following') {
        setStatus('following');
      } else if (requestStatus === 'pending') {
        setStatus('pending');
      } else {
        setStatus('not_following');
      }
      setIsLoading(false);
    }

    // Listener untuk status follow
    const followQuery = query(
      collection(db, 'follows'),
      where('followerId', '==', currentUserId),
      where('followingId', '==', targetUserId)
    );

    const unsubFollow = onSnapshot(followQuery, (snap) => {
      followStatus = snap.empty ? 'not_following' : 'following';
      followLoaded = true;
      updateCombinedStatus();
    });

    // Listener untuk follow request
    const requestQuery = query(
      collection(db, 'followRequests'),
      where('fromUserId', '==', currentUserId),
      where('toUserId', '==', targetUserId),
      where('status', '==', 'pending')
    );

    const unsubRequest = onSnapshot(requestQuery, (snap) => {
      requestStatus = snap.empty ? 'none' : 'pending';
      requestLoaded = true;
      updateCombinedStatus();
    });

    return () => {
      unsubFollow();
      unsubRequest();
    };
  }, [currentUserId, targetUserId]);

  /**
   * Follow target user.
   * @param {boolean} isTargetPrivate
   */
  const handleFollow = useCallback(
    async (isTargetPrivate) => {
      if (!currentUserId || !targetUserId) return;
      setIsActioning(true);
      try {
        await followUser(currentUserId, targetUserId, isTargetPrivate);
      } catch (e) {
        console.error('[useFollowStatus] handleFollow error:', e);
      } finally {
        setIsActioning(false);
      }
    },
    [currentUserId, targetUserId]
  );

  /**
   * Unfollow target user.
   */
  const handleUnfollow = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setIsActioning(true);
    try {
      await unfollowUser(currentUserId, targetUserId);
    } catch (e) {
      console.error('[useFollowStatus] handleUnfollow error:', e);
    } finally {
      setIsActioning(false);
    }
  }, [currentUserId, targetUserId]);

  /**
   * Cancel pending follow request.
   */
  const handleCancelRequest = useCallback(async () => {
    if (!currentUserId || !targetUserId) return;
    setIsActioning(true);
    try {
      await cancelFollowRequest(currentUserId, targetUserId);
    } catch (e) {
      console.error('[useFollowStatus] handleCancelRequest error:', e);
    } finally {
      setIsActioning(false);
    }
  }, [currentUserId, targetUserId]);

  return {
    status,
    isLoading,
    isActioning,
    handleFollow,
    handleUnfollow,
    handleCancelRequest,
  };
}
