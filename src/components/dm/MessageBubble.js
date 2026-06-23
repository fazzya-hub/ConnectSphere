import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';
import AudioNote from './AudioNote';
import ReadReceipt from './ReadReceipt';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';


const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = width * 0.75;

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function getReplyPreview(reply) {
  if (!reply) return '';
  if (reply.type === 'text') return reply.text || 'Pesan';
  if (reply.type === 'image') return 'Gambar';
  if (reply.type === 'audio') return 'Pesan Suara';
  return 'Pesan';
}

export default function MessageBubble({
  message,
  currentUserId,
  partnerUsername = '',
  onLongPress = null,
  onReply = null,
}) {
  const { colors, mode } = useAppTheme();
  const styles = useMemo(() => getStyles(colors, mode), [colors, mode]);

  const { senderId, type, text, imageUrl, audioUrl, status, createdAt, reactions, replyTo } = message;
  const isMe = senderId === currentUserId;

  const hasReactions = reactions && Object.keys(reactions).some(
    (emoji) => reactions[emoji] && reactions[emoji].length > 0
  );

  const translateX = useSharedValue(0);

  const handleReply = () => {
    if (onReply) {
      onReply(message);
    }
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      if (event.translationX > 0 && event.translationX < 80) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX > 40) {
        runOnJS(handleReply)();
      }
      translateX.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View style={[styles.container, isMe ? styles.containerRight : styles.containerLeft, animatedStyle]}>
        <TouchableOpacity
          activeOpacity={0.86}
          onLongPress={() => onLongPress?.(message)}
          onPress={() => onReply?.(message)}
        >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            type === 'image' && styles.bubbleImage,
          ]}
        >
          {replyTo && (
            <View style={[styles.replyContainer, isMe ? styles.replyContainerMe : styles.replyContainerOther]}>
              <Text
                style={[styles.replySender, isMe ? styles.replySenderMe : styles.replySenderOther]}
                numberOfLines={1}
              >
                {replyTo.senderId === currentUserId ? 'Kamu' : (partnerUsername ? `@${partnerUsername}` : 'Lawan Bicara')}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {getReplyPreview(replyTo)}
              </Text>
            </View>
          )}

          {type === 'image' && imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          )}

          {type === 'audio' && audioUrl && <AudioNote audioUrl={audioUrl} isMe={isMe} />}

          {type === 'text' && text && (
            <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
              {text}
            </Text>
          )}

          <View style={styles.footer}>
            <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
              {formatMessageTime(createdAt)}
            </Text>

            {isMe && (
              <View style={styles.statusIcon}>
                <ReadReceipt status={status} />
              </View>
            )}
          </View>
        </View>

        {hasReactions && (
          <View style={[styles.reactionsContainer, isMe ? styles.reactionsRight : styles.reactionsLeft]}>
            {Object.keys(reactions).map((emoji) => {
              const usersReacted = reactions[emoji] || [];
              if (usersReacted.length === 0) return null;
              return (
                <View key={emoji} style={styles.reactionBadge}>
                  <Text style={styles.reactionEmoji}>{emoji}</Text>
                  {usersReacted.length > 1 && (
                    <Text style={styles.reactionCount}>{usersReacted.length}</Text>
                  )}
                </View>
              );
            })}
          </View>
        )}
      </TouchableOpacity>
      </Animated.View>
    </GestureDetector>
  );
}

const getStyles = (colors, mode) => StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: spacing.xxs,
    flexDirection: 'row',
  },
  containerLeft: {
    justifyContent: 'flex-start',
  },
  containerRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: MAX_BUBBLE_WIDTH,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 1,
    elevation: 1,
  },
  bubbleLeft: {
    backgroundColor: colors.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleRight: {
    backgroundColor: colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleImage: {
    paddingHorizontal: spacing.xxs,
    paddingVertical: spacing.xxs,
  },
  text: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.regular,
    lineHeight: 20,
  },
  textMe: {
    color: colors.textInverse,
  },
  textOther: {
    color: colors.textPrimary,
  },
  image: {
    width: MAX_BUBBLE_WIDTH - spacing.xs,
    height: 180,
    borderRadius: 12,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  replyContainerMe: {
    borderLeftColor: colors.textInverse,
    backgroundColor: mode === 'light' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.12)',
  },
  replyContainerOther: {
    borderLeftColor: colors.primary,
    backgroundColor: mode === 'light' ? 'rgba(0, 0, 0, 0.05)' : 'rgba(255, 255, 255, 0.05)',
  },
  replySender: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.bold,
  },
  replySenderMe: {
    color: colors.textInverse,
  },
  replySenderOther: {
    color: colors.primary,
  },
  replyText: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: spacing.xxs,
    alignSelf: 'flex-end',
  },
  time: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
  },
  timeMe: {
    color: mode === 'light' ? 'rgba(255, 255, 255, 0.65)' : 'rgba(18, 18, 18, 0.6)',
  },
  timeOther: {
    color: colors.textSecondary,
  },
  statusIcon: {
    marginLeft: 4,
  },
  reactionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: -4,
    marginBottom: spacing.xxs,
    elevation: 2,
    zIndex: 10,
  },
  reactionsLeft: {
    alignSelf: 'flex-start',
    marginLeft: spacing.xs,
  },
  reactionsRight: {
    alignSelf: 'flex-end',
    marginRight: spacing.xs,
  },
  reactionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reactionEmoji: {
    fontSize: 12,
  },
  reactionCount: {
    fontSize: 10,
    color: colors.textPrimary,
    marginLeft: 2,
    fontFamily: typography.fontFamily.semibold,
  },
});
