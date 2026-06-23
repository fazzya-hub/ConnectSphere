import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { typography, spacing } from '../../theme';
import FollowButton from './FollowButton';
import useAuthStore from '../../store/authStore';
import { useAppTheme } from '../../theme/themeContext';

/**
 * Komponen untuk menampilkan item User di daftar (Search, Followers, dll)
 * @param {Object} props
 * @param {Object} props.user - Data user
 * @param {Function} [props.onPress] - Handler saat card ditekan
 * @param {boolean} [props.showFollowButton=true] - Tampilkan tombol follow atau tidak
 * @param {React.ReactNode} [props.rightElement] - Elemen kustom di sebelah kanan (override follow button)
 */
export default function UserCard({ user, onPress, showFollowButton = true, rightElement }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { user: currentUser } = useAuthStore();
  if (!user) return null;

  const isSelf = currentUser?.uid === (user.uid || user.id);

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={onPress ? 0.7 : 1}>
      {user.photoURL ? (
        <Image source={{ uri: user.photoURL }} style={styles.avatar} contentFit="cover" />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarLetter}>
            {(user.displayName || user.username || '?').charAt(0).toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.username} numberOfLines={1}>{user.username || 'user'}</Text>
        {user.displayName ? (
          <Text style={styles.displayName} numberOfLines={1}>{user.displayName}</Text>
        ) : null}
      </View>
      {rightElement
        ? rightElement
        : (showFollowButton && !isSelf)
          ? <FollowButton targetUserId={user.uid || user.id} isTargetPrivate={user.isPrivate} />
          : null
      }
    </TouchableOpacity>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
  },
  avatarFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  info: {
    flex: 1,
    marginLeft: spacing.sm,
    justifyContent: 'center',
  },
  username: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  displayName: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
});
