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

/**
 * Cek apakah user sudah grant izin Notification Listener.
 * @returns {Promise<boolean>}
 */
export async function hasNotificationAccess() {
  const nativeModule = getNativeModule();

  if (!nativeModule?.hasNotificationAccess) {
    return false;
  }

  return nativeModule.hasNotificationAccess();
}

/**
 * Buka halaman Settings > Notification Access agar user bisa grant izin.
 * @returns {Promise<boolean>}
 */
export async function openNotificationAccessSettings() {
  const nativeModule = getNativeModule();

  if (!nativeModule?.openNotificationAccessSettings) {
    return false;
  }

  return nativeModule.openNotificationAccessSettings();
}

export default {
  getCurrentTrack,
  hasNotificationAccess,
  openNotificationAccessSettings,
};
