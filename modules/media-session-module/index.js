import { Platform } from 'react-native';
import { requireNativeModule } from 'expo-modules-core';

let NativeMediaSessionModule = null;

function getNativeModule() {
  if (Platform.OS !== 'android') {
    return null;
  }

  if (!NativeMediaSessionModule) {
    try {
      NativeMediaSessionModule = requireNativeModule('MediaSessionModule');
    } catch {
      NativeMediaSessionModule = null;
    }
  }

  return NativeMediaSessionModule;
}

/**
 * Mengambil lagu yang sedang diputar dari Android MediaSession.
 * @returns {Promise<{ title: string, artist: string }|null>}
 */
export async function getCurrentTrack() {
  const nativeModule = getNativeModule();

  if (!nativeModule?.getCurrentTrack) {
    return null;
  }

  return nativeModule.getCurrentTrack();
}

export default {
  getCurrentTrack,
};
