import React from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native';
import StoryRing from '../feed/StoryRing';
import { formatLiveStatus } from '../../utils/liveStatusFormatter';
import { Ionicons } from '@expo/vector-icons';
import { colors, typography, spacing } from '../../theme';

/**
 * Komponen untuk menampilkan bubble status (seperti IG Notes) di atas avatar.
 */
function StatusBubble({ status }) {
  if (!status) return null;
  const text = formatLiveStatus(status);
  if (!text) return null;

  const iconName =
    status.type === 'listening'
      ? 'musical-notes'
      : status.type === 'location'
        ? 'location'
        : null;

  return (
    <View style={styles.bubbleContainer}>
      <View style={[styles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.bubbleContent}>
          {iconName && (
            <Ionicons
              name={iconName}
              size={10}
              color={colors.primary}
              style={{ marginRight: 4 }}
            />
          )}
          <Text style={[styles.bubbleText, { color: colors.textPrimary }]} numberOfLines={2}>
            {text}
          </Text>
        </View>
      </View>
      {/* Segitiga panah ke bawah */}
      <View style={[styles.bubbleArrow, { borderTopColor: colors.border }]} />
    </View>
  );
}

/**
 * Row horizontal scrollable di atas FeedScreen.
 * Item pertama: avatar current user + tombol "+" untuk set status.
 * Sisanya: avatar following yang punya live status aktif.
 */
export default function LiveStatusRing({
  currentUser,
  currentUserLiveStatus,
  followingWithStatus = [],
  onPressAdd,
  onPressFollowing,
}) {
  const activeFollowing = followingWithStatus.filter(
    (item) => formatLiveStatus(item.liveStatus) !== null && (item.uid || item.id) !== currentUser?.uid
  );

  const currentUserName = currentUser?.username || currentUser?.displayName || 'User';

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Current user — set status */}
        <Pressable style={styles.ringItem} onPress={onPressAdd}>
          <StatusBubble status={currentUserLiveStatus} />
          <View style={styles.avatarContainer}>
            <StoryRing
              photoURL={currentUser?.photoURL}
              name={currentUserName}
              liveStatus={currentUserLiveStatus}
              size={56}
            />
            {/* Tombol + hanya muncul jika tidak ada status aktif */}
            {!currentUserLiveStatus && (
              <View style={[styles.addBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
                <Ionicons name="add" size={14} color={colors.textInverse} />
              </View>
            )}
          </View>
          <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
            {currentUserName}
          </Text>
        </Pressable>

        {/* Following with active live status */}
        {activeFollowing.map((item) => {
          const name = item.username || item.displayName || 'User';
          return (
            <Pressable
              key={item.uid || item.id}
              style={styles.ringItem}
              onPress={() => onPressFollowing && onPressFollowing(item, item.liveStatus)}
            >
              <StatusBubble status={item.liveStatus} />
              <StoryRing
                photoURL={item.photoURL}
                name={name}
                liveStatus={item.liveStatus}
                size={56}
              />
              <Text style={[styles.username, { color: colors.textSecondary }]} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
    alignItems: 'flex-end',
  },
  ringItem: {
    alignItems: 'center',
    width: 80,
    justifyContent: 'flex-end',
  },
  avatarContainer: {
    position: 'relative',
  },
  addBadge: {
    position: 'absolute',
    bottom: 0,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  username: {
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.medium,
    marginTop: spacing.xxs,
    textAlign: 'center',
  },
  bubbleContainer: {
    alignItems: 'center',
    width: 80,
    marginBottom: -4,
    zIndex: 10,
  },
  bubble: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxWidth: 80,
  },
  bubbleContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleText: {
    fontSize: 9,
    textAlign: 'center',
    fontWeight: typography.weights.medium,
    lineHeight: 11,
  },
  bubbleArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
