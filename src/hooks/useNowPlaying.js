import { Platform } from 'react-native';
import {
  getCurrentTrack,
  hasNotificationAccess,
  openNotificationAccessSettings,
} from '../../modules/media-session-module';

/**
 * Mengambil lagu live status dari Android MediaSession.
 * @returns {{
 *   getNativeTrack: Function,
 *   hasNotificationAccess: Function,
 *   openNotificationAccessSettings: Function
 * }}
 */
export function useNowPlaying() {
  async function getNativeTrack() {
    if (Platform.OS !== 'android') {
      return { data: null, error: 'Platform not supported' };
    }

    try {
      // Periksa izin akses notifikasi terlebih dahulu
      const hasAccess = await hasNotificationAccess();
      if (!hasAccess) {
        return { data: null, error: 'Permission not granted' };
      }

      const track = await getCurrentTrack();
      if (!track?.title || !track?.artist) {
        return { data: null, error: null };
      }

      return {
        data: {
          songTitle: track.title,
          artistName: track.artist,
          source: 'mediaSession',
        },
        error: null,
      };
    } catch (error) {
      console.error('[useNowPlaying] native track error:', error.message);
      return { data: null, error: error.message };
    }
  }

  return {
    getNativeTrack,
    hasNotificationAccess,
    openNotificationAccessSettings,
  };
}
