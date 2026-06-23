import React from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import StoryRing from '../feed/StoryRing';
import { colors, spacing } from '../../theme';

export default function LiveStatusRing({ statuses, onPress }) {
  if (!statuses || statuses.length === 0) return null;

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={statuses}
        keyExtractor={(item) => item.uid || item.id}
        renderItem={({ item }) => <StoryRing user={item} onPress={onPress} />}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
