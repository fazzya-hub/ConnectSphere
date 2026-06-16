import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import { colors, typography, spacing } from '../../theme';

export default function FollowersScreen() {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Followers</Text>
        <Text style={styles.subtitle}>Daftar pengikut akan ditampilkan di sini</Text>
        
        {/* TEMPORARY: Tap untuk lihat profil follower */}
        <View style={styles.navSection}>
          <Text style={styles.navLabel}>Sementara - Testing Navigation</Text>
          <Button title="Lihat Profil" onPress={() => navigation.navigate('UserProfile', { userId: 'follower1' })} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.lg },
  title: { color: colors.textPrimary, fontSize: typography.sizes.xl, fontWeight: typography.weights.bold, textAlign: 'center' },
  subtitle: { color: colors.textSecondary, fontSize: typography.sizes.md, marginTop: spacing.xs, textAlign: 'center' },
  navSection: { marginTop: spacing.xl, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border },
  navLabel: { color: colors.primary, fontSize: typography.sizes.sm, fontWeight: typography.weights.bold, marginBottom: spacing.md, textAlign: 'center' },
});
