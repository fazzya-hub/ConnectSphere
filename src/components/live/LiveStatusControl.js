import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { useNowPlaying } from '../../hooks/useNowPlaying';
import { formatLiveStatus } from '../../utils/liveStatusFormatter';
import {
  clearLiveStatus,
  setListeningStatus,
  setLiveStatusEnabled,
  setLocationStatus,
} from '../../services/liveStatusService';

export default function LiveStatusControl({ userId, liveStatus, liveStatusEnabled }) {
  const [isSaving, setIsSaving] = useState(false);
  const { getCurrentLocation, isLoading: isLocating } = useCurrentLocation();
  const { getNativeTrack, openNotificationAccessSettings } = useNowPlaying();

  const liveText = liveStatusEnabled ? formatLiveStatus(liveStatus) : null;

  async function handleToggle(nextValue) {
    setIsSaving(true);
    const { error } = await setLiveStatusEnabled(userId, nextValue);
    setIsSaving(false);

    if (error) {
      Alert.alert('Gagal', 'Live status tidak bisa diperbarui: ' + error);
    }
  }

  async function handleUseLocation() {
    setIsSaving(true);
    const { data, error } = await getCurrentLocation();
    if (error) {
      setIsSaving(false);
      Alert.alert('Lokasi Gagal', error);
      return;
    }

    const { error: saveError } = await setLocationStatus(userId, data);
    setIsSaving(false);
    if (saveError) {
      Alert.alert('Gagal', 'Lokasi tidak bisa disimpan: ' + saveError);
    }
  }

  async function handleUseNativeSong() {
    setIsSaving(true);
    const { data, error } = await getNativeTrack();

    if (data) {
      const { error: saveError } = await setListeningStatus(userId, data);
      setIsSaving(false);

      if (saveError) {
        Alert.alert('Gagal', 'Status lagu tidak bisa disimpan: ' + saveError);
      }
      return;
    }

    setIsSaving(false);

    if (error === 'Permission not granted') {
      Alert.alert(
        'Izin Akses Diperlukan',
        'ConnectSphere memerlukan akses Notification Listener untuk mendeteksi lagu yang sedang diputar di perangkat kamu (Spotify, YouTube Music, dll).',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Buka Pengaturan',
            onPress: async () => {
              await openNotificationAccessSettings();
            },
          },
        ]
      );
      return;
    }

    if (error) {
      Alert.alert('MediaSession Gagal', 'Lagu Android tidak bisa dibaca: ' + error);
      return;
    }

    Alert.alert('Tidak Ada Lagu Aktif', 'Putar lagu di Android lalu coba lagi.');
  }

  async function handleClear() {
    setIsSaving(true);
    const { error } = await clearLiveStatus(userId);
    setIsSaving(false);
    if (error) {
      Alert.alert('Gagal', 'Live status tidak bisa dihapus: ' + error);
    }
  }

  const isBusy = isSaving || isLocating;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Live Status</Text>
          <Text style={styles.subtitle}>Bagikan lokasi atau lagu Android ke followers.</Text>
        </View>
        {isBusy ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Switch
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={colors.surface}
            value={!!liveStatusEnabled}
            onValueChange={handleToggle}
          />
        )}
      </View>

      {liveText ? (
        <View style={styles.activeStatus}>
          <Ionicons
            name={liveStatus?.type === 'location' ? 'location' : 'musical-notes'}
            size={16}
            color={colors.primary}
          />
          <Text style={styles.activeText} numberOfLines={2}>
            {liveText}
          </Text>
          <TouchableOpacity onPress={handleClear} disabled={isBusy} style={styles.clearButton}>
            <Ionicons name="close" size={16} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      ) : (
        <Text style={styles.emptyText}>
          {liveStatusEnabled ? 'Pilih status yang ingin ditampilkan.' : 'Aktifkan dulu untuk mulai berbagi.'}
        </Text>
      )}

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, !liveStatusEnabled && styles.actionDisabled]}
          onPress={handleUseLocation}
          disabled={!liveStatusEnabled || isBusy}
        >
          <Ionicons name="location-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Lokasi Saya</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, !liveStatusEnabled && styles.actionDisabled]}
          onPress={handleUseNativeSong}
          disabled={!liveStatusEnabled || isBusy}
        >
          <Ionicons name="musical-notes-outline" size={18} color={colors.primary} />
          <Text style={styles.actionText}>Lagu Android</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
  activeStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.surfaceLight,
  },
  activeText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
  },
  clearButton: {
    padding: spacing.xxs,
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    marginTop: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  actionDisabled: {
    opacity: 0.45,
  },
  actionText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
