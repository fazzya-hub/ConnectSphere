import { useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import PostCard from '../../components/feed/PostCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useFeed } from '../../hooks/useFeed';
import { getFollowingIds } from '../../services/firestoreService';
import { colors } from '../../theme';

export default function FeedScreen() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState([]);

  const { posts, fetchPosts, isLoading, isRefreshing } = useFeed(followingIds);

  useEffect(() => {
    if (!user?.uid) return;

    getFollowingIds(user.uid).then(({ data }) => {
      const ids = data || [];
      // Selalu memanggil post milik sendiri
      const withSelf = ids.includes(user.uid) ? ids : [...ids, user.uid];
      setFollowingIds(withSelf);
    });
  }, [user?.uid]);

  if (!user) return <Loader />;

  return (
    <FlatList
      style={styles.container}
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <PostCard post={item} />}
      removeClippedSubviews={true}
      maxToRenderPerBatch={5}
      windowSize={10}
      initialNumToRender={5}
      ListFooterComponent={isLoading && !isRefreshing ? <Loader size="small" /> : null}
      refreshing={isRefreshing}
      onRefresh={() => fetchPosts(true)}
      ListEmptyComponent={
        !isLoading && !isRefreshing
          ? <EmptyState message="Belum ada post" />
          : null
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
