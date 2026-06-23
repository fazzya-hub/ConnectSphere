import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { useAppTheme } from '../../theme/themeContext';
import { getLiveStatusType } from '../../utils/liveStatusFormatter';

/**
 * Ring avatar dengan warna berdasarkan tipe live status.
 * Badge icon di pojok kanan bawah: musical-notes (listening) atau location (location).
 * @param {{ photoURL: string|null, name: string, liveStatus: Object|null, size: number }} props
 */
export default function StoryRing({ photoURL, name, liveStatus, size = 56 }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const statusType = getLiveStatusType(liveStatus);
  const isCF = liveStatus?.isCloseFriendOnly === true;

  const ringColor = isCF
    ? colors.success
    : statusType === 'listening'
      ? colors.primary
      : statusType === 'location'
        ? (colors.secondary === '#9CA3AF' || colors.secondary === '#6B7280' ? '#A124FF' : colors.secondary)
        : colors.border;

  const iconName =
    statusType === 'listening'
      ? 'musical-notes'
      : statusType === 'location'
        ? 'location'
        : null;

  return (
    <View
      style={[
        styles.ringOuter,
        {
          width: size + 6,
          height: size + 6,
          borderRadius: (size + 6) / 2,
          borderColor: ringColor,
        },
      ]}
    >
      <Avatar
        uri={photoURL}
        name={name}
        size={size}
      />
      {iconName && (
        <View style={[styles.badge, { backgroundColor: ringColor, borderColor: colors.background }]}>
          <Ionicons name={iconName} size={11} color={colors.textInverse} />
        </View>
      )}
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  ringOuter: {
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
});
