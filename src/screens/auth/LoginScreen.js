import { useState, useEffect } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS, AUTH_ERRORS } from '../../utils/constants';
import { isValidEmail } from '../../utils/validators';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const { login, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  });

  useEffect(() => {
    async function handleGoogleResponse() {
      if (response?.type !== 'success') return;
      const idToken = response.authentication?.idToken;
      if (!idToken) {
        Alert.alert('Gagal', 'Token Google tidak ditemukan.');
        return;
      }
      setGoogleLoading(true);
      const { error } = await googleSignIn(idToken);
      setGoogleLoading(false);
      if (error) {
        Alert.alert('Gagal', AUTH_ERRORS[error] || AUTH_ERRORS.default);
      }
    }
    handleGoogleResponse();
  }, [response, googleSignIn]);

  function validate() {
    const newErrors = {};
    if (!email.trim()) newErrors.email = 'Email wajib diisi.';
    else if (!isValidEmail(email)) newErrors.email = 'Format email tidak valid.';
    if (!password) newErrors.password = 'Password wajib diisi.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleLogin() {
    if (!validate()) return;
    setLoading(true);
    const { error } = await login(email.trim(), password);
    setLoading(false);
    if (error) {
      Alert.alert('Gagal Masuk', AUTH_ERRORS[error] || AUTH_ERRORS.default);
    }
  }

  async function handleGoogleLogin() {
    if (!request) {
      Alert.alert('Gagal', 'Google Sign-In belum dikonfigurasi. Cek file .env');
      return;
    }
    await promptAsync();
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
        <Text style={styles.title}>{AUTH_STRINGS.loginTitle}</Text>

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

        <Pressable onPress={() => navigation.navigate('ForgotPassword')}>
          <Text style={styles.link}>{AUTH_STRINGS.forgotPasswordLink}</Text>
        </Pressable>

        <Button title={AUTH_STRINGS.loginButton} onPress={handleLogin} loading={loading} />

        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        <Button
          title={AUTH_STRINGS.googleButton}
          onPress={handleGoogleLogin}
          variant="outline"
          loading={googleLoading}
        />

        <View style={styles.footer}>
          <Text style={styles.footerText}>{AUTH_STRINGS.noAccount} </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.link}>{AUTH_STRINGS.registerLink}</Text>
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
  link: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.lg,
    textAlign: 'right',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    color: colors.textSecondary,
    marginHorizontal: spacing.sm,
    fontSize: typography.sizes.sm,
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
});
