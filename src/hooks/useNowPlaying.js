import { getCurrentTrack } from '../../modules/media-session-module';

/**
 * Mengambil lagu live status dari Android MediaSession.
 * @returns {{ getNativeTrack: Function }}
 */
export function useNowPlaying() {
  async function getNativeTrack() {
    try {
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
  };
}
