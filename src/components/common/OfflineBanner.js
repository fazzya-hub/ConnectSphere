import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';

export default function OfflineBanner() {
  const { isConnected, isInternetReachable } = useNetworkStatus();
  const isOffline = !isConnected || isInternetReachable === false;

  if (!isOffline) return null;

  return (
    <View style={styles.container}>
      <Ionicons name="cloud-offline-outline" size={16} color={colors.textInverse} />
      <Text style={styles.text}>Offline. Data terakhir yang tersimpan tetap ditampilkan.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  text: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.semibold,
  },
});
