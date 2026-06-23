import { useEffect, useRef, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { updateTypingStatus } from '../services/chatService';

const TYPING_TIMEOUT_MS = 3000;
const TYPING_DEBOUNCE_MS = 300;

/**
 * Mengelola status typing user saat ini dengan debounce 300ms.
 * @param {string} conversationId - ID dokumen percakapan
 * @param {string} currentUserId - UID user yang sedang login
 * @returns {{ handleTyping: Function }}
 */
export function useTypingIndicator(conversationId, currentUserId) {
  const typingTimeoutRef = useRef(null);
  const typingDebounceRef = useRef(null);
  const isTypingRef = useRef(false);

  const handleTyping = () => {
    if (!conversationId || !currentUserId) return;

    if (!isTypingRef.current) {
      clearTimeout(typingDebounceRef.current);
      typingDebounceRef.current = setTimeout(() => {
        isTypingRef.current = true;
        updateTypingStatus(conversationId, currentUserId, true);
      }, TYPING_DEBOUNCE_MS);
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      updateTypingStatus(conversationId, currentUserId, false);
    }, TYPING_TIMEOUT_MS);
  };

  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (typingDebounceRef.current) {
        clearTimeout(typingDebounceRef.current);
      }

      if (isTypingRef.current && conversationId && currentUserId) {
        updateTypingStatus(conversationId, currentUserId, false);
      }
    };
  }, [conversationId, currentUserId]);

  return { handleTyping };
}

/**
 * Subscribe realtime ke status typing user lain dalam percakapan.
 * @param {string} conversationId - ID dokumen percakapan
 * @param {string} currentUserId - UID user yang sedang login
 * @returns {{ isOtherUserTyping: boolean }}
 */
export function useOtherTyping(conversationId, currentUserId) {
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);

  useEffect(() => {
    if (!conversationId || !currentUserId) {
      setIsOtherUserTyping(false);
      return;
    }

    const unsubscribe = onSnapshot(
      doc(db, 'conversations', conversationId),
      (snapshot) => {
        if (!snapshot.exists()) {
          setIsOtherUserTyping(false);
          return;
        }

        const data = snapshot.data();
        const typingUsers = data?.typingUsers ?? {};

        const othersTyping = Object.entries(typingUsers).some(([uid, timestamp]) => {
          if (uid === currentUserId) return false;
          if (!timestamp) return false;

          const nowMillis = Date.now();
          const timestampMillis = timestamp.toMillis ? timestamp.toMillis() : new Date(timestamp).getTime();
          return nowMillis - timestampMillis < 5000;
        });

        setIsOtherUserTyping(othersTyping);
      },
      (error) => {
        console.error('[useOtherTyping] error:', error);
      }
    );

    return () => unsubscribe();
  }, [conversationId, currentUserId]);

  return { isOtherUserTyping };
}
