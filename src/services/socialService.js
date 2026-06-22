import {
  doc, setDoc, updateDoc, deleteDoc, getDoc, getDocs,
  collection, query, where, limit,
  writeBatch, increment, arrayUnion, arrayRemove,
  serverTimestamp, addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotification } from './notificationService';

/**
 * Mengikuti user lain. Cek apakah akun target public atau private.
 * - Public: langsung follow (auto-approve) + buat notifikasi
 * - Private: buat follow request (pending approval)
 * @param {string} followerId - UID user yang ingin follow
 * @param {string} targetId - UID user yang ingin di-follow
 * @param {boolean} isTargetPrivate
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
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
      if (followSnap.exists()) return { data: true, error: null }; // Already following

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

    // Buat notifikasi untuk target user
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
      return { data: true, error: null }; // Already not following
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

/**
 * Sinkronisasi ulang (recalculate) jumlah followers dan following untuk seorang user
 * agar datanya sesuai dengan jumlah dokumen aktual di collection 'follows'.
 * Fungsi ini memperbaiki masalah data tidak sinkron (misal angka -2 atau jumlah meleset).
 * @param {string} userId
 * @returns {Promise<void>}
 */
export async function syncFollowCounts(userId) {
  try {
    // Hitung actual following
    const followingSnap = await getDocs(
      query(collection(db, 'follows'), where('followerId', '==', userId))
    );
    const actualFollowing = followingSnap.size;

    // Hitung actual followers
    const followersSnap = await getDocs(
      query(collection(db, 'follows'), where('followingId', '==', userId))
    );
    const actualFollowers = followersSnap.size;

    // Update dokumen user dengan angka yang benar
    await updateDoc(doc(db, 'users', userId), {
      followingCount: actualFollowing,
      followersCount: actualFollowers,
    });
    console.log(`[socialService] Synced counts for ${userId}: ${actualFollowers} followers, ${actualFollowing} following.`);
  } catch (error) {
    console.error('[socialService] syncFollowCounts error:', error);
  }
}

/**
 * Menerima atau menolak follow request.
 * @param {string} requestId - ID dokumen di collection 'followRequests' (fromId_toId)
 * @param {'accepted' | 'rejected'} action
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
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
      // Beritahu si requester bahwa requestnya diterima
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

/**
 * Batalkan follow request yang sudah dikirim.
 * @param {string} followerId
 * @param {string} targetId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function cancelFollowRequest(followerId, targetId) {
  try {
    await deleteDoc(doc(db, 'followRequests', `${followerId}_${targetId}`));
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] cancelFollowRequest error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Block user: user yang diblokir tidak bisa lihat konten kita,
 * tidak bisa DM, dan tidak muncul di explore.
 * @param {string} blockerId
 * @param {string} blockedId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function blockUser(blockerId, blockedId) {
  try {
    await setDoc(doc(db, 'blocks', `${blockerId}_${blockedId}`), {
      blockerId,
      blockedId,
      createdAt: serverTimestamp(),
    });
    // Hapus relasi follow jika ada (kedua arah)
    await unfollowUser(blockerId, blockedId).catch(() => {});
    await unfollowUser(blockedId, blockerId).catch(() => {});
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] blockUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Unblock user.
 * @param {string} blockerId
 * @param {string} blockedId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function unblockUser(blockerId, blockedId) {
  try {
    await deleteDoc(doc(db, 'blocks', `${blockerId}_${blockedId}`));
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] unblockUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mute user: postnya tidak muncul di feed kita, tapi masih bisa follow.
 * @param {string} muterId
 * @param {string} mutedId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
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

/**
 * Unmute user.
 * @param {string} muterId
 * @param {string} mutedId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function unmuteUser(muterId, mutedId) {
  try {
    await deleteDoc(doc(db, 'mutes', `${muterId}_${mutedId}`));
    return { data: true, error: null };
  } catch (error) {
    console.error('[socialService] unmuteUser error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menandai user sebagai Close Friend.
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
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

/**
 * Hapus user dari Close Friend.
 * @param {string} currentUserId
 * @param {string} targetUserId
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
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

/**
 * Search users by username atau displayName (prefix match), memfilter pengguna yang diblokir.
 * @param {string} queryText
 * @param {string} currentUserId
 * @returns {Promise<{ data: Object[], error: string|null }>}
 */
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

/**
 * Mengecek apakah ada status blokir antar dua user (salah satu memblokir yang lain).
 * Karena query rule blocks membutuhkan blockerId/blockedId == currentUser, 
 * fungsi ini akan me-return true jika doc exists atau kena permission error.
 * @param {string} userA
 * @param {string} userB
 * @returns {Promise<boolean>}
 */
export async function checkBlockStatus(userA, userB) {
  try {
    // Hanya cek apakah userB memblokir userA
    const blockRef2 = doc(db, 'blocks', `${userB}_${userA}`);
    
    const snap2 = await getDoc(blockRef2).catch(() => null);
    if (snap2 && snap2.exists()) return true;
    
    return false;
  } catch (error) {
    console.error('[socialService] checkBlockStatus error:', error);
    return false;
  }
}

/**
 * Mengecek apakah currentUser memblokir targetUser.
 */
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

/**
 * Mengambil SEMUA ID user yang diblokir oleh user saat ini, ATAU yang memblokir user saat ini.
 * @param {string} userId
 * @returns {Promise<{ data: Set<string>, error: string|null }>}
 */
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
