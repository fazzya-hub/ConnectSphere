import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { updateNotificationPreferences } from '../../services/notificationService';
import { useAppTheme } from '../../theme/themeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../config/firebase';
import Loader from '../../components/common/Loader';

export default function NotificationPreferenceScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const navigation = useNavigation();
  const [prefs, setPrefs] = useState({
    likes: true,
    comments: true,
    newFollower: true,
    dm: true,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) return;
    
    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        if (data.notificationPrefs) {
          setPrefs({
            likes: data.notificationPrefs.likes ?? true,
            comments: data.notificationPrefs.comments ?? true,
            newFollower: data.notificationPrefs.newFollower ?? true,
            dm: data.notificationPrefs.dm ?? true,
          });
        }
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const toggleSwitch = async (key) => {
    const newValue = !prefs[key];
    setPrefs((prev) => ({ ...prev, [key]: newValue }));
    
    const { error } = await updateNotificationPreferences(user.uid, { [key]: newValue });
    if (error) {
      // Rollback if failed
      setPrefs((prev) => ({ ...prev, [key]: !newValue }));
      Alert.alert('Error', 'Gagal memperbarui preferensi notifikasi.');
    }
  };

  if (isLoading) return <Loader />;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.title}>Pengaturan</Text>
        <View style={styles.placeholder} />
      </View>

      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Notifikasi Push</Text>
        
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Suka</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={() => toggleSwitch('likes')}
            value={prefs.likes}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Komentar</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={() => toggleSwitch('comments')}
            value={prefs.comments}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Pengikut Baru</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={() => toggleSwitch('newFollower')}
            value={prefs.newFollower}
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Pesan Langsung (DM)</Text>
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            onValueChange={() => toggleSwitch('dm')}
            value={prefs.dm}
          />
        </View>

      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: spacing.xs },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  placeholder: { width: 32 },
  container: {
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
    paddingVertical: spacing.sm,
  },
  settingLabel: {
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
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
