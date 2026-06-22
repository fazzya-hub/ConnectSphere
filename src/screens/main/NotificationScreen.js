import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNotifications, markNotificationRead, markAllNotificationsRead } from '../../hooks/useNotifications';
import NotificationItem from '../../components/notification/NotificationItem';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import useAuthStore from '../../store/authStore';
import useNotificationStore from '../../store/notificationStore';
import { colors } from '../../theme/colors';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/**
 * NotificationScreen — pusat notifikasi real-time ConnectSphere.
 * - Notif dikelompokkan jadi "Terbaru" (< 24 jam) dan "Sebelumnya"
 * - Badge unread otomatis via Zustand store
 * - Deep link ke PostDetail / UserProfile saat tap notif
 */
export default function NotificationScreen({ navigation }) {
  const { user } = useAuthStore();
  const { notifications, isLoading } = useNotifications(user?.uid);
  const { markAllRead } = useNotificationStore();

  const now = Date.now();
  const recentNotifs = notifications.filter(n => {
    const t = n.createdAt?.toDate?.()?.getTime() ?? 0;
    return now - t < 86400000;
  });
  const olderNotifs = notifications.filter(n => {
    const t = n.createdAt?.toDate?.()?.getTime() ?? 0;
    return now - t >= 86400000;
  });

  const hasUnread = notifications.some(n => !n.isRead);

  async function handleNotifPress(notif) {
    if (!notif.isRead) {
      await markNotificationRead(notif.id);
    }
    switch (notif.type) {
      case 'like':
      case 'comment':
        if (notif.postId) navigation.navigate('PostDetail', { postId: notif.postId });
        break;
      case 'follow':
      case 'follow_request':
      case 'follow_request_accepted':
        if (notif.actorIds?.[0]) navigation.navigate('UserProfile', { userId: notif.actorIds[0] });
        break;
      case 'dm':
        navigation.navigate('Inbox');
        break;
    }
  }

  async function handleMarkAll() {
    markAllRead(); // update store UI immediately
    if (user?.uid) await markAllNotificationsRead(user.uid);
  }

  function renderSection(title, data) {
    if (data.length === 0) return null;
    return (
      <>
        <Text style={styles.sectionLabel}>{title}</Text>
        {data.map(notif => (
          <NotificationItem
            key={notif.id}
            notif={notif}
            onPress={handleNotifPress}
          />
        ))}
      </>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Notifikasi</Text>
        {hasUnread && (
          <TouchableOpacity onPress={handleMarkAll} style={styles.markAllBtn}>
            <Ionicons name="checkmark-done" size={18} color={colors.primary} />
            <Text style={styles.markAllText}>Tandai semua</Text>
          </TouchableOpacity>
        )}
      </View>

      {isLoading ? (
        <Loader />
      ) : notifications.length === 0 ? (
        <EmptyState
          icon="notifications-outline"
          message="Belum ada notifikasi"
          subtitle="Aktivitas dari pengikutmu akan muncul di sini"
        />
      ) : (
        <FlatList
          data={[]}
          ListHeaderComponent={
            <>
              {renderSection('Terbaru', recentNotifs)}
              {renderSection('Sebelumnya', olderNotifs)}
            </>
          }
          renderItem={null}
          keyExtractor={() => null}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  markAllText: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: 4,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
});
