import { useState, useCallback, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import Avatar from '../../components/common/Avatar';
import Button from '../../components/common/Button';
import Loader from '../../components/common/Loader';
import LiveStatusControl from '../../components/live/LiveStatusControl';
import { useAuth } from '../../hooks/useAuth';
import { getPostsByAuthor, getUserById } from '../../services/firestoreService';
import { uploadProfilePhoto } from '../../services/storageService';
import { syncFollowCounts } from '../../services/socialService';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS } from '../../utils/constants';

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = Math.floor((SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

export default function ProfileScreen() {
  const { user, signOut, updateProfile } = useAuth();
  const navigation = useNavigation();
  const [profile, setProfile] = useState(user);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const loadProfile = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);

    await syncFollowCounts(user.uid);

    const { data: postsData } = await getPostsByAuthor(user.uid);
    setPosts(postsData || []);
    setIsLoading(false);
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [loadProfile])
  );

  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (docSnap.exists()) {
        setProfile({ id: docSnap.id, ...docSnap.data() });
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  function navigateToPost(post) {
    navigation.navigate('PostDetail', { postId: post.id, post });
  }

  async function handleChangeAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk mengganti foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets?.[0]) return;

    setIsUploadingAvatar(true);
    try {
      const { data: downloadURL, error: uploadError } = await uploadProfilePhoto(user.uid, result.assets[0].uri);
      if (uploadError) {
        Alert.alert('Gagal', 'Gagal mengupload foto. Coba lagi.');
        return;
      }

      const { error: updateError } = await updateProfile({ photoURL: downloadURL });
      if (updateError) {
        Alert.alert('Gagal', 'Gagal memperbarui profil. Coba lagi.');
        return;
      }

      setProfile(prev => ({ ...prev, photoURL: downloadURL }));
    } catch (err) {
      Alert.alert('Gagal', 'Terjadi kesalahan saat mengganti foto profil.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  if (!user) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.container}>
        <View style={styles.profileHeader}>
        {}
        <Pressable style={styles.avatarWrapper} onPress={handleChangeAvatar} disabled={isUploadingAvatar}>
          <Avatar
            uri={profile?.photoURL}
            name={profile?.displayName || profile?.username}
            size={88}
          />
          {}
          <View style={styles.avatarEditBadge}>
            {isUploadingAvatar ? (
              <ActivityIndicator size={12} color={colors.textInverse} />
            ) : (
              <Ionicons name="camera" size={14} color={colors.textInverse} />
            )}
          </View>
        </Pressable>
        <Text style={styles.displayName}>{profile?.displayName || profile?.username}</Text>
        <Text style={styles.username}>@{profile?.username}</Text>
        {profile?.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        </View>

        <LiveStatusControl
          userId={user.uid}
          liveStatus={profile?.liveStatus}
          liveStatusEnabled={profile?.liveStatusEnabled}
        />

        <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statCount}>{Math.max(0, profile?.postsCount ?? 0)}</Text>
          <Text style={styles.statLabel}>Post</Text>
        </View>
        <Pressable
          style={styles.statItem}
          onPress={() => navigation.navigate('Followers', { userId: user.uid })}
        >
          <Text style={styles.statCount}>{Math.max(0, profile?.followersCount ?? 0)}</Text>
          <Text style={styles.statLabel}>Followers</Text>
        </Pressable>
        <Pressable
          style={styles.statItem}
          onPress={() => navigation.navigate('Following', { userId: user.uid })}
        >
          <Text style={styles.statCount}>{Math.max(0, profile?.followingCount ?? 0)}</Text>
          <Text style={styles.statLabel}>Following</Text>
        </Pressable>
        </View>

        <View style={styles.actions}>
        <Button
          title="Edit Profil"
          variant="outline"
          onPress={() => navigation.navigate('Settings')}
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
    </SafeAreaView>
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
  avatarWrapper: {
    position: 'relative',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
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
