import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Dimensions, Alert, TouchableOpacity, ActionSheetIOS, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useNavigation, useRoute } from '@react-navigation/native';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';

import Avatar from '../../components/common/Avatar';
import Loader from '../../components/common/Loader';
import FollowButton from '../../components/social/FollowButton';
import SocialGraphStats from '../../components/social/SocialGraphStats';
import { getUserById, getPostsByAuthor } from '../../services/firestoreService';
import {
  addToCloseFriends,
  blockUser,
  checkBlockStatus,
  checkHasBlocked,
  removeFromCloseFriends,
  muteUser,
  syncFollowCounts,
  unblockUser,
  unmuteUser
} from '../../services/socialService';
import { useMutualFollowers } from '../../hooks/useSocialGraph';
import { formatLiveStatus } from '../../utils/liveStatusFormatter';
import useAuthStore from '../../store/authStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

const GRID_GAP = 2;
const NUM_COLUMNS = 3;
const SCREEN_WIDTH = Dimensions.get('window').width;
const GRID_ITEM_SIZE = Math.floor((SCREEN_WIDTH - GRID_GAP * (NUM_COLUMNS - 1)) / NUM_COLUMNS);

export default function UserProfileScreen() {
  const { user: currentUser } = useAuthStore();
  const navigation = useNavigation();
  const route = useRoute();
  const { userId } = route.params || {};

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCloseFriend, setIsCloseFriend] = useState(false);

  const { mutualCount, mutualPreview } = useMutualFollowers(currentUser?.uid, userId);
  const isSelf = currentUser?.uid === userId;

  const loadData = useCallback(async () => {
    if (!userId || !currentUser?.uid) return;
    setIsLoading(true);
    try {

      const isBlockedByTarget = await checkBlockStatus(currentUser.uid, userId);
      if (isBlockedByTarget) {
        setProfile({ isBlocked: true, username: 'Pengguna', displayName: 'Pengguna', photoURL: null, bio: '' });
        setPosts([]);
        setIsBlocked(false);
        setIsMuted(false);
        setIsLoading(false);
        return;
      }

      await syncFollowCounts(userId);

      const { data: postsData } = await getPostsByAuthor(userId);
      setPosts(postsData || []);

      if (!isSelf) {
        const [blockedByMe, muteSnap] = await Promise.all([
          checkHasBlocked(currentUser.uid, userId),
          getDoc(doc(db, 'mutes', `${currentUser.uid}_${userId}`)).catch(() => ({ exists: () => false })),
        ]);
        setIsBlocked(blockedByMe);
        setIsMuted(muteSnap.exists());
      }
    } catch (error) {
      console.error('[UserProfileScreen] loadData error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, currentUser?.uid, isSelf]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!userId || !currentUser?.uid) return;

    let unsubProfile = () => {};

    async function initListener() {
      const isBlockedByTarget = await checkBlockStatus(currentUser.uid, userId);
      if (isBlockedByTarget) {
        setProfile({ isBlocked: true, username: 'Pengguna', displayName: 'Pengguna', photoURL: null, bio: '' });
        return;
      }

      unsubProfile = onSnapshot(doc(db, 'users', userId), (docSnap) => {
        if (docSnap.exists()) {
          setProfile({ id: docSnap.id, ...docSnap.data() });
        }
      });
    }

    initListener();
    return () => unsubProfile();
  }, [userId, currentUser?.uid]);

  useEffect(() => {
    if (!currentUser?.uid || isSelf) return;

    const unsubscribe = onSnapshot(doc(db, 'users', currentUser.uid), (docSnap) => {
      const closeFriends = docSnap.data()?.closeFriends || [];
      setIsCloseFriend(closeFriends.includes(userId));
    });

    return () => unsubscribe();
  }, [currentUser?.uid, userId, isSelf]);

  async function handleBlock() {
    Alert.alert(
      isBlocked ? 'Batalkan Blokir?' : 'Blokir Pengguna?',
      isBlocked
        ? `Batalkan blokir @${profile?.username}?`
        : `@${profile?.username} tidak akan bisa melihat profilmu atau mengirim pesan.`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: isBlocked ? 'Batalkan Blokir' : 'Blokir',
          style: isBlocked ? 'default' : 'destructive',
          onPress: async () => {
            if (isBlocked) {
              await unblockUser(currentUser.uid, userId);
              setIsBlocked(false);
            } else {
              await blockUser(currentUser.uid, userId);
              setIsBlocked(true);
            }
          },
        },
      ]
    );
  }

  async function handleMute() {
    if (isMuted) {
      await unmuteUser(currentUser.uid, userId);
      setIsMuted(false);
      Alert.alert('Unmute', `@${profile?.username} tidak lagi dibisukan.`);
    } else {
      await muteUser(currentUser.uid, userId);
      setIsMuted(true);
      Alert.alert('Mute', `Postingan @${profile?.username} tidak akan muncul di feed.`);
    }
  }

  async function handleCloseFriendToggle() {
    try {
      if (isCloseFriend) {
        await removeFromCloseFriends(currentUser.uid, userId);
      } else {
        await addToCloseFriends(currentUser.uid, userId);
      }
      setIsCloseFriend(!isCloseFriend);
    } catch (error) {
      Alert.alert('Error', 'Gagal memperbarui Close Friends.');
    }
  }

  function showMoreOptions() {
    const options = [
      isMuted ? 'Unmute Pengguna' : 'Mute Pengguna',
      isBlocked ? 'Batalkan Blokir' : 'Blokir Pengguna',
      'Batal',
    ];
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, destructiveButtonIndex: 1, cancelButtonIndex: 2 },
        (index) => {
          if (index === 0) handleMute();
          if (index === 1) handleBlock();
        }
      );
    } else {
      Alert.alert('Opsi', '', [
        { text: isMuted ? 'Unmute' : 'Mute', onPress: handleMute },
        { text: isBlocked ? 'Batalkan Blokir' : 'Blokir', style: 'destructive', onPress: handleBlock },
        { text: 'Batal', style: 'cancel' },
      ]);
    }
  }

  if (isLoading) return <Loader />;

  if (!profile) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Pengguna tidak ditemukan.</Text>
      </View>
    );
  }

  const liveText = profile.liveStatusEnabled ? formatLiveStatus(profile.liveStatus) : null;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {}
      <View style={styles.navBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navBtn}>
          <Ionicons name="arrow-back" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>@{profile.username}</Text>
        {!isSelf && !profile?.isBlocked && (
          <TouchableOpacity onPress={showMoreOptions} style={styles.navBtn}>
            <Ionicons name="ellipsis-horizontal" size={22} color={colors.textPrimary} />
          </TouchableOpacity>
        )}
        {isSelf && <View style={styles.navBtn} />}
      </View>

      {}
      {isBlocked && (
        <View style={styles.statusBanner}>
          <Ionicons name="ban" size={16} color={colors.error} />
          <Text style={styles.statusBannerText}>Kamu memblokir pengguna ini</Text>
          <TouchableOpacity onPress={handleBlock}>
            <Text style={styles.statusBannerAction}>Batalkan</Text>
          </TouchableOpacity>
        </View>
      )}
      {!isBlocked && isMuted && (
        <View style={[styles.statusBanner, styles.statusMuted]}>
          <Ionicons name="volume-mute" size={16} color={colors.textSecondary} />
          <Text style={styles.statusBannerText}>Pengguna ini dibisukan</Text>
          <TouchableOpacity onPress={handleMute}>
            <Text style={styles.statusBannerAction}>Aktifkan</Text>
          </TouchableOpacity>
        </View>
      )}

      {}
      <View style={styles.profileHeader}>
        <Avatar uri={profile.photoURL} name={profile.displayName || profile.username} size={88} />
        <Text style={styles.displayName}>{profile.displayName || profile.username}</Text>
        <Text style={styles.username}>@{profile.username}</Text>
        {profile.bio ? <Text style={styles.bio}>{profile.bio}</Text> : null}
        {}
        {liveText && (
          <Text style={styles.liveStatus}>{liveText}</Text>
        )}
      </View>

      {profile.isBlocked ? (
        <View>
          <Text style={styles.emptyGrid}>Pengguna tidak tersedia.</Text>
        </View>
      ) : (
        <>
          {}
          {!isSelf && mutualCount > 0 && (
            <SocialGraphStats mutualCount={mutualCount} mutualPreview={mutualPreview} />
          )}

          {}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statCount}>{Math.max(0, profile.postsCount ?? 0)}</Text>
              <Text style={styles.statLabel}>Post</Text>
            </View>
            <Pressable
              style={styles.statItem}
              onPress={() => navigation.navigate('Followers', { userId: profile.id })}
            >
              <Text style={styles.statCount}>{Math.max(0, profile.followersCount ?? 0)}</Text>
              <Text style={styles.statLabel}>Followers</Text>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => navigation.navigate('Following', { userId: profile.id })}
            >
              <Text style={styles.statCount}>{Math.max(0, profile.followingCount ?? 0)}</Text>
              <Text style={styles.statLabel}>Following</Text>
            </Pressable>
          </View>

          {}
          {!isSelf && !isBlocked && (
            <View style={styles.actions}>
              <FollowButton
                targetUserId={userId}
                isTargetPrivate={profile.isPrivate}
                style={styles.actionBtn}
              />
              <TouchableOpacity
                style={[styles.actionBtn, styles.msgBtn]}
                onPress={() => navigation.navigate('Chat', { userId })}
              >
                <Text style={styles.msgBtnText}>Pesan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.closeFriendBtn, isCloseFriend && styles.closeFriendActive]}
                onPress={handleCloseFriendToggle}
              >
                <Ionicons
                  name={isCloseFriend ? 'star' : 'star-outline'}
                  size={16}
                  color={isCloseFriend ? colors.textInverse : colors.primary}
                />
                <Text style={[styles.closeFriendText, isCloseFriend && styles.closeFriendTextActive]}>
                  Close
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {}
          <View style={styles.gridSection}>
            <Text style={styles.gridTitle}>Postingan</Text>
            {posts.length === 0 ? (
              <Text style={styles.emptyGrid}>Belum ada postingan.</Text>
            ) : (
              <View style={styles.grid}>
                {posts.map((post, index) => {
                  const isLastInRow = (index + 1) % NUM_COLUMNS === 0;
                  return (
                    <Pressable
                      key={post.id}
                      onPress={() => navigation.navigate('PostDetail', { postId: post.id, post })}
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
        </>
      )}
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  emptyText: { color: colors.textSecondary, fontSize: typography.sizes.md },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  navBtn: { width: 40, alignItems: 'center' },
  navTitle: { color: colors.textPrimary, fontSize: typography.sizes.md, fontWeight: typography.weights.semibold },

  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#3a1a1a',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusMuted: { backgroundColor: colors.surface },
  statusBannerText: { flex: 1, color: colors.textSecondary, fontSize: typography.sizes.sm },
  statusBannerAction: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },

  profileHeader: {
    alignItems: 'center',
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginTop: spacing.md,
  },
  username: { color: colors.primary, fontSize: typography.sizes.md, marginTop: 2 },
  bio: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 20,
  },
  liveStatus: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  statItem: { alignItems: 'center' },
  statCount: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  statLabel: { color: colors.textSecondary, fontSize: typography.sizes.sm, marginTop: 2 },

  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  actionBtn: { flex: 1 },
  msgBtn: {
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgBtnText: { color: colors.textPrimary, fontSize: typography.sizes.sm, fontWeight: typography.weights.semibold },
  closeFriendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceLight,
    borderRadius: 8,
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  closeFriendActive: {
    backgroundColor: colors.primary,
  },
  closeFriendText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  closeFriendTextActive: {
    color: colors.textInverse,
  },

  gridSection: { paddingBottom: spacing.xl },
  gridTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  emptyGrid: {
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
    fontSize: typography.sizes.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridItem: { width: GRID_ITEM_SIZE, height: GRID_ITEM_SIZE },
  gridImage: { width: '100%', height: '100%', backgroundColor: colors.surfaceLight },
});
