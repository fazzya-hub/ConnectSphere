import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
} from 'react-native-reanimated';
import { useAppTheme } from '../../theme/themeContext';
import { typography, spacing } from '../../theme';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

export default function TypingIndicator({ visible }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      const animateDot = (dot, delay) => {
        dot.value = withDelay(
          delay,
          withRepeat(
            withSequence(
              withTiming(-5, { duration: 300 }),
              withTiming(0, { duration: 300 })
            ),
            -1,
            true
          )
        );
      };
      animateDot(dot1, 0);
      animateDot(dot2, 150);
      animateDot(dot3, 300);
    } else {
      dot1.value = 0;
      dot2.value = 0;
      dot3.value = 0;
    }
  }, [visible, dot1, dot2, dot3]);

  const styleDot1 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot1.value }],
  }));

  const styleDot2 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot2.value }],
  }));

  const styleDot3 = useAnimatedStyle(() => ({
    transform: [{ translateY: dot3.value }],
  }));

  if (!visible) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, styleDot1]} />
      <Animated.View style={[styles.dot, styles.dotMiddle, { backgroundColor: colors.primary }, styleDot2]} />
      <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, styleDot3]} />
      <Text style={[styles.text, { color: colors.textSecondary }]}>mengetik...</Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
    opacity: 0.55,
  },
  dotMiddle: {
    opacity: 1,
  },
  text: {
    marginLeft: 2,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
  },
});
