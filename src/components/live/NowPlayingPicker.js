import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNowPlaying } from '../../hooks/useNowPlaying';
import { colors, typography, spacing } from '../../theme';

/**
 * Komponen picker lagu untuk Live Status.
 * Otomatis membaca lagu yang sedang diputar di device via MediaSession.
 * @param {boolean} visible - true saat modal/picker ini sedang aktif ditampilkan
 * @param {Function} onDone - Dipanggil dengan { songTitle, artistName } saat user memilih
 * @param {Function} onBack - Dipanggil saat user ingin kembali
 */
export default function NowPlayingPicker({ visible = true, onDone, onBack }) {
  const { nowPlaying, permissionGranted, isLoading, requestPermission } = useNowPlaying(visible);

  function handleSelect(songInfo) {
    if (onDone) onDone(songInfo);
  }

  // State 1: Belum ada izin Notification Access
  if (!permissionGranted) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="musical-notes-outline" size={24} color={colors.primary} />
          <Text style={[styles.title, { color: colors.textPrimary }]}>Lagu yang Sedang Diputar</Text>
        </View>
        <Text style={[styles.description, { color: colors.textSecondary }]}>
          Untuk membaca lagu yang sedang diputar di perangkat kamu (Spotify, YouTube Music, dll),
          ConnectSphere memerlukan akses Notification Listener.
        </Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>Beri Izin di Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State 2: Loading (sedang fetch dari MediaSession)
  if (isLoading && !nowPlaying) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Membaca lagu dari perangkat...</Text>
        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State 3: Tidak ada lagu yang sedang diputar
  if (!nowPlaying) {
    return (
      <View style={styles.container}>
        <Ionicons name="musical-note-outline" size={48} color={colors.textSecondary} style={{ marginBottom: spacing.sm }} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>Tidak ada lagu yang sedang diputar</Text>
        <Text style={[styles.emptyHint, { color: colors.textSecondary }]}>
          Putar lagu di Spotify, YouTube Music, atau pemutar musik lainnya, lalu kembali ke sini.
        </Text>
        <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
          <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // State 4: Ada lagu — tampilkan dan biarkan user memilih
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="musical-notes" size={24} color={colors.primary} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sedang Diputar</Text>
      </View>
      <TouchableOpacity
        style={[styles.songCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => handleSelect({ songTitle: nowPlaying.songTitle, artistName: nowPlaying.artistName })}
        activeOpacity={0.7}
      >
        <View style={styles.songInfo}>
          <Text style={[styles.songTitle, { color: colors.textPrimary }]} numberOfLines={1}>{nowPlaying.songTitle}</Text>
          <Text style={[styles.artistName, { color: colors.textSecondary }]} numberOfLines={1}>{nowPlaying.artistName}</Text>
        </View>
        <Text style={[styles.shareLabel, { color: colors.primary }]}>Bagikan →</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.button, styles.backButton]} onPress={onBack}>
        <Text style={[styles.backButtonText, { color: colors.textSecondary }]}>Batal</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    alignItems: 'center',
    minHeight: 120,
    justifyContent: 'center',
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginTop: spacing.xs,
  },
  description: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: 8,
    marginTop: spacing.md,
  },
  buttonText: {
    fontWeight: typography.weights.semibold,
    fontSize: typography.sizes.md,
  },
  backButton: {
    backgroundColor: 'transparent',
    marginTop: spacing.sm,
  },
  backButtonText: {
    fontWeight: typography.weights.medium,
    fontSize: typography.sizes.md,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    textAlign: 'center',
  },
  emptyHint: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 18,
  },
  songCard: {
    borderRadius: 12,
    padding: spacing.md,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    marginTop: spacing.md,
  },
  songInfo: { flex: 1 },
  songTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  artistName: {
    fontSize: typography.sizes.sm,
    marginTop: 2,
  },
  shareLabel: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    marginLeft: spacing.sm,
  },
});
