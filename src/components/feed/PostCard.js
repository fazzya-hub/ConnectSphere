import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useNavigation } from '@react-navigation/native';
import Avatar from '../common/Avatar';
import PostActions from './PostActions';
import { getUserById } from '../../services/firestoreService';
import { formatRelativeTime } from '../../utils/dateFormatter';
import { colors, typography, spacing } from '../../theme';

export default function PostCard({ post }) {
  const navigation = useNavigation();
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    if (!post.authorId) return;
    getUserById(post.authorId).then(({ data }) => {
      if (data) setAuthor(data);
    });
  }, [post.authorId]);

  function navigateToDetail() {
    navigation.navigate('PostDetail', { postId: post.id, post });
  }

  function navigateToProfile() {
    if (post.authorId) {
      navigation.navigate('UserProfile', { userId: post.authorId });
    }
  }

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={navigateToProfile}>
        <Avatar
          uri={author?.photoURL}
          name={author?.displayName || author?.username}
          size={40}
        />
        <View style={styles.headerInfo}>
          <Text style={styles.username}>{author?.username || 'user'}</Text>
          <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
        </View>
      </Pressable>

      <Pressable onPress={navigateToDetail}>
        <Image
          source={{ uri: post.imageURL }}
          style={styles.image}
          contentFit="cover"
          transition={200}
        />
      </Pressable>

      <PostActions post={post} />

      {post.caption ? (
        <Pressable onPress={navigateToDetail} style={styles.captionContainer}>
          <Text style={styles.caption}>
            <Text style={styles.captionUsername}>{author?.username || 'user'} </Text>
            {post.caption}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.sm,
  },
  headerInfo: {
    flex: 1,
  },
  username: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  image: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: colors.surfaceLight,
  },
  captionContainer: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  caption: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: typography.weights.semibold,
  },
});
