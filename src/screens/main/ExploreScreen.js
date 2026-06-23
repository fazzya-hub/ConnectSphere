import React, { useState } from 'react';
import {
  View, Text, FlatList, StyleSheet, TextInput, TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import UserCard from '../../components/social/UserCard';
import PostCard from '../../components/feed/PostCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { usePeopleYouMayKnow, useFollowList } from '../../hooks/useSocialGraph';
import useAuthStore from '../../store/authStore';
import { searchUsers, getAllBlockedUserIds } from '../../services/socialService';
import { searchPosts } from '../../services/firestoreService';
import { useAppTheme } from '../../theme/themeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

export default function ExploreScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTab, setSearchTab] = useState('users');

  const { list: followingList } = useFollowList(user?.uid, 'following');
  const followingIds = followingList.map(u => u.uid || u.id);

  const { suggestions, isLoading: suggestionsLoading } = usePeopleYouMayKnow(user?.uid, followingIds);

  async function handleSearch(text) {
    setQuery(text);
    if (text.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    await performSearch(text, searchTab);
  }

  async function performSearch(searchText, tab) {
    if (searchText.trim().length < 2) return;
    setIsSearching(true);

    if (tab === 'users') {
      const { data } = await searchUsers(searchText.trim().toLowerCase(), user?.uid);
      setSearchResults(data || []);
    } else {
      const { data } = await searchPosts(searchText.trim());
      let fetchedPosts = data || [];
      if (user?.uid) {
        const { data: blockedIds } = await getAllBlockedUserIds(user.uid);
        fetchedPosts = fetchedPosts.filter(post => !blockedIds.has(post.authorId));
      }
      setSearchResults(fetchedPosts);
    }

    setIsSearching(false);
  }

  function handleTabChange(tab) {
    setSearchTab(tab);
    if (query.trim().length >= 2) {
      performSearch(query, tab);
    } else {
      setSearchResults([]);
    }
  }

  function goToProfile(userId) {
    navigation.navigate('UserProfile', { userId });
  }

  const isSearchMode = query.trim().length >= 2;

  return (
    <SafeAreaView style={styles.safe} edges={['left', 'right']}>
      {}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={18} color={colors.textSecondary} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari pengguna atau post..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {query.length > 0 && (
          <Ionicons
            name="close-circle"
            size={18}
            color={colors.textSecondary}
            onPress={() => { setQuery(''); setSearchResults([]); }}
          />
        )}
      </View>

      {}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, searchTab === 'users' && styles.activeTab]}
          onPress={() => handleTabChange('users')}
        >
          <Text style={[styles.tabText, searchTab === 'users' && styles.activeTabText]}>Pengguna</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, searchTab === 'posts' && styles.activeTab]}
          onPress={() => handleTabChange('posts')}
        >
          <Text style={[styles.tabText, searchTab === 'posts' && styles.activeTabText]}>Post</Text>
        </TouchableOpacity>
      </View>

      {isSearchMode ? (
        isSearching ? <Loader /> : searchResults.length === 0 ? (
          <EmptyState icon="search-outline" message="Tidak ditemukan hasil yang cocok" />
        ) : (
          <FlatList
            data={searchResults}
            keyExtractor={item => item.uid || item.id}
            renderItem={({ item }) => {
              if (searchTab === 'users') {
                return <UserCard user={item} onPress={() => goToProfile(item.uid || item.id)} />;
              } else {
                return <PostCard post={item} />;
              }
            }}
            showsVerticalScrollIndicator={false}
          />
        )
      ) : (
        searchTab === 'users' ? (
          <FlatList
            data={[]}
            keyExtractor={() => null}
            renderItem={null}
            showsVerticalScrollIndicator={false}
            ListHeaderComponent={
              <>
                <Text style={styles.sectionTitle}>People You May Know</Text>
                {suggestionsLoading ? (
                  <Loader size="small" />
                ) : suggestions.length === 0 ? (
                  <Text style={styles.emptyHint}>Follow lebih banyak orang untuk mendapatkan saran!</Text>
                ) : (
                  suggestions.map(item => (
                    <UserCard
                      key={item.uid || item.id}
                      user={item}
                      onPress={() => goToProfile(item.uid || item.id)}
                    />
                  ))
                )}
              </>
            }
            contentContainerStyle={styles.content}
          />
        ) : (
          <View style={styles.centered}>
            <Text style={styles.emptyHint}>Ketikkan sesuatu untuk mencari postingan.</Text>
          </View>
        )
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 44,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    height: '100%',
  },
  tabContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.sm,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textSecondary,
  },
  activeTabText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  emptyHint: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    textAlign: 'center',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: spacing.xl,
  },
  content: {
    paddingBottom: spacing.xl,
  },
});
