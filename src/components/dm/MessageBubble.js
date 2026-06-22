import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

const { width } = Dimensions.get('window');
const MAX_BUBBLE_WIDTH = width * 0.75;

function formatMessageTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export default function MessageBubble({
  message,
  currentUserId,
  replyToMessage = null,
  onLongPress = null,
}) {
  const { senderId, type, text, imageUrl, audioUrl, status, createdAt, reactions } = message;
  const isMe = senderId === currentUserId;

  const hasReactions = reactions && Object.keys(reactions).some(
    (emoji) => reactions[emoji] && reactions[emoji].length > 0
  );

  return (
    <View
      style={[
        styles.container,
        isMe ? styles.containerRight : styles.containerLeft,
      ]}
    >
      <View
        onStartShouldSetResponder={() => true}
        onResponderRelease={() => {}}

      >
        <View
          style={[
            styles.bubble,
            isMe ? styles.bubbleRight : styles.bubbleLeft,
            type === 'image' && styles.bubbleImage,
          ]}
        >
          {}
          {replyToMessage && (
            <View
              style={[
                styles.replyContainer,
                isMe ? styles.replyContainerMe : styles.replyContainerOther,
              ]}
            >
              <Text
                style={[
                  styles.replySender,
                  isMe ? styles.replySenderMe : styles.replySenderOther,
                ]}
                numberOfLines={1}
              >
                {replyToMessage.senderId === currentUserId ? 'Kamu' : 'Lawan Bicara'}
              </Text>
              <Text style={styles.replyText} numberOfLines={1}>
                {replyToMessage.type === 'text'
                  ? replyToMessage.text
                  : replyToMessage.type === 'image'
                  ? '📷 Gambar'
                  : '🎵 Pesan Suara'}
              </Text>
            </View>
          )}

          {}
          {type === 'image' && imageUrl && (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              contentFit="cover"
              transition={200}
            />
          )}

          {}
          {type === 'audio' && (
            <View style={styles.audioContainer}>
              <Ionicons
                name="play-circle"
                size={32}
                color={isMe ? colors.textInverse : colors.primary}
              />
              <View style={styles.audioWaveform}>
                <View style={[styles.audioBar, { height: 12 }]} />
                <View style={[styles.audioBar, { height: 24 }]} />
                <View style={[styles.audioBar, { height: 16 }]} />
                <View style={[styles.audioBar, { height: 20 }]} />
                <View style={[styles.audioBar, { height: 10 }]} />
                <View style={[styles.audioBar, { height: 18 }]} />
              </View>
              <Text
                style={[
                  styles.audioDuration,
                  isMe ? styles.audioDurationMe : styles.audioDurationOther,
                ]}
              >
                Audio
              </Text>
            </View>
          )}

          {}
          {type === 'text' && text && (
            <Text style={[styles.text, isMe ? styles.textMe : styles.textOther]}>
              {text}
            </Text>
          )}

          {}
          <View style={styles.footer}>
            <Text style={[styles.time, isMe ? styles.timeMe : styles.timeOther]}>
              {formatMessageTime(createdAt)}
            </Text>

            {isMe && (
              <Ionicons
                name={status === 'read' ? 'checkmark-done' : 'checkmark'}
                size={16}
                color={status === 'read' ? '#00F0FF' : colors.textSecondary}
                style={styles.statusIcon}
              />
            )}
          </View>
        </View>

        {}
        {hasReactions && (
          <View
            style={[
              styles.reactionsContainer,
              isMe ? styles.reactionsRight : styles.reactionsLeft,
            ]}
          >
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    shadowRadius: 1.0,
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
  audioContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    width: 150,
  },
  audioWaveform: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginHorizontal: spacing.xs,
    flex: 1,
  },
  audioBar: {
    width: 3,
    backgroundColor: colors.textSecondary,
    borderRadius: 1.5,
  },
  audioDuration: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
  },
  audioDurationMe: {
    color: colors.textInverse,
  },
  audioDurationOther: {
    color: colors.textSecondary,
  },
  replyContainer: {
    borderLeftWidth: 3,
    paddingLeft: spacing.xs,
    marginBottom: spacing.xs,
    paddingVertical: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
  },
  replyContainerMe: {
    borderLeftColor: colors.textInverse,
  },
  replyContainerOther: {
    borderLeftColor: colors.primary,
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
    color: 'rgba(18, 18, 18, 0.6)',
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
