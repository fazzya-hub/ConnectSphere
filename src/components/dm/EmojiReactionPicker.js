import React from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';

const REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export default function EmojiReactionPicker({ visible, onClose, onSelect }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          {REACTIONS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              style={styles.emojiButton}
              onPress={() => onSelect(emoji)}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const getStyles = (colors) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'flex-end',
    padding: spacing.md,
  },
  sheet: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sm,
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
