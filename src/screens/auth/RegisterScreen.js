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
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { uploadProfilePhoto } from '../../services/storageService';
import { updateUserProfile } from '../../services/authService';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';
import { AUTH_STRINGS, AUTH_ERRORS, VALIDATION_ERRORS } from '../../utils/constants';
import { isValidEmail, isValidUsername, isValidPassword } from '../../utils/validators';

export default function RegisterScreen({ navigation }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors);
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [avatarUri, setAvatarUri] = useState(null);
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

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin Diperlukan', 'Izinkan akses galeri untuk memilih foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets?.[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  }

  async function handleRegister() {
    if (!validate()) return;
    setLoading(true);
    try {
      let photoURL = null;

      // Register the user first (creates Firebase Auth + Firestore doc)
      const { data, error } = await register(email.trim(), password, username.trim());
      if (error) {
        Alert.alert('Gagal Daftar', AUTH_ERRORS[error] || AUTH_ERRORS.default);
        return;
      }

      // If avatar was picked, upload it and update the profile
      if (avatarUri && data?.uid) {
        const { data: uploadedURL, error: uploadError } = await uploadProfilePhoto(data.uid, avatarUri);
        if (uploadedURL && !uploadError) {
          await updateUserProfile(data.uid, { photoURL: uploadedURL });
        }
      }
    } catch (err) {
      Alert.alert('Gagal Daftar', AUTH_ERRORS.default);
    } finally {
      setLoading(false);
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

        {/* Avatar Picker */}
        <View style={styles.avatarSection}>
          <Pressable style={styles.avatarContainer} onPress={pickAvatar}>
            {avatarUri ? (
              <Image
                source={{ uri: avatarUri }}
                style={styles.avatarImage}
                contentFit="cover"
              />
            ) : (
              <View style={styles.avatar}>
                <Ionicons name="person" size={40} color={colors.textSecondary} />
              </View>
            )}
            {/* Add / Edit badge */}
            <View style={styles.avatarBadge}>
              <Ionicons name={avatarUri ? 'pencil' : 'add'} size={16} color={colors.textInverse} />
            </View>
          </Pressable>
        </View>

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

const getStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  title: {
    color: colors.textPrimary,
    fontSize: typography.sizes.xl,
    fontFamily: typography.fontFamily.bold,
    marginTop: spacing.md,
  },
  avatarSection: {
    alignItems: 'center',
    marginVertical: spacing.xl,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  avatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
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
    marginTop: 'auto',
    paddingTop: spacing.xl,
    paddingBottom: spacing.md,
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
