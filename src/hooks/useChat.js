import { useEffect, useState, useRef } from 'react';
import { collection, query, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { decryptMessage } from '../utils/encryption';
import { getUserProfile } from '../services/chatService';

export function useChat(conversationId) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!conversationId) {
      setMessages([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'conversations', conversationId, 'messages'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const msgs = snapshot.docs.map((doc) => {
          const data = doc.data();
          let decryptedText = '';

          if (data.type === 'text' && data.text) {
            decryptedText = decryptMessage(data.text);
          } else {
            decryptedText = data.text;
          }

          return {
            id: doc.id,
            ...data,
            text: decryptedText,
          };
        });
        setMessages(msgs);
        setIsLoading(false);
      },
      (error) => {
        console.error('[useChat] subscription error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [conversationId]);

  return { messages, isLoading };
}

export function useConversations(currentUserId) {
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const profileCache = useRef({});

  useEffect(() => {
    if (!currentUserId) {
      setConversations([]);
      setIsLoading(false);
      return;
    }

    const q = query(
      collection(db, 'conversations'),
      where('participantIds', 'array-contains', currentUserId),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        try {
          const promises = snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            const conversationId = docSnap.id;
            const targetUserId = data.participantIds.find((id) => id !== currentUserId);

            let partner = null;
            if (targetUserId) {
              if (profileCache.current[targetUserId]) {
                partner = profileCache.current[targetUserId];
              } else {
                partner = await getUserProfile(targetUserId);
                if (partner) {
                  profileCache.current[targetUserId] = partner;
                }
              }
            }

            let lastMessageDecrypted = null;
            if (data.lastMessage) {
              let decryptedText = '';
              if (data.lastMessage.type === 'text' && data.lastMessage.text) {
                decryptedText = decryptMessage(data.lastMessage.text);
              } else if (data.lastMessage.type === 'image') {
                decryptedText = '[Gambar]';
              } else if (data.lastMessage.type === 'audio') {
                decryptedText = '[Pesan Suara]';
              } else {
                decryptedText = data.lastMessage.text;
              }

              lastMessageDecrypted = {
                ...data.lastMessage,
                text: decryptedText,
              };
            }

            return {
              id: conversationId,
              ...data,
              lastMessage: lastMessageDecrypted,
              partner: partner || { uid: targetUserId, displayName: 'Pengguna', username: 'user' },
            };
          });

          const resolvedConvs = await Promise.all(promises);
          setConversations(resolvedConvs);
          setIsLoading(false);
        } catch (err) {
          console.error('[useConversations] processing error:', err);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('[useConversations] subscription error:', error);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUserId]);

  return { conversations, isLoading };
}
