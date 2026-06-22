import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import useAuthStore from '../../store/authStore';
import { useConversations } from '../../hooks/useChat';
import Avatar from '../../components/common/Avatar';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import { colors, typography, spacing } from '../../theme';

function formatTime(timestamp) {
  if (!timestamp) return '';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();

  if (date.toDateString() === now.toDateString()) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) {
    return 'Kemarin';
  }

  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  if (diffDays < 7) {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
  }

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
}

export default function InboxScreen() {
  const navigation = useNavigation();
  const currentUser = useAuthStore((state) => state.user);
  const { conversations, isLoading } = useConversations(currentUser?.uid);

  const handleSelectChat = (item) => {
    navigation.navigate('Chat', {
      conversationId: item.id,
      partner: item.partner,
    });
  };

  if (isLoading) {
    return <Loader />;
  }

  const renderConversationItem = ({ item }) => {
    const partner = item.partner;
    const lastMsg = item.lastMessage;
    const unread = item.unreadCount?.[currentUser?.uid] || 0;
    const isLastMsgMe = lastMsg?.senderId === currentUser?.uid;

    return (
      <TouchableOpacity
        style={styles.chatCard}
        onPress={() => handleSelectChat(item)}
        activeOpacity={0.7}
      >
        <Avatar
          uri={partner.photoURL}
          name={partner.displayName || partner.username}
          size={52}
        />

        <View style={styles.chatInfo}>
          <View style={styles.chatHeader}>
            <Text style={styles.partnerName} numberOfLines={1}>
              {partner.displayName || partner.username}
            </Text>
            {lastMsg && (
              <Text style={styles.chatTime}>
                {formatTime(lastMsg.createdAt)}
              </Text>
            )}
          </View>

          <View style={styles.chatBody}>
            <Text
              style={[
                styles.lastMessageText,
                unread > 0 && styles.lastMessageUnread,
              ]}
              numberOfLines={1}
            >
              {isLastMsgMe && <Text style={styles.myMessagePrefix}>Anda: </Text>}
              {lastMsg?.text || 'Mulai percakapan baru...'}
            </Text>

            {unread > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadCountText}>{unread}</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <EmptyState message="Belum ada percakapan. Kirim pesan ke teman pertamamu lewat Explore!" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContainer}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContainer: {
    paddingVertical: spacing.xs,
  },
  chatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.background,
  },
  chatInfo: {
    flex: 1,
    marginLeft: spacing.md,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  partnerName: {
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.semibold,
    color: colors.textPrimary,
    flex: 1,
    marginRight: spacing.sm,
  },
  chatTime: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  chatBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessageText: {
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    flex: 1,
    marginRight: spacing.sm,
  },
  lastMessageUnread: {
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.semibold,
  },
  myMessagePrefix: {
    color: colors.textSecondary,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadCountText: {
    color: colors.textInverse,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.bold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.md + 52 + spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
});
