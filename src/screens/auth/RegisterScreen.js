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
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS, AUTH_ERRORS, VALIDATION_ERRORS } from '../../utils/constants';
import { isValidEmail, isValidUsername, isValidPassword } from '../../utils/validators';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  function validate() {
    const newErrors = {};
    if (!email.trim()) newErrors.email = VALIDATION_ERRORS.emailRequired;
    else if (!isValidEmail(email)) newErrors.email = 'Format email tidak valid.';
    if (!username.trim()) newErrors.username = VALIDATION_ERRORS.usernameRequired;
    else if (!isValidUsername(username)) newErrors.username = VALIDATION_ERRORS.usernameInvalid;
    if (!password) newErrors.password = VALIDATION_ERRORS.passwordRequired;
    else if (!isValidPassword(password)) newErrors.password = VALIDATION_ERRORS.passwordTooShort;
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await register(email.trim(), password, username.trim());
    setLoading(false);
    if (error) {
      Alert.alert('Gagal Daftar', AUTH_ERRORS[error] || AUTH_ERRORS.default);
    }
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
        <Text style={styles.title}>{AUTH_STRINGS.registerTitle}</Text>

        <Input
          label={AUTH_STRINGS.usernameLabel}
          value={username}
          onChangeText={setUsername}
          placeholder={AUTH_STRINGS.usernamePlaceholder}
          autoCapitalize="none"
          error={errors.username}
        />
        <Input
          label={AUTH_STRINGS.emailLabel}
          value={email}
          onChangeText={setEmail}
          placeholder={AUTH_STRINGS.emailPlaceholder}
          keyboardType="email-address"
          error={errors.email}
        />
        <Input
          label={AUTH_STRINGS.passwordLabel}
          value={password}
          onChangeText={setPassword}
          placeholder={AUTH_STRINGS.passwordPlaceholder}
          secureTextEntry
          error={errors.password}
        />

        <Button
          title={AUTH_STRINGS.registerButton}
          onPress={handleRegister}
          loading={loading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{AUTH_STRINGS.hasAccount} </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.link}>{AUTH_STRINGS.loginLink}</Text>
          </Pressable>
        </View>
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
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.lg,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
  },
  link: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
  },
});
