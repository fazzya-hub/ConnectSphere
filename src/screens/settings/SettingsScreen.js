import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';
import Loader from '../../components/common/Loader';
import useThemeStore from '../../store/themeStore';

export default function SettingsScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { user, signOut } = useAuth();
  const navigation = useNavigation();
  const [isPrivate, setIsPrivate] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const themeMode = useThemeStore((state) => state.mode);
  const toggleThemeMode = useThemeStore((state) => state.toggleMode);

  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setIsPrivate(data.isPrivate || false);
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const togglePrivacy = async () => {
    const newValue = !isPrivate;
    setIsPrivate(newValue);

    try {
      await updateDoc(doc(db, 'users', user.uid), { isPrivate: newValue });
    } catch (error) {
      setIsPrivate(!newValue);
      Alert.alert('Error', 'Gagal memperbarui pengaturan privasi.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Apakah Anda yakin ingin keluar?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            const { error } = await signOut();
            if (error) {
              Alert.alert('Error', error.message || 'Gagal logout');
            }
          }
        }
      ]
    );
  };

  if (isLoading) return <Loader />;

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <ScrollView style={styles.container}>
        
        <View style={styles.content}>
        <Text style={styles.sectionTitle}>Akun</Text>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Akun Privat</Text>
            <Text style={styles.settingDescription}>
              Jika aktif, hanya orang yang Anda setujui yang dapat mengikuti dan melihat kiriman Anda.
            </Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={togglePrivacy}
            value={isPrivate}
          />
        </View>

        <View style={styles.settingItem}>
          <View>
            <Text style={styles.settingLabel}>Mode Terang</Text>
            <Text style={styles.settingDescription}>
              Simpan preferensi tampilan terang atau gelap di perangkat ini.
            </Text>
          </View>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={toggleThemeMode}
            value={themeMode === 'light'}
          />
        </View>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => navigation.navigate('NotificationPreferences')}
        >
          <Text style={styles.settingLabel}>Notifikasi & Privasi</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
        </TouchableOpacity>

        {isPrivate && (
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('FollowRequests')}
          >
            <Text style={styles.settingLabel}>Permintaan Mengikuti</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
          </TouchableOpacity>
        )}

        <View style={styles.divider} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  placeholder: { width: 32 },
  content: {
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  settingDescription: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 4,
    maxWidth: 250,
  },
  navItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.lg,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  logoutText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});
