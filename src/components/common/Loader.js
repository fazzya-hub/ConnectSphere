import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAppTheme } from '../../theme/themeContext';


export default function Loader({ size = 'large' }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color={colors.primary} />
    </View>
  );
}

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
});
