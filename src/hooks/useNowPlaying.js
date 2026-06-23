import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import {
  getCurrentTrack,
  hasNotificationAccess,
  openNotificationAccessSettings,
} from '../../modules/media-session-module';

const POLL_INTERVAL_MS = 3000;

/**
 * Hook untuk membaca lagu yang sedang diputar di device Android
 * via MediaSessionManager (native module).
 *
 * @param {boolean} active - true saat picker/modal sedang aktif dibuka
 * @returns {{
 *   nowPlaying: { songTitle: string, artistName: string } | null,
 *   permissionGranted: boolean,
 *   isLoading: boolean,
 *   requestPermission: Function,
 *   getNativeTrack: Function,
 *   hasNotificationAccess: Function,
 *   openNotificationAccessSettings: Function
 * }}
 */
export function useNowPlaying(active = false) {
  const [nowPlaying, setNowPlaying] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Pengecekan izin ketika aktif
  useEffect(() => {
    if (!active) return;
    hasNotificationAccess().then(setPermissionGranted);
  }, [active]);

  // Polling lagu ketika aktif dan diizinkan
  useEffect(() => {
    if (!active || !permissionGranted) return;

    let cancelled = false;

    async function fetchNowPlaying() {
      setIsLoading(true);
      try {
        const track = await getCurrentTrack();
        if (!cancelled) {
          if (track?.title && track?.artist) {
            setNowPlaying({ songTitle: track.title, artistName: track.artist });
          } else {
            setNowPlaying(null);
          }
        }
      } catch {
        if (!cancelled) setNowPlaying(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    fetchNowPlaying();
    const interval = setInterval(fetchNowPlaying, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [active, permissionGranted]);

  // Reset state saat tidak aktif
  useEffect(() => {
    if (!active) {
      setNowPlaying(null);
      setIsLoading(false);
    }
  }, [active]);

  const requestPermission = useCallback(async () => {
    await openNotificationAccessSettings();
    let attempts = 0;
    const check = setInterval(async () => {
      attempts++;
      const granted = await hasNotificationAccess();
      if (granted || attempts >= 30) {
        clearInterval(check);
        setPermissionGranted(granted);
      }
    }, 1000);
  }, []);

  // Tetap sediakan fungsi getNativeTrack sekali jalan
  async function getNativeTrack() {
    if (Platform.OS !== 'android') {
      return { data: null, error: 'Platform not supported' };
    }

    try {
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
    nowPlaying,
    permissionGranted,
    isLoading,
    requestPermission,
    getNativeTrack,
    hasNotificationAccess,
    openNotificationAccessSettings,
  };
}
