import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { colors, typography } from '../../theme';

export default function Avatar({ uri, name, size = 40 }) {
  const fallback = name?.charAt(0)?.toUpperCase() || '?';

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        contentFit="cover"
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[styles.fallbackText, { fontSize: size * 0.4 }]}>{fallback}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceLight,
  },
  fallback: {
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    color: colors.primary,
    fontWeight: typography.weights.bold,
  },
});
