import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Avatar from '../common/Avatar';
import { colors, typography, spacing } from '../../theme';

export default function StoryRing({ user, onPress }) {
  return (
    <TouchableOpacity style={styles.item} onPress={() => onPress?.(user)} activeOpacity={0.8}>
      <View style={styles.ring}>
        <Avatar uri={user.photoURL} name={user.displayName || user.username} size={54} />
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {user.displayName || user.username}
      </Text>
      <Text style={styles.status} numberOfLines={1}>
        {user.liveText}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  item: {
    width: 86,
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  ring: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xxs,
  },
  name: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.semibold,
    maxWidth: 82,
  },
  status: {
    color: colors.textSecondary,
    fontSize: 10,
    fontFamily: typography.fontFamily.regular,
    maxWidth: 82,
  },
});
