import { deleteField, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

/**
 * Mengaktifkan atau mematikan fitur live status user.
 * Jika dimatikan, status aktif ikut dibersihkan agar tidak tampil ke follower.
 * @param {string} userId - UID user
 * @param {boolean} enabled - Status aktif fitur live status
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function setLiveStatusEnabled(userId, enabled) {
  try {
    const payload = {
      liveStatusEnabled: enabled,
      updatedAt: serverTimestamp(),
    };

    if (!enabled) {
      payload.liveStatus = deleteField();
    }

    await updateDoc(doc(db, 'users', userId), payload);
    return { data: true, error: null };
  } catch (error) {
    console.error('[liveStatusService] setLiveStatusEnabled error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menyimpan live status lagu dari Android MediaSession.
 * @param {string} userId - UID user
 * @param {{ songTitle: string, artistName: string }} songInfo
 * @param {boolean} isCloseFriendOnly - Flag untuk menampilkan status hanya ke close friends
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function setListeningStatus(userId, songInfo, isCloseFriendOnly = false) {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, 'users', userId), {
      liveStatusEnabled: true,
      liveStatus: {
        type: 'listening',
        source: 'mediaSession',
        songTitle: songInfo.songTitle,
        artistName: songInfo.artistName,
        isCloseFriendOnly,
        expiresAt,
        createdAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[liveStatusService] setListeningStatus error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menyimpan live status lokasi user berdasarkan koordinat lokal perangkat.
 * @param {string} userId - UID user
 * @param {{ placeName: string, latitude: number, longitude: number }} locationInfo
 * @param {boolean} isCloseFriendOnly - Flag untuk menampilkan status hanya ke close friends
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function setLocationStatus(userId, locationInfo, isCloseFriendOnly = false) {
  try {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await updateDoc(doc(db, 'users', userId), {
      liveStatusEnabled: true,
      liveStatus: {
        type: 'location',
        source: 'device',
        placeName: locationInfo.placeName,
        latitude: locationInfo.latitude,
        longitude: locationInfo.longitude,
        isCloseFriendOnly,
        expiresAt,
        createdAt: serverTimestamp(),
      },
      updatedAt: serverTimestamp(),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[liveStatusService] setLocationStatus error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Menghapus live status aktif tanpa mematikan toggle fitur.
 * @param {string} userId - UID user
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function clearLiveStatus(userId) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      liveStatus: null,
      updatedAt: serverTimestamp(),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[liveStatusService] clearLiveStatus error:', error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Memperbarui visibilitas close friends pada live status aktif.
 * @param {string} userId - UID user
 * @param {boolean} isCloseFriendOnly - Flag visibilitas status
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function updateLiveStatusVisibility(userId, isCloseFriendOnly) {
  try {
    await updateDoc(doc(db, 'users', userId), {
      'liveStatus.isCloseFriendOnly': isCloseFriendOnly,
      updatedAt: serverTimestamp(),
    });
    return { data: true, error: null };
  } catch (error) {
    console.error('[liveStatusService] updateLiveStatusVisibility error:', error.message);
    return { data: null, error: error.message };
  }
}
