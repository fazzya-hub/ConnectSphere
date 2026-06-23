import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../theme';

export default function TypingIndicator({ visible }) {
  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <View style={[styles.dot, styles.dotMiddle]} />
      <View style={styles.dot} />
      <Text style={styles.text}>mengetik...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.primary,
    opacity: 0.55,
  },
  dotMiddle: {
    opacity: 1,
  },
  text: {
    marginLeft: 2,
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
  },
});
