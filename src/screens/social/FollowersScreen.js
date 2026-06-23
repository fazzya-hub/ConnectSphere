import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import UserCard from '../../components/social/UserCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useFollowList } from '../../hooks/useSocialGraph';
import { useAppTheme } from '../../theme/themeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/**
 * FollowersScreen — daftar followers sebuah user dengan pencarian lokal.
 */
export default function FollowersScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const route = useRoute();
  const navigation = useNavigation();
  const { userId } = route.params || {};

  const { list, isLoading, searchQuery, setSearchQuery } = useFollowList(userId, 'followers');

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Followers</Text>
      </View>

      <TextInput
        style={styles.search}
        placeholder="Cari followers..."
        placeholderTextColor={colors.textSecondary}
        value={searchQuery}
        onChangeText={setSearchQuery}
        autoCapitalize="none"
      />

      {isLoading ? (
        <Loader />
      ) : list.length === 0 ? (
        <EmptyState
          icon="people-outline"
          message={searchQuery ? 'Tidak ditemukan' : 'Belum ada followers'}
        />
      ) : (
        <FlatList
          data={list}
          keyExtractor={item => item.uid || item.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onPress={() => navigation.navigate('UserProfile', { userId: item.uid || item.id })}
            />
          )}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  search: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    margin: spacing.md,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: 10,
    fontSize: typography.sizes.md,
  },
});
