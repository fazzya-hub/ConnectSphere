import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from '../common/Avatar';
import { getLiveStatusType } from '../../utils/liveStatusFormatter';
import { colors } from '../../theme';

/**
 * Ring avatar dengan warna berdasarkan tipe live status.
 * Badge icon di pojok kanan bawah: musical-notes (listening) atau location (location).
 * @param {{ photoURL: string|null, name: string, liveStatus: Object|null, size: number }} props
 */
export default function StoryRing({ photoURL, name, liveStatus, size = 56 }) {
  const statusType = getLiveStatusType(liveStatus);

  const ringColor =
    statusType === 'listening'
      ? colors.primary
      : statusType === 'location'
        ? colors.secondary
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

const styles = StyleSheet.create({
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
