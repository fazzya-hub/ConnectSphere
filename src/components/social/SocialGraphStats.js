import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Avatar from '../common/Avatar';
import { colors, typography, spacing } from '../../theme';

/**
 * Menampilkan info mutual followers antara current user dan target.
 * Format: "Diikuti oleh X, Y, dan N lainnya"
 * @param {Object} props
 * @param {number} props.mutualCount - Jumlah mutual followers
 * @param {Object[]} props.mutualPreview - Array of user data (max 2) untuk preview
 * @param {Function} [props.onPress] - Handler saat di-tap
 */
export default function SocialGraphStats({ mutualCount, mutualPreview, onPress }) {
  if (mutualCount === 0) return null;

  const renderText = () => {
    const names = mutualPreview.map((u) => u.displayName || u.username);

    if (mutualCount === 1) {
      return `Diikuti oleh ${names[0]}`;
    }

    if (mutualCount === 2) {
      return `Diikuti oleh ${names[0]} dan ${names[1] || '1 lainnya'}`;
    }

    const othersCount = mutualCount - names.length;
    if (names.length === 2) {
      return `Diikuti oleh ${names[0]}, ${names[1]}, dan ${othersCount} lainnya`;
    }

    return `Diikuti oleh ${names[0]} dan ${mutualCount - 1} lainnya`;
  };

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.avatarsRow}>
        {mutualPreview.slice(0, 3).map((user, index) => (
          <View
            key={user.uid || user.id || index}
            style={[
              styles.avatarWrapper,
              index > 0 && { marginLeft: -10 },
              { zIndex: 3 - index },
            ]}
          >
            <Avatar
              uri={user.photoURL}
              name={user.displayName || user.username}
              size={20}
            />
          </View>
        ))}
      </View>
      <Text style={styles.text}>{renderText()}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  avatarsRow: {
    flexDirection: 'row',
    marginRight: spacing.xs,
  },
  avatarWrapper: {
    borderWidth: 2,
    borderColor: colors.background,
    borderRadius: 12,
  },
  text: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    flex: 1,
  },
});
