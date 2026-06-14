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
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { colors, typography, spacing } from '../../theme';
import { AUTH_STRINGS, AUTH_ERRORS } from '../../utils/constants';
import { isValidEmail } from '../../utils/validators';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

export default function LoginScreen({ navigation }) {
  const { login, googleSignIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const userInfo = await GoogleSignin.signIn();
      // GoogleSignin v11+ uses userInfo.data?.idToken, older uses userInfo.idToken
      const idToken = userInfo.data?.idToken || userInfo.idToken;
      
      if (!idToken) {
        Alert.alert('Gagal', 'Token Google tidak ditemukan.');
        setGoogleLoading(false);
        return;
      }
      
      const { error } = await googleSignIn(idToken);
      if (error) {
        Alert.alert('Gagal', AUTH_ERRORS[error] || AUTH_ERRORS.default);
      }
    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        // user cancelled the login flow
      } else if (error.code === statusCodes.IN_PROGRESS) {
        // operation (e.g. sign in) is in progress already
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert('Gagal', 'Google Play Services tidak tersedia.');
      } else {
        Alert.alert('Gagal', 'Terjadi kesalahan saat login dengan Google.');
        console.error(error);
      }
    } finally {
      setGoogleLoading(false);
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
        <View style={styles.header}>
          <Text style={styles.brand}>ConnectSphere</Text>
         </View>

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

        {/* Forgot Password Link */}
        <Pressable onPress={() => navigation.navigate('ForgotPassword')} style={styles.forgotRow}>
          <Text style={styles.forgotText}>{AUTH_STRINGS.forgotPasswordLink}</Text>
        </Pressable>

        {/* Primary Login Button */}
        <Button title={AUTH_STRINGS.loginButton} onPress={handleLogin} loading={loading} style={styles.primaryButton} />

        {/* Divider */}
        <View style={styles.divider}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>atau</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Login */}
        <Button
          title={AUTH_STRINGS.googleButton}
          onPress={handleGoogleLogin}
          variant="outline"
          loading={googleLoading}
          style={styles.googleButton}
        />

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{AUTH_STRINGS.noAccount} </Text>
          <Pressable onPress={() => navigation.navigate('Register')}>
            <Text style={styles.footerLink}>{AUTH_STRINGS.registerLink}</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  brand: {
    color: colors.primary,
    fontSize: typography.sizes.xxl,
    fontFamily: typography.fontFamily.bold,
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
    fontFamily: typography.fontFamily.regular,
    marginTop: spacing.xs,
  },
  eyeButton: {
    padding: spacing.xxs,
  },
  forgotRow: {
    alignSelf: 'flex-end',
    marginBottom: spacing.lg,
  },
  forgotText: {
    color: colors.primary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.semibold,
    letterSpacing: 0.3,
  },
  primaryButton: {
    borderRadius: 999,
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
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  googleButton: {
    borderRadius: 999,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.regular,
  },
  footerLink: {
    color: colors.primary,
    fontSize: typography.sizes.sm,
    fontFamily: typography.fontFamily.semibold,
  },
});
