import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { useRoute } from '@react-navigation/native';
import Avatar from '../../components/common/Avatar';
import PostActions from '../../components/feed/PostActions';
import Loader from '../../components/common/Loader';
import { useAuth } from '../../hooks/useAuth';
import {
  getUserById,
  addComment,
  subscribeToComments,
  subscribeToPost,
} from '../../services/firestoreService';
import { formatRelativeTime } from '../../utils/dateFormatter';
import { colors, typography, spacing } from '../../theme';

function CommentItem({ comment }) {
  const [author, setAuthor] = useState(null);

  useEffect(() => {
    getUserById(comment.authorId).then(({ data }) => {
      if (data) setAuthor(data);
    });
  }, [comment.authorId]);

  return (
    <View style={styles.commentItem}>
      <Avatar
        uri={author?.photoURL}
        name={author?.displayName || author?.username}
        size={32}
      />
      <View style={styles.commentBody}>
        <Text style={styles.commentUsername}>{author?.username || 'user'}</Text>
        <Text style={styles.commentText}>{comment.text}</Text>
        <Text style={styles.commentTime}>{formatRelativeTime(comment.createdAt)}</Text>
      </View>
    </View>
  );
}

export default function PostDetailScreen() {
  const route = useRoute();
  const { user } = useAuth();
  const { postId, post: initialPost } = route.params;

  const [post, setPost] = useState(initialPost || null);
  const [author, setAuthor] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(!initialPost);
  const [isSending, setIsSending] = useState(false);

  // Real-time listener untuk post agar likesCount & commentsCount selalu up-to-date
  useEffect(() => {
    if (!postId) return;
    const unsubscribe = subscribeToPost(postId, (updatedPost) => {
      setPost(updatedPost);
      setIsLoading(false);
    });
    return unsubscribe;
  }, [postId]);

  useEffect(() => {
    if (!post?.authorId) return;
    getUserById(post.authorId).then(({ data }) => {
      if (data) setAuthor(data);
    });
  }, [post?.authorId]);

  useEffect(() => {
    if (!postId) return;
    const unsubscribe = subscribeToComments(postId, setComments);
    return unsubscribe;
  }, [postId]);

  async function handleSendComment() {
    if (!commentText.trim() || !user?.uid || isSending) return;

    setIsSending(true);
    const text = commentText.trim();
    setCommentText('');

    const { error } = await addComment(postId, user.uid, text);
    if (error) {
      setCommentText(text);
    }
    setIsSending(false);
  }

  if (isLoading) return <Loader />;
  if (!post) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Post tidak ditemukan.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Avatar
            uri={author?.photoURL}
            name={author?.displayName || author?.username}
            size={40}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.username}>{author?.username || 'user'}</Text>
            <Text style={styles.timestamp}>{formatRelativeTime(post.createdAt)}</Text>
          </View>
        </View>

        <Image
          source={{ uri: post.imageURL }}
          style={styles.image}
          contentFit="cover"
        />

        <PostActions post={post} />

        {post.caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.caption}>
              <Text style={styles.captionUsername}>{author?.username || 'user'} </Text>
              {post.caption}
            </Text>
          </View>
        ) : null}

        <View style={styles.commentsSection}>
          <Text style={styles.commentsTitle}>
            Komentar ({comments.length})
          </Text>
          {comments.length === 0 ? (
            <Text style={styles.noComments}>Belum ada komentar. Jadilah yang pertama!</Text>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.inputBar}>
        <TextInput
          style={styles.commentInput}
          value={commentText}
          onChangeText={setCommentText}
          placeholder="Tulis komentar..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={300}
        />
        <Pressable
          onPress={handleSendComment}
          disabled={!commentText.trim() || isSending}
          style={[styles.sendButton, !commentText.trim() && styles.sendDisabled]}
        >
          {isSending ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Text style={styles.sendText}>Kirim</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: spacing.lg,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  errorText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
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
    paddingVertical: spacing.sm,
  },
  caption: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    lineHeight: 20,
  },
  captionUsername: {
    fontWeight: typography.weights.semibold,
  },
  commentsSection: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.sm,
  },
  commentsTitle: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    marginBottom: spacing.md,
  },
  noComments: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
  commentItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  commentBody: {
    flex: 1,
  },
  commentUsername: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  commentText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    marginTop: 2,
  },
  commentTime: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: spacing.xxs,
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.sm,
  },
  commentInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    maxHeight: 80,
  },
  sendButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sendDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: colors.primary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
});
