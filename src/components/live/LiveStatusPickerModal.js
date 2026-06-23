import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import NowPlayingPicker from './NowPlayingPicker';
import LocationPicker from './LocationPicker';
import { clearLiveStatus, setListeningStatus } from '../../services/liveStatusService';
import { formatLiveStatus } from '../../utils/liveStatusFormatter';
import { useAuth } from '../../hooks/useAuth';
import { colors, typography, spacing } from '../../theme';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Bottom sheet modal untuk memilih tipe live status: Lagu atau Lokasi.
 * Jika user sudah punya status aktif, tampilkan opsi "Hapus Status".
 * @param {{ visible: boolean, onClose: Function, currentLiveStatus: Object|null }} props
 */
export default function LiveStatusPickerModal({ visible, onClose, currentLiveStatus }) {
  const { user } = useAuth();
  const [activePicker, setActivePicker] = useState(null); // 'listening' | 'location' | null
  const [isClearing, setIsClearing] = useState(false);

  const hasActiveStatus = formatLiveStatus(currentLiveStatus) !== null;

  async function handleClearStatus() {
    if (!user?.uid) return;
    setIsClearing(true);
    try {
      await clearLiveStatus(user.uid);
      onClose();
    } catch (e) {
      console.error('[LiveStatusPickerModal] clear error:', e);
    } finally {
      setIsClearing(false);
    }
  }

  async function handlePickerDone(songInfo) {
    if (songInfo && user?.uid && activePicker === 'listening') {
      try {
        await setListeningStatus(user.uid, songInfo);
      } catch (e) {
        console.error('[LiveStatusPickerModal] set listening status error:', e);
      }
    }
    setActivePicker(null);
    onClose();
  }

  function handleBack() {
    setActivePicker(null);
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={[styles.sheet, { backgroundColor: colors.surface }]}>
          {/* Handle bar */}
          <View style={[styles.handleBar, { backgroundColor: colors.border }]} />

          {activePicker === 'listening' ? (
            <NowPlayingPicker visible={visible} onDone={handlePickerDone} onBack={handleBack} />
          ) : activePicker === 'location' ? (
            <LocationPicker onDone={handlePickerDone} onBack={handleBack} />
          ) : (
            <>
              <Text style={[styles.title, { color: colors.textPrimary }]}>Set Live Status</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Bagikan aktivitas kamu ke followers
              </Text>

              {/* Option: Lagu */}
              <Pressable
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={() => setActivePicker('listening')}
              >
                <View style={[styles.optionIcon, { backgroundColor: 'rgba(255, 193, 7, 0.15)' }]}>
                  <Ionicons name="musical-notes" size={22} color={colors.primary} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Sedang Mendengarkan</Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    Bagikan lagu yang kamu dengarkan
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>

              {/* Option: Lokasi */}
              <Pressable
                style={[styles.option, { borderBottomColor: colors.border }]}
                onPress={() => setActivePicker('location')}
              >
                <View style={[styles.optionIcon, { backgroundColor: 'rgba(156, 163, 175, 0.15)' }]}>
                  <Ionicons name="location" size={22} color={colors.primary} />
                </View>
                <View style={styles.optionInfo}>
                  <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>Sedang di Lokasi</Text>
                  <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                    Bagikan tempat kamu berada sekarang
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
              </Pressable>

              {/* Hapus Status — hanya jika ada status aktif */}
              {hasActiveStatus && (
                <Pressable
                  style={[styles.option, styles.clearOption, { borderBottomColor: colors.border }]}
                  onPress={handleClearStatus}
                  disabled={isClearing}
                >
                  <View style={[styles.optionIcon, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
                    <Ionicons name="close-circle" size={22} color={colors.error} />
                  </View>
                  <View style={styles.optionInfo}>
                    <Text style={[styles.optionLabel, { color: colors.error }]}>
                      {isClearing ? 'Menghapus...' : 'Hapus Status'}
                    </Text>
                    <Text style={[styles.optionDesc, { color: colors.textSecondary }]}>
                      Hapus live status kamu saat ini
                    </Text>
                  </View>
                </Pressable>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.xxs,
  },
  subtitle: {
    fontSize: typography.sizes.sm,
    marginBottom: spacing.lg,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  clearOption: {
    borderBottomWidth: 0,
    marginTop: spacing.xs,
  },
  optionIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionInfo: {
    flex: 1,
    marginLeft: spacing.sm,
    marginRight: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
  },
  optionDesc: {
    fontSize: typography.sizes.xs,
    marginTop: 2,
  },
});
