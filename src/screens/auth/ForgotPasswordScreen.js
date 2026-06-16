import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS, AUTH_ERRORS } from '../../utils/constants';
import { isValidEmail } from '../../utils/validators';

export default function ForgotPasswordScreen({ navigation }) {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    if (!email.trim()) {
      setError('Email wajib diisi.');
      return;
    }
    if (!isValidEmail(email)) {
      setError('Format email tidak valid.');
      return;
    }
    setError('');
    setLoading(true);
    const { error: resetError } = await forgotPassword(email.trim());
    setLoading(false);
    if (resetError) {
      Alert.alert('Gagal', AUTH_ERRORS[resetError] || AUTH_ERRORS.default);
      return;
    }
    Alert.alert(
      'Email Terkirim',
      'Cek inbox email kamu untuk link reset password.',
      [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        {/* Icon */}
        <View style={styles.iconSection}>
          <View style={styles.iconCircle}>
            <Ionicons name="lock-open-outline" size={32} color={colors.primary} />
          </View>
        </View>

        <Text style={styles.title}>{AUTH_STRINGS.forgotPasswordTitle}</Text>
        <Text style={styles.subtitle}>
          Masukkan email yang terdaftar. Kami akan mengirim link reset password.
        </Text>

        {/* Email Input */}
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder={AUTH_STRINGS.emailPlaceholder}
          keyboardType="email-address"
          icon="mail-outline"
          error={error}
        />

        <Button
          title={AUTH_STRINGS.resetButton}
          onPress={handleReset}
          loading={loading}
          style={styles.primaryButton}
        />

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.backLink}>
          <Ionicons name="arrow-back" size={16} color={colors.primary} style={{ marginRight: 4 }} />
          <Text style={styles.backText}>{AUTH_STRINGS.backToLogin}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  iconSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fontFamily.bold,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.regular,
    textAlign: 'center',
    marginBottom: spacing.xl,
    lineHeight: 22,
  },
  primaryButton: {
    borderRadius: 999,
  },
  backLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  backText: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});
