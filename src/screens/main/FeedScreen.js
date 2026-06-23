import { useCallback, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import PostCard from '../../components/feed/PostCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useFeed } from '../../hooks/useFeed';
import { useLiveStatus } from '../../hooks/useLiveStatus';
import { getFollowingIds } from '../../services/firestoreService';
import LiveStatusRing from '../../components/live/LiveStatusRing';
import { colors } from '../../theme';

export default function FeedScreen() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState([]);

  const { posts, fetchPosts, isLoading, isRefreshing } = useFeed(followingIds);
  const { statuses: liveStatuses } = useLiveStatus(followingIds.filter((id) => id !== user?.uid));

  useFocusEffect(
    useCallback(() => {
      if (!user?.uid) return;
      getFollowingIds(user.uid).then(({ data }) => {
        const ids = data || [];
        const withSelf = ids.includes(user.uid) ? ids : [...ids, user.uid];
        setFollowingIds(withSelf);
      });
    }, [user?.uid])
  );

  if (!user) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        style={styles.container}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={<LiveStatusRing statuses={liveStatuses} />}
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});
