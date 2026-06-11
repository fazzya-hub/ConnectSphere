import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import { colors, typography, spacing } from '../../theme';

export default function NotificationScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notifikasi</Text>
      <Text style={styles.subtitle}>Likes, comments, dan followers baru</Text>
      
      {/* TEMPORARY: Tap untuk lihat post atau profile */}
      <View style={styles.navSection}>
        <Text style={styles.navLabel}>Sementara - Testing Navigation</Text>
        <Button title="Notif dari Post" onPress={() => navigation.navigate('PostDetail', { postId: '3' })} />
        <Button title="Notif dari User" onPress={() => navigation.navigate('UserProfile', { userId: '789' })} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  navSection: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  navLabel: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
});
