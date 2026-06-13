import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import { getPostsByAuthor, getUserById } from '../../services/firestoreService';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS } from '../../utils/constants';

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = Math.floor((SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(user);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    const { data: profileData } = await getUserById(user.uid);
    if (profileData) setProfile(profileData);
    const { data: postsData } = await getPostsByAuthor(user.uid);
    setPosts(postsData || []);
    setIsLoading(false);
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  function navigateToPost(post) {
    navigation.navigate('PostDetail', { postId: post.id, post });
  }

  if (!user) return <Loader />;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <Avatar
          uri={profile?.photoURL}
          name={profile?.displayName || profile?.username}
          size={88}
        />
        <Text style={styles.displayName}>{profile?.displayName || profile?.username}</Text>
        <Text style={styles.username}>@{profile?.username}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statCount}>{profile?.postsCount ?? 0}</Text>
          <Text style={styles.statLabel}>Post</Text>
        </View>
        <Pressable
          style={styles.statItem}
          onPress={() => navigation.navigate('Followers', { userId: user.uid })}
        >
          <Text style={styles.statCount}>{profile?.followersCount ?? 0}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Pressable>
        <Pressable
          style={styles.statItem}
          onPress={() => navigation.navigate('Following', { userId: user.uid })}
        >
          <Text style={styles.statCount}>{profile?.followingCount ?? 0}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </Pressable>
      </View>

      <View style={styles.actions}>
        <Button
          title="Edit Profile"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
          style={styles.actionButton}
        />
        <Button
          title={AUTH_STRINGS.logoutButton}
          variant="outline"
          onPress={signOut}
          style={styles.actionButton}
        />
      </View>

      <View style={styles.gridSection}>
        <Text style={styles.gridTitle}>Post Saya</Text>
        {isLoading ? (
          <Loader size="small" />
        ) : posts.length === 0 ? (
          <Text style={styles.emptyGrid}>Belum ada post.</Text>
        ) : (
          <View style={styles.grid}>
            {posts.map((post, index) => {
              const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
              return (
                <Pressable
                  key={post.id}
                  onPress={() => navigateToPost(post)}
                  style={[
                    styles.gridItem,
                    !isLastInRow && { marginRight: GRID_GAP },
                    index < posts.length - NUM_COLUMNS && { marginBottom: GRID_GAP },
                  ]}
                >
                  <Image
                    source={{ uri: post.imageURL }}
                    style={styles.gridImage}
                    contentFit="cover"
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  username: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    marginTop: spacing.xxs,
  },
  bio: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  statItem: {
    alignItems: 'center',
  },
  statCount: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.xxs,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
  gridSection: {
    paddingBottom: spacing.xl,
  },
  gridTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emptyGrid: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surfaceLight,
  },
});
