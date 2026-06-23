import React, { useState, useEffect } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn } from 'react-native-reanimated';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function EmojiReactionPicker({ visible, onClose, onSelect }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);

  const [shouldRender, setShouldRender] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  useEffect(() => {
    if (visible) {
      setIsModalVisible(true);
      setShouldRender(true);
    } else {
      setShouldRender(false);
      // Wait for exit animations (duration: 200ms-250ms) to complete before unmounting modal
      const timer = setTimeout(() => {
        setIsModalVisible(false);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    onClose();
  };

  const handleSelectEmoji = (emoji) => {
    onSelect(emoji);
  };

  if (!isModalVisible) return null;

  return (
    <Modal transparent visible={isModalVisible} onRequestClose={handleClose}>
      <View style={styles.container}>
        {shouldRender && (
          <>
            {/* Absolute background Pressable that handles close and fades in/out */}
            <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose}>
              <Animated.View
                entering={FadeIn.duration(200)}
                exiting={FadeOut.duration(200)}
                style={[StyleSheet.absoluteFillObject, styles.backdropBackground]}
              />
            </Pressable>

            {/* Container for sheet (positioned at the bottom) */}
            <Animated.View
              entering={SlideInDown.duration(200)}
              exiting={SlideOutDown.duration(200)}
              style={styles.sheet}
            >
              {REACTIONS.map((emoji, index) => (
                <Animated.View
                  key={emoji}
                  entering={ZoomIn.delay(index * 40).duration(150)}
                >
                  <TouchableOpacity
                    style={styles.emojiButton}
                    onPress={() => handleSelectEmoji(emoji)}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.emoji}>{emoji}</Text>
                  </TouchableOpacity>
                </Animated.View>
              ))}
            </Animated.View>
          </>
        )}
      </View>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  backdropBackground: {
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
    // Soft shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  emojiButton: {
    width: 46,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emoji: {
    fontSize: typography.sizes.xl,
  },
});
