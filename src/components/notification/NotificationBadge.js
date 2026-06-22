import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import useNotificationStore from '../../store/notificationStore';
import { colors } from '../../theme/colors';

/**
 * Badge merah yang menampilkan jumlah notifikasi belum dibaca.
 * Otomatis tersembunyi jika count = 0.
 */
export default function NotificationBadge() {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  if (unreadCount === 0) return null;

  return (
    <View style={styles.badge}>
      <Text style={styles.text}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.background,
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
});
