import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { createPost } from '../../services/firestoreService';
import { uploadPostImage } from '../../services/storageService';
import useFeedStore from '../../store/feedStore';
import { colors, typography, spacing } from '../../theme';

export default function CreatePostScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const triggerRefresh = useFeedStore((state) => state.triggerRefresh);
  const [selectedImage, setSelectedImage] = useState(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  async function pickImage() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin Diperlukan', 'Akses galeri diperlukan untuk memilih foto.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setSelectedImage(result.assets[0].uri);
    }
  }

  async function handleSubmit() {
    if (!selectedImage || !caption.trim()) {
      Alert.alert('Lengkapi Data', 'Pilih foto dan isi caption terlebih dahulu.');
      return;
    }

    setIsUploading(true);
    try {
      const { data: imageURL, error: uploadError } = await uploadPostImage(
        user.uid,
        selectedImage
      );
      if (uploadError) throw new Error(uploadError);

      const { error: postError } = await createPost(user.uid, imageURL, caption.trim());
      if (postError) throw new Error(postError);

      triggerRefresh();
      navigation.navigate('Home');
      setSelectedImage(null);
      setCaption('');
    } catch (err) {
      Alert.alert('Gagal', 'Terjadi kesalahan. Coba lagi.');
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Pressable onPress={pickImage} style={styles.imagePicker}>
          {selectedImage ? (
            <Image source={{ uri: selectedImage }} style={styles.preview} contentFit="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={48} color={colors.textSecondary} style={{ marginBottom: spacing.sm }} />
              <Text style={styles.placeholderText}>Tap untuk pilih foto</Text>
            </View>
          )}
        </Pressable>

        <Text style={styles.label}>Caption</Text>
        <TextInput
          style={styles.captionInput}
          value={caption}
          onChangeText={setCaption}
          placeholder="Tulis caption..."
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={500}
        />

        <Button
          title="Posting"
          onPress={handleSubmit}
          loading={isUploading}
          disabled={!selectedImage || !caption.trim()}
          style={styles.submitButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  imagePicker: {
    marginBottom: spacing.lg,
  },
  preview: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surfaceLight,
  },
  placeholder: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    color: colors.textSecondary,
    fontSize: typography.sizes.md,
  },
  label: {
    color: colors.textPrimary,
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.medium,
    marginBottom: spacing.xs,
  },
  captionInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: spacing.md,
    color: colors.textPrimary,
    fontSize: typography.sizes.md,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: spacing.lg,
  },
  submitButton: {
    width: '100%',
  },
});
