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

export async function sendMessage(conversationId, payload, senderId, recipientId) {
  try {
    const encryptedText = payload.text ? encryptMessage(payload.text) : null;

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
    return { data: true, error: null };
  } catch (error) {
    console.error('[chatService] sendMessage error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

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
