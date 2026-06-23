import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme';

export default function ReadReceipt({ status }) {
  const isRead = status === 'read';

  return (
    <Ionicons
      name={isRead ? 'checkmark-done' : 'checkmark'}
      size={16}
      color={isRead ? colors.primaryLight : colors.textSecondary}
    />
  );
}
