import { useState, useEffect } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { toggleLike, checkIsLiked } from '../../services/firestoreService';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';

export default function PostActions({ post }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const navigation = useNavigation();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likesCount ?? 0);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!user?.uid) return;
    checkIsLiked(user.uid, post.id).then(setIsLiked);
  }, [user?.uid, post.id]);

  useEffect(() => {
    setLikesCount(post.likesCount ?? 0);
  }, [post.likesCount]);

  async function handleLike() {
    if (!user?.uid || isToggling) return;

    const prevLiked = isLiked;
    const prevCount = likesCount;
    const newLiked = !prevLiked;
    const newCount = newLiked ? prevCount + 1 : prevCount - 1;

    setIsLiked(newLiked);
    setLikesCount(newCount);
    setIsToggling(true);

    const { error } = await toggleLike(user.uid, post.id, prevLiked);
    if (error) {
      setIsLiked(prevLiked);
      setLikesCount(prevCount);
    }
    setIsToggling(false);
  }

  function handleComment() {
    navigation.navigate('PostDetail', { postId: post.id, post });
  }

  return (
    <View style={styles.container}>
      <View style={styles.actions}>
        <Pressable onPress={handleLike} style={styles.actionButton} disabled={isToggling}>
          <Ionicons 
            name={isLiked ? "heart" : "heart-outline"} 
            size={24} 
            color={isLiked ? colors.liked : colors.textPrimary} 
          />
          <Text style={styles.actionText}>{likesCount}</Text>
        </Pressable>

        <Pressable onPress={handleComment} style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={22} color={colors.textPrimary} />
          <Text style={styles.actionText}>{post.commentsCount ?? 0}</Text>
        </Pressable>

        <Pressable style={styles.actionButton}>
          <Ionicons name="paper-plane-outline" size={22} color={colors.textPrimary} />
        </Pressable>
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  actionText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
