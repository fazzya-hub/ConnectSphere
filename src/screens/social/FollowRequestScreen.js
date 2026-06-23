import React from 'react';
import {
  View, Text, FlatList, StyleSheet, TouchableOpacity, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useFollowRequests } from '../../hooks/useSocialGraph';
import { respondToFollowRequest } from '../../services/socialService';
import UserCard from '../../components/social/UserCard';
import Loader from '../../components/common/Loader';
import EmptyState from '../../components/common/EmptyState';
import useAuthStore from '../../store/authStore';
import { useAppTheme } from '../../theme/themeContext';
import { typography } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

/**
 * FollowRequestScreen — daftar permintaan follow masuk.
 * User bisa Accept atau Decline.
 */
export default function FollowRequestScreen() {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { user } = useAuthStore();
  const navigation = useNavigation();
  const { requests, isLoading } = useFollowRequests(user?.uid);

  async function handleRespond(requestDocId, action) {
    const { error } = await respondToFollowRequest(requestDocId, action);
    if (error) {
      Alert.alert('Gagal', 'Terjadi kesalahan. Coba lagi.');
    }
  }

  function renderItem({ item }) {
    return (
      <UserCard
        user={item}
        onPress={() => navigation.navigate('UserProfile', { userId: item.uid })}
        showFollowButton={false}
        rightElement={
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.btnAccept}
              onPress={() => handleRespond(item.requestDocId, 'accepted')}
            >
              <Text style={styles.btnAcceptText}>Terima</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnDecline}
              onPress={() => handleRespond(item.requestDocId, 'rejected')}
            >
              <Text style={styles.btnDeclineText}>Tolak</Text>
            </TouchableOpacity>
          </View>
        }
      />
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Permintaan Follow</Text>
        {requests.length > 0 && (
          <Text style={styles.badge}>{requests.length}</Text>
        )}
      </View>

      {isLoading ? (
        <Loader />
      ) : requests.length === 0 ? (
        <EmptyState icon="person-add-outline" message="Tidak ada permintaan follow" />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={item => item.requestDocId || item.uid}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
  },
  badge: {
    backgroundColor: colors.primary,
    color: colors.textInverse,
    fontSize: 12,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  actions: {
    flexDirection: 'row',
    gap: 6,
  },
  btnAccept: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
  },
  btnAcceptText: {
    color: colors.textInverse,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
  btnDecline: {
    backgroundColor: colors.surfaceLight,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnDeclineText: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
  },
});
