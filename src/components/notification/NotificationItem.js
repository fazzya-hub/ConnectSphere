import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography, spacing } from '../../theme';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

const ICON_MAP = {
  like: { emoji: '❤️', color: colors.liked },
  comment: { emoji: '💬', color: colors.primary },
  follow: { emoji: '➕', color: colors.success },
  follow_request: { emoji: '🔔', color: colors.warning },
  follow_accept: { emoji: '✅', color: colors.success },
  dm: { emoji: '✉️', color: colors.primary },
};

const MSG_MAP = {
  like: 'menyukai postingan Anda.',
  comment: 'mengomentari postingan Anda.',
  follow: 'mulai mengikuti Anda.',
  follow_request: 'meminta untuk mengikuti Anda.',
  follow_accept: 'menerima permintaan mengikuti Anda.',
  dm: 'mengirim pesan kepada Anda.',
};

/**
 * Komponen item notifikasi.
 * @param {Object} props
 * @param {Object} props.notif - Data notifikasi dari Firestore
 * @param {Function} props.onPress - Handler saat item ditekan
 */
export default function NotificationItem({ notif, onPress }) {
  const iconInfo = ICON_MAP[notif.type] || { emoji: '🔔', color: colors.textSecondary };
  const msg = MSG_MAP[notif.type] || 'Ada aktivitas baru.';
  const actorName = notif.actorName || 'Seseorang';
  const timeText = notif.createdAt?.toDate
    ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true, locale: id })
    : '';

  return (
    <TouchableOpacity
      style={[styles.container, !notif.isRead && styles.unread]}
      onPress={() => onPress(notif)}
      activeOpacity={0.75}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {notif.actorPhoto ? (
          <Image source={{ uri: notif.actorPhoto }} style={styles.avatar} contentFit="cover" />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarLetter}>{actorName.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={[styles.iconBadge, { backgroundColor: iconInfo.color }]}>
          <Text style={styles.iconEmoji}>{iconInfo.emoji}</Text>
        </View>
      </View>

      {/* Teks */}
      <View style={styles.content}>
        <Text style={styles.text} numberOfLines={2}>
          <Text style={styles.bold}>{actorName} </Text>
          {msg}
        </Text>
        {timeText ? <Text style={styles.time}>{timeText}</Text> : null}
      </View>

      {/* Unread dot */}
      {!notif.isRead && <View style={styles.unreadDot} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  unread: {
    backgroundColor: colors.surface,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: spacing.sm,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  avatarFallback: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  iconEmoji: {
    fontSize: 10,
  },
  content: {
    flex: 1,
  },
  text: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    lineHeight: 20,
  },
  bold: {
    fontWeight: typography.weights.bold,
  },
  time: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 3,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: spacing.sm,
  },
});
