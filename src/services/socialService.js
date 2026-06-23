import {
  doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, limit,
  writeBatch, increment, arrayUnion, arrayRemove,
  serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotification } from './notificationService';

export async function followUser(followerId, targetId, isTargetPrivate) {
  if (followerId === targetId) return { data: null, error: 'Tidak bisa follow diri sendiri' };
  try {
    const batch = writeBatch(db);

    if (isTargetPrivate) {
      const requestRef = doc(db, 'followRequests', `${followerId}_${targetId}`);
      batch.set(requestRef, {
        fromUserId: followerId,
        toUserId: targetId,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
    } else {
      const followRef = doc(db, 'follows', `${followerId}_${targetId}`);
      const followSnap = await getDoc(followRef);
      if (followSnap.exists()) return { data: true, error: null };

      batch.set(followRef, {
        followerId,
        followingId: targetId,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', targetId), { followersCount: increment(1) });
      batch.update(doc(db, 'users', followerId), { followingCount: increment(1) });
    }

    console.log(`[socialService] Committing follow: ${followerId} -> ${targetId}`);
    await batch.commit();
    console.log(`[socialService] Commit successful!`);

    await createNotification({
      type: isTargetPrivate ? 'follow_request' : 'follow',
      recipientId: targetId,
      actorId: followerId,
    });

    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] followUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function unfollowUser(followerId, targetId) {
  if (followerId === targetId) return { data: null, error: 'Tidak bisa unfollow diri sendiri' };
  try {
    const followRef = doc(db, 'follows', `${followerId}_${targetId}`);
    const followSnap = await getDoc(followRef);

    if (!followSnap.exists()) {
      return { data: true, error: null };
    }

    const batch = writeBatch(db);
    batch.delete(followRef);
    batch.update(doc(db, 'users', targetId), { followersCount: increment(-1) });
    batch.update(doc(db, 'users', followerId), { followingCount: increment(-1) });
    await batch.commit();
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] unfollowUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function syncFollowCounts(userId) {
  try {
    const followingSnap = await getDocs(
      query(collection(db, 'follows'), where('followerId', '==', userId))
    );
    const actualFollowing = followingSnap.size;

    const followersSnap = await getDocs(
      query(collection(db, 'follows'), where('followingId', '==', userId))
    );
    const actualFollowers = followersSnap.size;

    await updateDoc(doc(db, 'users', userId), {
      followingCount: actualFollowing,
      followersCount: actualFollowers,
    });
    console.log(`[socialService] Synced counts for ${userId}: ${actualFollowers} followers, ${actualFollowing} following.`);
  } catch (error) {
    console.error('[socialService] syncFollowCounts error:', error);
  }
}

export async function respondToFollowRequest(requestId, action) {
  try {
    const requestRef = doc(db, 'followRequests', requestId);
    const requestSnap = await getDoc(requestRef);
    if (!requestSnap.exists()) return { data: null, error: 'Request tidak ditemukan' };

    const { fromUserId, toUserId } = requestSnap.data();
    const batch = writeBatch(db);
    batch.delete(requestRef);

    if (action === 'accepted') {
      const followRef = doc(db, 'follows', `${fromUserId}_${toUserId}`);
      batch.set(followRef, {
        followerId: fromUserId,
        followingId: toUserId,
        createdAt: serverTimestamp(),
      });
      batch.update(doc(db, 'users', toUserId), { followersCount: increment(1) });
      batch.update(doc(db, 'users', fromUserId), { followingCount: increment(1) });
    }

    await batch.commit();

    if (action === 'accepted') {

      createNotification({
        type: 'follow_accept',
        recipientId: fromUserId,
        actorId: toUserId,
      }).catch((e) => console.error('[socialService] accept notif error:', e));
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] respondToFollowRequest error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function cancelFollowRequest(followerId, targetId) {
  try {
    await deleteDoc(doc(db, 'followRequests', `${followerId}_${targetId}`));
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] cancelFollowRequest error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function blockUser(blockerId, blockedId) {
  try {
    await setDoc(doc(db, 'blocks', `${blockerId}_${blockedId}`), {
      blockerId,
      blockedId,
      createdAt: serverTimestamp(),
    });

    await unfollowUser(blockerId, blockedId).catch(() => {});
    await unfollowUser(blockedId, blockerId).catch(() => {});
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] blockUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function unblockUser(blockerId, blockedId) {
  try {
    await deleteDoc(doc(db, 'blocks', `${blockerId}_${blockedId}`));
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] unblockUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function muteUser(muterId, mutedId) {
  try {
    await setDoc(doc(db, 'mutes', `${muterId}_${mutedId}`), {
      muterId,
      mutedId,
      createdAt: serverTimestamp(),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] muteUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function unmuteUser(muterId, mutedId) {
  try {
    await deleteDoc(doc(db, 'mutes', `${muterId}_${mutedId}`));
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] unmuteUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function addToCloseFriends(currentUserId, targetUserId) {
  try {
    await updateDoc(doc(db, 'users', currentUserId), {
      closeFriends: arrayUnion(targetUserId),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] addToCloseFriends error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function removeFromCloseFriends(currentUserId, targetUserId) {
  try {
    await updateDoc(doc(db, 'users', currentUserId), {
      closeFriends: arrayRemove(targetUserId),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] removeFromCloseFriends error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

export async function searchUsers(queryText, currentUserId) {
  if (!queryText || queryText.trim().length === 0) return { data: [], error: null };
  try {
    const endText = queryText + '\uf8ff';
    const q = query(
      collection(db, 'users'),
      where('username', '>=', queryText.toLowerCase()),
      where('username', '<=', endText),
      limit(20)
    );
    const snapshot = await getDocs(q);
    let data = snapshot.docs.map(d => ({ id: d.id, uid: d.id, ...d.data() }));

    if (currentUserId) {
      data = data.filter(u => u.id !== currentUserId);
      const { data: blockedIds } = await getAllBlockedUserIds(currentUserId);
      data = data.filter(u => !blockedIds.has(u.id));
    }

    return { data, error: null };
  } catch (error) {
    console.error('[socialService] searchUsers error:', error.code, error.message);
    return { data: [], error: error.message };
  }
}

export async function checkBlockStatus(userA, userB) {
  try {
    const blockRef2 = doc(db, 'blocks', `${userB}_${userA}`);
    const snap2 = await getDoc(blockRef2).catch(() => null);
    if (snap2 && snap2.exists()) return true;
    return false;
  } catch (error) {
    console.error('[socialService] checkBlockStatus error:', error);
    return false;
  }
}

export async function checkHasBlocked(currentUserId, targetUserId) {
  try {
    const blockRef = doc(db, 'blocks', `${currentUserId}_${targetUserId}`);
    const snap = await getDoc(blockRef).catch(() => null);
    if (snap && snap.exists()) return true;
    return false;
  } catch (error) {
    console.error('[socialService] checkHasBlocked error:', error);
    return false;
  }
}

export async function getAllBlockedUserIds(userId) {
  try {
    const q1 = query(collection(db, 'blocks'), where('blockerId', '==', userId));
    const q2 = query(collection(db, 'blocks'), where('blockedId', '==', userId));

    const [snap1, snap2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);

    const blockedIds = new Set();
    snap1.docs.forEach((d) => blockedIds.add(d.data().blockedId));
    snap2.docs.forEach((d) => blockedIds.add(d.data().blockerId));

    return { data: blockedIds, error: null };
  } catch (error) {
    console.error('[socialService] getAllBlockedUserIds error:', error.message);
    return { data: new Set(), error: error.message };
  }
}
