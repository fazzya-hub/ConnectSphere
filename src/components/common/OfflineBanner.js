import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../theme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useAppTheme } from '../../theme/themeContext';

export default function OfflineBanner() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
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

const getStyles = (colors) => StyleSheet.create({
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
