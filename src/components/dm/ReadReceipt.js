import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../theme/themeContext';


export default function ReadReceipt({ status }) {
  const { colors } = useAppTheme();
  const isRead = status === 'read';

  return (
    <Ionicons
      name={isRead ? 'checkmark-done' : 'checkmark'}
      size={16}
      color={isRead ? colors.primaryLight : colors.textSecondary}
    />
  );
}
