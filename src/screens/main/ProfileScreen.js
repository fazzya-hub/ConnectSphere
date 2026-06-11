import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS } from '../../utils/constants';

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.username}>@{user?.username}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Button
        title={AUTH_STRINGS.logoutButton}
        onPress={signOut}
        variant="outline"
        style={styles.logoutButton}
      />
      
      {/* TEMPORARY: Tap untuk lihat followers/following */}
      <View style={styles.navSection}>
        <Text style={styles.navLabel}>Sementara - Testing Navigation</Text>
        <Button title="Lihat Followers" onPress={() => navigation.navigate('Followers', { userId: user?.uid })} />
        <Button title="Lihat Following" onPress={() => navigation.navigate('Following', { userId: user?.uid })} />
        <Button title="Follow Requests" onPress={() => navigation.navigate('FollowRequests')} />
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
  username: {
    color: colors.primary,
    fontSize: typography.sizes.lg,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  email: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  logoutButton: {
    marginTop: spacing.xl,
    width: '100%',
  },
});
