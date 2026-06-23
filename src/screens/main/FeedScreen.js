import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import PostCard from '../../components/feed/PostCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { useAuth } from '../../hooks/useAuth';
import { useFeed } from '../../hooks/useFeed';
import { useLiveStatus } from '../../hooks/useLiveStatus';
import { getFollowingIds } from '../../services/firestoreService';
import LiveStatusRing from '../../components/live/LiveStatusRing';
import LiveStatusPickerModal from '../../components/live/LiveStatusPickerModal';
import { colors } from '../../theme';

export default function FeedScreen() {
  const { user } = useAuth();
  const [followingIds, setFollowingIds] = useState([]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

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

  // Monitor current user's profile document for live status
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setCurrentUserProfile(docSnap.data());
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  if (!user) return <Loader />;

  const currentUserLiveStatus = currentUserProfile?.liveStatusEnabled ? currentUserProfile?.liveStatus : null;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        style={styles.container}
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={
          <LiveStatusRing
            currentUser={currentUserProfile || user}
            currentUserLiveStatus={currentUserLiveStatus}
            followingWithStatus={liveStatuses}
            onPressAdd={() => setPickerVisible(true)}
          />
        }
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
      <LiveStatusPickerModal
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        currentLiveStatus={currentUserLiveStatus}
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
