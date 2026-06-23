import React, { useEffect, useRef, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { typography, spacing } from '../../theme';
import { useAppTheme } from '../../theme/themeContext';

export default function AudioNote({ audioUrl, isComposer = false, onRecorded, isMe = false }) {
  const { colors } = useAppTheme();
  const styles = getStyles(colors, isMe);
  const [recording, setRecording] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const soundRef = useRef(null);

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
  }, [recording]);

  async function startRecording() {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Izin Ditolak', 'Aplikasi memerlukan izin mikrofon untuk mengirim audio note.');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: nextRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(nextRecording);
      setIsRecording(true);
    } catch (error) {
      Alert.alert('Gagal Merekam', error.message);
    }
  }

  async function stopRecording() {
    try {
      if (!recording) return;
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({ allowsRecordingIOS: false });
      const uri = recording.getURI();
      setRecording(null);
      if (uri && onRecorded) onRecorded(uri);
    } catch (error) {
      Alert.alert('Gagal Mengirim Audio', error.message);
    }
  }

  async function togglePlayback() {
    try {
      if (!audioUrl) return;
      if (soundRef.current && isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
        return;
      }

      if (!soundRef.current) {
        const { sound } = await Audio.Sound.createAsync({ uri: audioUrl });
        soundRef.current = sound;
        sound.setOnPlaybackStatusUpdate((status) => {
          if (status.didJustFinish) setIsPlaying(false);
        });
      }

      await soundRef.current.playAsync();
      setIsPlaying(true);
    } catch (error) {
      Alert.alert('Gagal Memutar Audio', error.message);
    }
  }

  if (isComposer) {
    return (
      <TouchableOpacity
        style={[styles.composerButton, isRecording && styles.recordingButton]}
        onPress={isRecording ? stopRecording : startRecording}
        activeOpacity={0.75}
      >
        <Ionicons name={isRecording ? 'stop' : 'mic-outline'} size={24} color={isRecording ? colors.textInverse : colors.primary} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity style={styles.player} onPress={togglePlayback} activeOpacity={0.75}>
      <Ionicons name={isPlaying ? 'pause-circle' : 'play-circle'} size={32} color={isMe ? colors.textInverse : colors.primary} />
      <View style={styles.waveform}>
        {[12, 24, 16, 20, 10, 18].map((height, index) => (
          <View key={`${height}-${index}`} style={[styles.bar, { height }]} />
        ))}
      </View>
      <Text style={styles.label}>Audio</Text>
    </TouchableOpacity>
  );
}

const getStyles = (colors, isMe) => StyleSheet.create({
  composerButton: {
    padding: spacing.xs,
  },
  recordingButton: {
    backgroundColor: colors.primary,
    borderRadius: 18,
  },
  player: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xxs,
    width: 150,
  },
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginHorizontal: spacing.xs,
  },
  bar: {
    width: 3,
    backgroundColor: isMe ? (colors.textInverse === '#FFFFFF' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(18, 18, 18, 0.6)') : colors.textSecondary,
    borderRadius: 1.5,
  },
  label: {
    color: isMe ? colors.textInverse : colors.textSecondary,
    fontSize: typography.sizes.xs,
    fontFamily: typography.fontFamily.regular,
  },
});
