import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import useAuthStore from '../../store/authStore';
import { useChat } from '../../hooks/useChat';
import { useTypingIndicator, useOtherTyping } from '../../hooks/useTypingIndicator';
import {
  sendMessage,
  createConversation,
  getConversationById,
  markMessagesAsRead,
  getUserProfile,
  addReaction,
  removeReaction
} from '../../services/chatService';
import { uploadChatAudio, uploadChatImage } from '../../services/storageService';
import Avatar from '../../components/common/Avatar';
import MessageBubble from '../../components/dm/MessageBubble';
import AudioNote from '../../components/dm/AudioNote';
import EmojiReactionPicker from '../../components/dm/EmojiReactionPicker';
import TypingIndicator from '../../components/dm/TypingIndicator';
import Loader from '../../components/common/Loader';
import { colors, typography, spacing } from '../../theme';

export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const currentUser = useAuthStore((state) => state.user);

  const { conversationId: initialConversationId, partner: initialPartner, userId } = route.params || {};

  const [conversationId, setConversationId] = useState(initialConversationId);
  const [partner, setPartner] = useState(initialPartner);
  const [inputText, setInputText] = useState('');
  const [isInitializing, setIsInitializing] = useState(!initialConversationId || (initialConversationId && !initialPartner));
  const [isSendingMedia, setIsSendingMedia] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);

  const { messages, isLoading: isChatLoading } = useChat(conversationId);
  const { handleTyping } = useTypingIndicator(conversationId, currentUser?.uid);
  const { isOtherUserTyping } = useOtherTyping(conversationId, currentUser?.uid);

  const flatListRef = useRef(null);
  const recipientId = partner?.uid || partner?.id || userId;

  useEffect(() => {
    async function initializeChat() {
      if (initialConversationId) {
        if (!initialPartner && currentUser?.uid) {
          const { data: conv } = await getConversationById(initialConversationId);
          const targetUserId = conv?.participantIds?.find((id) => id !== currentUser.uid);
          if (targetUserId) {
            const profile = await getUserProfile(targetUserId);
            if (profile) {
              setPartner(profile);
            }
          }
        }

        setIsInitializing(false);
        return;
      }

      if (userId) {
        setIsInitializing(true);

        const profile = await getUserProfile(userId);
        if (profile) {
          setPartner(profile);
        }

        const { data: conv, error } = await createConversation(currentUser?.uid, userId);
        if (error) {
          Alert.alert('Gagal', 'Tidak dapat memuat percakapan: ' + error);
          navigation.goBack();
          return;
        }

        if (conv) {
          setConversationId(conv.id);
        }
      } else {
        Alert.alert('Error', 'Informasi pengguna tidak lengkap');
        navigation.goBack();
      }
      setIsInitializing(false);
    }

    initializeChat();
  }, [initialConversationId, initialPartner, userId, currentUser?.uid]);

  useEffect(() => {
    if (conversationId && currentUser?.uid && messages.length > 0) {
      markMessagesAsRead(conversationId, currentUser.uid);
    }
  }, [conversationId, currentUser?.uid, messages.length]);

  const handleSendText = async () => {
    if (!inputText.trim()) return;
    if (!conversationId || !currentUser?.uid || !recipientId) {
      Alert.alert('Gagal Mengirim', 'Percakapan belum siap. Coba buka ulang chat ini.');
      return;
    }

    const textToSend = inputText.trim();
    const quote = replyTo;
    setInputText('');
    setReplyTo(null);

    const { error } = await sendMessage(
      conversationId,
      { type: 'text', text: textToSend, replyTo: quote },
      currentUser.uid,
      recipientId
    );

    if (error) {
      Alert.alert('Gagal Mengirim', 'Pesan tidak terkirim: ' + error);

      setInputText(textToSend);
      setReplyTo(quote);
    }
  };

  const handlePickAndSendImage = async () => {
    try {
      if (!conversationId || !currentUser?.uid || !recipientId) {
        Alert.alert('Gagal Mengirim', 'Percakapan belum siap. Coba buka ulang chat ini.');
        return;
      }

      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin galeri untuk mengirim gambar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      setIsSendingMedia(true);
      const localUri = result.assets[0].uri;

      const { data: imageUrl, error: uploadError } = await uploadChatImage(conversationId, localUri);
      if (uploadError) {
        throw new Error(uploadError);
      }

      const { error: sendError } = await sendMessage(
        conversationId,
        { type: 'image', imageUrl, replyTo },
        currentUser.uid,
        recipientId
      );

      if (sendError) {
        throw new Error(sendError);
      }
      setReplyTo(null);
    } catch (error) {
      Alert.alert('Gagal Mengirim Gambar', error.message);
    } finally {
      setIsSendingMedia(false);
    }
  };

  const handleSendAudio = async (localUri) => {
    try {
      if (!conversationId || !currentUser?.uid || !recipientId) {
        Alert.alert('Gagal Mengirim', 'Percakapan belum siap. Coba buka ulang chat ini.');
        return;
      }

      setIsSendingMedia(true);
      const { data: audioUrl, error: uploadError } = await uploadChatAudio(conversationId, localUri);
      if (uploadError) throw new Error(uploadError);

      const { error: sendError } = await sendMessage(
        conversationId,
        { type: 'audio', audioUrl, replyTo },
        currentUser.uid,
        recipientId
      );
      if (sendError) throw new Error(sendError);
      setReplyTo(null);
    } catch (error) {
      Alert.alert('Gagal Mengirim Audio', error.message);
    } finally {
      setIsSendingMedia(false);
    }
  };

  const handleSelectReaction = async (emoji) => {
    if (!selectedMessage || !conversationId || !currentUser?.uid) return;
    const reactedUsers = selectedMessage.reactions?.[emoji] || [];
    const serviceCall = reactedUsers.includes(currentUser.uid) ? removeReaction : addReaction;
    const { error } = await serviceCall(conversationId, selectedMessage.id, currentUser.uid, emoji);
    setSelectedMessage(null);
    if (error) {
      Alert.alert('Gagal', 'Reaction tidak dapat disimpan: ' + error);
    }
  };

  if (isInitializing) {
    return <Loader />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>

          {partner && (
            <>
              <Avatar
                uri={partner.photoURL}
                name={partner.displayName || partner.username}
                size={40}
              />
              <View style={styles.headerInfo}>
                <Text style={styles.displayName} numberOfLines={1}>
                  {partner.displayName || partner.username}
                </Text>
                <Text style={[styles.subtitleText, isOtherUserTyping && styles.typingText]}>
                  {isOtherUserTyping ? 'mengetik...' : `@${partner.username}`}
                </Text>
              </View>
            </>
          )}
        </View>

        {}
        <View style={styles.chatArea}>
          {isChatLoading ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.listLoader} />
          ) : (
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.id}
              inverted={true}
              renderItem={({ item }) => (
                <MessageBubble
                  message={item}
                  currentUserId={currentUser.uid}
                  onLongPress={setSelectedMessage}
                  onReply={setReplyTo}
                />
              )}
              contentContainerStyle={styles.messageListContainer}
            />
          )}

          <TypingIndicator visible={isOtherUserTyping} />

          {isSendingMedia && (
            <View style={styles.mediaLoadingOverlay}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.mediaLoadingText}>Mengunggah media...</Text>
            </View>
          )}
        </View>

        {}
        {replyTo && (
          <View style={styles.replyPreview}>
            <View style={styles.replyPreviewTextWrap}>
              <Text style={styles.replyPreviewLabel}>Membalas</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>
                {replyTo.type === 'text' ? replyTo.text : replyTo.type === 'image' ? 'Gambar' : 'Pesan Suara'}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setReplyTo(null)} style={styles.replyClose}>
              <Ionicons name="close" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.inputBar}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={handlePickAndSendImage}
            disabled={isSendingMedia}
          >
            <Ionicons name="image-outline" size={24} color={colors.primary} />
          </TouchableOpacity>

          <AudioNote isComposer onRecorded={handleSendAudio} />

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Ketik pesan..."
              placeholderTextColor={colors.textSecondary}
              value={inputText}
              onChangeText={(text) => {
                setInputText(text);
                handleTyping();
              }}
              multiline
              maxLength={1000}
            />
          </View>

          <TouchableOpacity
            style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
            onPress={handleSendText}
            disabled={!inputText.trim()}
          >
            <Ionicons name="send" size={20} color={colors.textInverse} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
      <EmojiReactionPicker
        visible={!!selectedMessage}
        onClose={() => setSelectedMessage(null)}
        onSelect={handleSelectReaction}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surfaceLight,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
    marginRight: spacing.xs,
  },
  headerInfo: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  displayName: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
  },
  subtitleText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  typingText: {
    color: colors.primary,
    fontFamily: typography.fontFamily.semibold,
  },
  chatArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listLoader: {
    marginTop: spacing.xl,
  },
  messageListContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconButton: {
    padding: spacing.xs,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: colors.surfaceLight,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.xs,
    maxHeight: 100,
    justifyContent: 'center',
  },
  textInput: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.regular,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 2,
  },
  sendButtonDisabled: {
    backgroundColor: colors.surfaceLight,
    opacity: 0.5,
  },
  mediaLoadingOverlay: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surfaceLight,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    gap: spacing.sm,
  },
  mediaLoadingText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
  },
  replyPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  replyPreviewTextWrap: {
    flex: 1,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
    paddingLeft: spacing.xs,
  },
  replyPreviewLabel: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.semibold,
  },
  replyPreviewText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
  },
  replyClose: {
    padding: spacing.xs,
  },
});
