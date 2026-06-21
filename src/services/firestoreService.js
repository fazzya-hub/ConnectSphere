import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { createNotification } from './notificationService';

/**
 * Membuat post baru di Firestore.
 * imageURL sudah diupload ke Storage terlebih dahulu sebelum memanggil fungsi ini.
 * @param {string} authorId
 * @param {string} imageURL
 * @param {string} caption
 * @returns {Promise<{ data: string|null, error: string|null }>}
 */
export async function createPost(authorId, imageURL, caption) {
  try {
    const postRef = await addDoc(collection(db, 'posts'), {
      authorId,
      imageURL,
      caption,
      likesCount: 0,
      commentsCount: 0,
      createdAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', authorId), {
      postsCount: increment(1),
    });
    return { data: postRef.id, error: null };
  } catch (error) {
    console.error('[firestoreService] createPost error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Toggle like pada sebuah post.
 * Gunakan document ID gabungan userId_postId untuk cek duplicate.
 * @param {string} userId
 * @param {string} postId
 * @param {boolean} isLiked - status like saat ini (sebelum toggle)
 * @returns {Promise<{ error: string|null }>}
 */
export async function toggleLike(userId, postId, isLiked) {
  try {
    const likeId = `${userId}_${postId}`;
    const likeRef = doc(db, 'likes', likeId);
    const postRef = doc(db, 'posts', postId);
    const batch = writeBatch(db);

    if (isLiked) {
      batch.delete(likeRef);
      batch.update(postRef, { likesCount: increment(-1) });
    } else {
      batch.set(likeRef, {
        userId,
        postId,
        createdAt: serverTimestamp(),
      });
      batch.update(postRef, { likesCount: increment(1) });
    }

    await batch.commit();

    // Kirim notifikasi saat like (bukan unlike)
    if (!isLiked) {
      const postSnap = await getDoc(doc(db, 'posts', postId));
      if (postSnap.exists()) {
        const postData = postSnap.data();
        if (postData.authorId && postData.authorId !== userId) {
          createNotification({
            type: 'like',
            recipientId: postData.authorId,
            actorId: userId,
            postId,
          }).catch((e) => console.error('[firestoreService] like notif error:', e));
        }
      }
    }

    return { error: null };
  } catch (error) {
    console.error('[firestoreService] toggleLike error:', error.code, error.message);
    return { error: error.message };
  }
}

/**
 * Cek apakah user menyukai sebuah post.
 * @param {string} userId
 * @param {string} postId
 * @returns {Promise<{ isLiked: boolean, error: string|null }>}
 */
export async function checkIsLiked(userId, postId) {
  try {
    const likeId = `${userId}_${postId}`;
    const snap = await getDoc(doc(db, 'likes', likeId));
    return { isLiked: snap.exists(), error: null };
  } catch (error) {
    return { isLiked: false, error: error.message };
  }
}

/**
 * Menambahkan komentar ke post.
 * @param {string} postId
 * @param {string} authorId
 * @param {string} text
 * @returns {Promise<{ data: string|null, error: string|null }>}
 */
export async function addComment(postId, authorId, text) {
  try {
    const batch = writeBatch(db);
    const commentRef = doc(collection(db, 'posts', postId, 'comments'));
    batch.set(commentRef, { authorId, text, createdAt: serverTimestamp() });
    batch.update(doc(db, 'posts', postId), { commentsCount: increment(1) });
    await batch.commit();

    // Kirim notifikasi komentar
    const postSnap = await getDoc(doc(db, 'posts', postId));
    if (postSnap.exists()) {
      const postData = postSnap.data();
      if (postData.authorId && postData.authorId !== authorId) {
        createNotification({
          type: 'comment',
          recipientId: postData.authorId,
          actorId: authorId,
          postId,
        }).catch((e) => console.error('[firestoreService] comment notif error:', e));
      }
    }

    return { data: commentRef.id, error: null };
  } catch (error) {
    console.error('[firestoreService] addComment error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Subscribe real-time ke data sebuah post (likesCount, commentsCount, dll).
 * @param {string} postId
 * @param {Function} callback - dipanggil dengan data post terbaru
 * @returns {Function} unsubscribe
 */
export function subscribeToPost(postId, callback) {
  return onSnapshot(doc(db, 'posts', postId), (snapshot) => {
    if (snapshot.exists()) {
      callback({ id: snapshot.id, ...snapshot.data() });
    }
  });
}

/**
 * Subscribe secara realtime ke komentar sebuah post.
 * @param {string} postId
 * @param {function} callback
 * @returns {function} unsubscribe function
 */
export function subscribeToComments(postId, callback) {
  const q = query(
    collection(db, 'posts', postId, 'comments'),
    orderBy('createdAt', 'asc')
  );
  return onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(data);
  });
}

/**
 * Mengambil data user dari Firestore.
 * @param {string} uid
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getUserById(uid) {
  try {
    const userSnap = await getDoc(doc(db, 'users', uid));
    if (!userSnap.exists()) return { data: null, error: null };
    return { data: { id: userSnap.id, ...userSnap.data() }, error: null };
  } catch (error) {
    console.error('[firestoreService] getUserById error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mengambil detail post dari Firestore.
 * @param {string} postId
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getPostById(postId) {
  try {
    const postSnap = await getDoc(doc(db, 'posts', postId));
    if (!postSnap.exists()) return { data: null, error: null };
    return { data: { id: postSnap.id, ...postSnap.data() }, error: null };
  } catch (error) {
    console.error('[firestoreService] getPostById error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mengambil semua post milik seorang user (untuk grid profil).
 * @param {string} authorId
 * @returns {Promise<{ data: Object[], error: string|null }>}
 */
export async function getPostsByAuthor(authorId) {
  try {
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', authorId),
      orderBy('createdAt', 'desc')
    );
    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    return { data: posts, error: null };
  } catch (error) {
    console.error('[firestoreService] getPostsByAuthor error:', error.code, error.message);
    return { data: [], error: error.message };
  }
}

/**
 * Mengambil daftar UID user yang di-follow.
 * @param {string} userId
 * @returns {Promise<{ data: string[], error: string|null }>}
 */
export async function getFollowingIds(userId) {
  try {
    const q = query(
      collection(db, 'follows'),
      where('followerId', '==', userId)
    );
    const snapshot = await getDocs(q);
    const ids = snapshot.docs.map((d) => d.data().followingId);
    return { data: ids, error: null };
  } catch (error) {
    console.error('[firestoreService] getFollowingIds error:', error.code, error.message);
    return { data: [], error: error.message };
  }
}

/**
 * Mencari post berdasarkan caption.
 * @param {string} queryText
 * @returns {Promise<{ data: Object[], error: string|null }>}
 */
export async function searchPosts(queryText) {
  if (!queryText || queryText.trim().length === 0) return { data: [], error: null };
  try {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(100)
    );
    const snapshot = await getDocs(q);
    let posts = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
    
    // Client-side filtering untuk caption
    const lowercaseQuery = queryText.toLowerCase();
    posts = posts.filter(p => p.caption && p.caption.toLowerCase().includes(lowercaseQuery));
    
    return { data: posts, error: null };
  } catch (error) {
    console.error('[firestoreService] searchPosts error:', error.code, error.message);
    return { data: [], error: error.message };
  }
}
