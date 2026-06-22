import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  writeBatch,
  increment,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { encryptMessage } from '../utils/encryption';
import { createNotification } from './notificationService';

/**
 * Mengambil profil user berdasarkan UID.
 * @param {string} userId - UID user yang dicari
 * @returns {Promise<Object|null>}
 */
export async function getUserProfile(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    return { uid: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('[chatService] getUserProfile error:', error.code, error.message);
    return null;
  }
}

/**
 * Membuat konversasi baru atau mengembalikan konversasi yang sudah ada.
 * @param {string} currentUserId - UID user yang login
 * @param {string} targetUserId - UID user tujuan chat
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function createConversation(currentUserId, targetUserId) {
  try {
    if (!currentUserId || !targetUserId) {
      throw new Error('ID pengirim dan penerima harus diisi');
    }

    const conversationId = [currentUserId, targetUserId].sort().join('_');
    const convRef = doc(db, 'conversations', conversationId);
    const convSnap = await getDoc(convRef);

    if (convSnap.exists()) {
      return { data: { id: convSnap.id, ...convSnap.data() }, error: null };
    }

    const convData = {
      id: conversationId,
      participantIds: [currentUserId, targetUserId],
      unreadCount: {
        [currentUserId]: 0,
        [targetUserId]: 0,
      },
      typingUsers: {
        [currentUserId]: null,
        [targetUserId]: null,
      },
      lastMessage: null,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(convRef, convData);
    return { data: convData, error: null };
  } catch (error) {
    console.error('[chatService] createConversation error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mengambil dokumen konversasi berdasarkan ID.
 * @param {string} conversationId - ID konversasi
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function getConversationById(conversationId) {
  try {
    if (!conversationId) {
      throw new Error('ID percakapan harus diisi');
    }

    const convSnap = await getDoc(doc(db, 'conversations', conversationId));
    if (!convSnap.exists()) {
      return { data: null, error: 'Percakapan tidak ditemukan' };
    }

    return { data: { id: convSnap.id, ...convSnap.data() }, error: null };
  } catch (error) {
    console.error('[chatService] getConversationById error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mengirim pesan ke konversasi.
 * Teks pesan dienkripsi sebelum ditulis ke Firestore.
 * @param {string} conversationId - ID konversasi
 * @param {{ text?: string, imageUrl?: string, audioUrl?: string, type: string, replyTo?: Object }} payload
 * @param {string} senderId - UID pengirim
 * @param {string} recipientId - UID penerima
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function sendMessage(conversationId, payload, senderId, recipientId) {
  try {
    if (!conversationId || !senderId || !recipientId) {
      throw new Error('Data percakapan, pengirim, atau penerima tidak lengkap');
    }

    if (!payload?.type) {
      throw new Error('Tipe pesan harus diisi');
    }

    const encryptedText = payload.type === 'text' && payload.text
      ? await encryptMessage(payload.text)
      : null;

    const messageData = {
      senderId,
      recipientId,
      type: payload.type,
      text: encryptedText,
      imageUrl: payload.imageUrl ?? null,
      audioUrl: payload.audioUrl ?? null,
      replyTo: payload.replyTo ?? null,
      reactions: {},
      status: 'sent',
      createdAt: serverTimestamp(),
    };

    const batch = writeBatch(db);

    const msgRef = doc(collection(db, 'conversations', conversationId, 'messages'));
    batch.set(msgRef, messageData);

    const convRef = doc(db, 'conversations', conversationId);
    batch.update(convRef, {
      participantIds: arrayUnion(senderId, recipientId),
      lastMessage: {
        text: encryptedText,
        senderId,
        createdAt: serverTimestamp(),
        type: payload.type,
      },
      updatedAt: serverTimestamp(),
      [`unreadCount.${recipientId}`]: increment(1),
    });

    await batch.commit();

    createNotification({
      type: 'dm',
      recipientId,
      actorId: senderId,
      conversationId,
    }).catch((e) => console.error('[chatService] dm notif error:', e));

    return { data: true, error: null };
  } catch (error) {
    console.error('[chatService] sendMessage error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menandai semua pesan masuk sebagai sudah dibaca.
 * @param {string} conversationId - ID konversasi
 * @param {string} userId - UID user yang membaca pesan
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function markMessagesAsRead(conversationId, userId) {
  try {
    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      where('recipientId', '==', userId),
      where('status', '==', 'sent')
    );
    const snapshot = await getDocs(q);

    const batch = writeBatch(db);
    let hasUpdates = false;

    snapshot.docs.forEach((doc) => {
      batch.update(doc.ref, { status: 'read' });
      hasUpdates = true;
    });

    const convRef = doc(db, 'conversations', conversationId);
    batch.update(convRef, {
      [`unreadCount.${userId}`]: 0,
    });
    hasUpdates = true;

    if (hasUpdates) {
      await batch.commit();
    }

    return { data: true, error: null };
  } catch (error) {
    console.error('[chatService] markMessagesAsRead error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Mengupdate status typing user pada dokumen konversasi.
 * @param {string} conversationId - ID konversasi
 * @param {string} userId - UID user yang sedang mengetik
 * @param {boolean} isTyping - Status mengetik
 * @returns {Promise<void>}
 */
export async function updateTypingStatus(conversationId, userId, isTyping) {
  try {
    const convRef = doc(db, 'conversations', conversationId);
    await updateDoc(convRef, {
      [`typingUsers.${userId}`]: isTyping ? serverTimestamp() : null,
    });
  } catch (error) {
    console.error('[chatService] updateTypingStatus error:', error.code, error.message);
  }
}

/**
 * Menambahkan emoji reaction ke pesan tertentu.
 * @param {string} conversationId - ID konversasi
 * @param {string} messageId - ID pesan
 * @param {string} userId - UID user yang memberi reaction
 * @param {string} emoji - Emoji reaction
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function addReaction(conversationId, messageId, userId, emoji) {
  try {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: arrayUnion(userId),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[chatService] addReaction error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menghapus emoji reaction dari pesan tertentu.
 * @param {string} conversationId - ID konversasi
 * @param {string} messageId - ID pesan
 * @param {string} userId - UID user yang menghapus reaction
 * @param {string} emoji - Emoji reaction
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function removeReaction(conversationId, messageId, userId, emoji) {
  try {
    const msgRef = doc(db, 'conversations', conversationId, 'messages', messageId);
    await updateDoc(msgRef, {
      [`reactions.${emoji}`]: arrayRemove(userId),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[chatService] removeReaction error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}
