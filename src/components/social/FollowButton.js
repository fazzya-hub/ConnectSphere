import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { followUser, unfollowUser, cancelFollowRequest } from '../../services/socialService';
import { useFollowStatus } from '../../hooks/useSocialGraph';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import useAuthStore from '../../store/authStore';

/**
 * Tombol follow/unfollow dengan state real-time: following, pending, not_following.
 * @param {string} targetUserId - UID user yang akan di-follow
 * @param {boolean} isTargetPrivate - Apakah akun target private
 * @param {object} [style] - Custom style tambahan
 */
export default function FollowButton({ targetUserId, isTargetPrivate = false, style }) {
  const { user } = useAuthStore();
  const { status, isLoading: statusLoading } = useFollowStatus(user?.uid, targetUserId);
  const [actionLoading, setActionLoading] = useState(false);

  // Jangan tampilkan tombol untuk diri sendiri atau jika belum login
  if (!user || user.uid === targetUserId) return null;

  const isLoading = statusLoading || actionLoading;

  const handlePress = async () => {
    if (isLoading) return;
    setActionLoading(true);
    try {
      if (status === 'following') {
        await unfollowUser(user.uid, targetUserId);
      } else if (status === 'pending') {
        await cancelFollowRequest(user.uid, targetUserId);
      } else {
        await followUser(user.uid, targetUserId, isTargetPrivate);
      }
    } catch (e) {
      console.error('[FollowButton] error:', e);
    } finally {
      setActionLoading(false);
    }
  };

  const label =
    status === 'following' ? 'Mengikuti' :
    status === 'pending' ? 'Diminta' :
    'Ikuti';

  const buttonStyle =
    status === 'following' ? styles.btnFollowing :
    status === 'pending' ? styles.btnPending :
    styles.btnFollow;

  return (
    <TouchableOpacity
      style={[styles.btn, buttonStyle, style]}
      onPress={handlePress}
      disabled={isLoading}
    >
      {isLoading
        ? <ActivityIndicator size="small" color={status === 'not_following' ? colors.textInverse : colors.textPrimary} />
        : <Text style={[styles.label, status !== 'not_following' && styles.labelMuted]}>{label}</Text>
      }
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  btn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 90,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFollow: {
    backgroundColor: colors.primary,
  },
  btnFollowing: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnPending: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  label: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.sm,
    color: colors.textInverse,
  },
  labelMuted: {
    color: colors.textPrimary,
  },
});
