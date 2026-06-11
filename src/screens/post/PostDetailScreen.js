import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import { colors, typography, spacing } from '../../theme';

export default function PostDetailScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Detail Post</Text>
      <Text style={styles.subtitle}>Konten post dan komentar</Text>
      
      {/* TEMPORARY: Tap untuk lihat user atau chat */}
      <View style={styles.navSection}>
        <Text style={styles.navLabel}>Sementara - Testing Navigation</Text>
        <Button title="Lihat Profil" onPress={() => navigation.navigate('UserProfile', { userId: 'author123' })} />
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
    fontSize: typography.sizes.xl,
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
