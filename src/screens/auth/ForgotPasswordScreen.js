import { useState } from 'react';
import {
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
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
        <Text style={styles.title}>{AUTH_STRINGS.forgotPasswordTitle}</Text>
        <Text style={styles.subtitle}>
          Masukkan email yang terdaftar. Kami akan mengirim link reset password.
        </Text>

        <Input
          label={AUTH_STRINGS.emailLabel}
          value={email}
          onChangeText={setEmail}
          placeholder={AUTH_STRINGS.emailPlaceholder}
          keyboardType="email-address"
          error={error}
        />

        <Button
          title={AUTH_STRINGS.resetButton}
          onPress={handleReset}
          loading={loading}
        />

        <Pressable onPress={() => navigation.navigate('Login')} style={styles.backLink}>
          <Text style={styles.link}>{AUTH_STRINGS.backToLogin}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  backLink: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  link: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
