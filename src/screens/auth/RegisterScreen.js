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
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  const [showPassword, setShowPassword] = useState(false);
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
        {/* Header */}
        <Text style={styles.title}>Daftar Akun</Text>

        {/* Username Input */}
        <Input
          value={username}
          onChangeText={setUsername}
          placeholder="Username"
          icon="person-outline"
          error={errors.username}
        />

        {/* Email Input */}
        <Input
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          keyboardType="email-address"
          icon="mail-outline"
          error={errors.email}
        />

        {/* Password Input */}
        <Input
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry={!showPassword}
          icon="lock-closed-outline"
          error={errors.password}
          rightElement={
            <Pressable onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={20}
                color={showPassword ? colors.primary : colors.textSecondary}
              />
            </Pressable>
          }
        />

        {/* Register Button */}
        <View style={styles.actionsSection}>
          <Button
            title={AUTH_STRINGS.registerButton}
            onPress={handleRegister}
            loading={loading}
            style={styles.primaryButton}
          />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{AUTH_STRINGS.hasAccount} </Text>
          <Pressable onPress={() => navigation.navigate('Login')}>
            <Text style={styles.footerLink}>{AUTH_STRINGS.loginLink}</Text>
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
    paddingHorizontal: spacing.lg,
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fontFamily.bold,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  eyeButton: {
    padding: spacing.xxs,
  },
  actionsSection: {
    marginTop: spacing.lg,
  },
  primaryButton: {
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
  },
  footerLink: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.semibold,
  },
});
