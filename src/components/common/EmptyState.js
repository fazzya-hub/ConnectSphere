import { View, Text, StyleSheet } from 'react-native';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';

export default function EmptyState({ message = 'Tidak ada data' }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    fontSize: typography.sizes.xxxl,
    marginBottom: spacing.md,
  },
  message: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
});
