import React, { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import { useCurrentLocation } from '../../hooks/useCurrentLocation';
import { setLocationStatus } from '../../services/liveStatusService';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';

export default function LocationPicker({ onDone, onBack }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { user } = useAuth();
  const { getCurrentLocation, isLoading } = useCurrentLocation();
  const [placeName, setPlaceName] = useState('');
  const [coordinates, setCoordinates] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleFetchLocation() {
    setError(null);
    const { data, error: fetchError } = await getCurrentLocation();
    if (fetchError) {
      setError(fetchError);
      return;
    }
    if (data) {
      setPlaceName(data.placeName);
      setCoordinates({ latitude: data.latitude, longitude: data.longitude });
    }
  }

  async function handleSubmit() {
    if (!placeName || !coordinates || !user?.uid) return;
    
    setIsSubmitting(true);
    try {
      await setLocationStatus(user.uid, {
        placeName,
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      onDone();
    } catch (e) {
      console.error('[LocationPicker] error:', e);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={onBack} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sedang di Lokasi</Text>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="location-outline" size={40} color={colors.primary} />
        </View>

        {error && <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>}

        {!placeName && !isLoading && (
          <Text style={[styles.descText, { color: colors.textSecondary }]}>
            Ketuk tombol di bawah untuk mendeteksi lokasi kamu saat ini.
          </Text>
        )}

        {placeName && (
          <View style={[styles.resultBox, { backgroundColor: colors.surfaceLight }]}>
            <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>Lokasi saat ini:</Text>
            <Text style={[styles.placeName, { color: colors.textPrimary }]}>{placeName}</Text>
          </View>
        )}

        {!placeName ? (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: colors.surfaceLight, borderColor: colors.border, borderWidth: 1 }]}
            onPress={handleFetchLocation}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Text style={[styles.actionText, { color: colors.textPrimary }]}>Deteksi Lokasi</Text>
            )}
          </Pressable>
        ) : (
          <Pressable
            style={[styles.submitBtn, { backgroundColor: colors.primary }]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.textInverse} />
            ) : (
              <Text style={[styles.submitText, { color: colors.textInverse }]}>Set Status Lokasi</Text>
            )}
          </Pressable>
        )}
      </View>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    paddingTop: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  iconBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  descText: {
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.xl,
    lineHeight: 22,
  },
  errorText: {
    fontSize: typography.sizes.sm,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  resultBox: {
    padding: spacing.md,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultLabel: {
    fontSize: typography.sizes.xs,
    marginBottom: 4,
  },
  placeName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    textAlign: 'center',
  },
  actionBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  actionText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
  submitBtn: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  submitText: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.bold,
  },
});
