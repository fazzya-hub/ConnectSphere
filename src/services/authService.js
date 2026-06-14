import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithCredential,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { auth, db } from '../config/firebase';

/**
 * Mengambil profil user dari Firestore.
 * @param {string} uid
 * @returns {Promise<Object|null>}
 */
async function getUserProfile(uid) {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    if (!userDoc.exists()) return null;
    return { id: userDoc.id, ...userDoc.data() };
  } catch (error) {
    console.error('[authService] getUserProfile error:', error.code, error.message);
    return null;
  }
}

/**
 * Mendaftarkan user baru dengan email dan password.
 * Setelah register, buat dokumen user di Firestore collection 'users'.
 * @param {string} email
 * @param {string} password
 * @param {string} username
 * @param {string|null} photoURL
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function registerWithEmail(email, password, username, photoURL = null) {
  try {
    const credential = await createUserWithEmailAndPassword(auth, email, password);

    if (photoURL) {
      await updateProfile(credential.user, { displayName: username, photoURL });
    } else {
      await updateProfile(credential.user, { displayName: username });
    }

    await setDoc(doc(db, 'users', credential.user.uid), {
      uid: credential.user.uid,
      email,
      username,
      displayName: username,
      photoURL: photoURL ?? null,
      bio: '',
      isPrivate: false,
      followersCount: 0,
      followingCount: 0,
      postsCount: 0,
      fcmToken: null,
      liveStatus: null,
      closeFriends: [],
      notificationPrefs: {
        likes: true,
        comments: true,
        newFollower: true,
        dm: true,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    const profile = await getUserProfile(credential.user.uid);
    return { data: profile, error: null };
  } catch (error) {
    console.error('[authService] registerWithEmail error:', error.code, error.message);
    return { data: null, error: error.code || error.message };
  }
}

/**
 * Login dengan email dan password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function loginWithEmail(email, password) {
  try {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const profile = await getUserProfile(credential.user.uid);
    return { data: profile, error: null };
  } catch (error) {
    console.error('[authService] loginWithEmail error:', error.code, error.message);
    return { data: null, error: error.code || error.message };
  }
}

/**
 * Login dengan Google OAuth credential (idToken dari expo-auth-session).
 * Buat dokumen user di Firestore jika belum ada.
 * @param {string} idToken
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function signInWithGoogle(idToken) {
  try {
    const googleCredential = GoogleAuthProvider.credential(idToken);
    const credential = await signInWithCredential(auth, googleCredential);
    const { uid, email, displayName, photoURL } = credential.user;

    const existingProfile = await getUserProfile(uid);
    if (!existingProfile) {
      const username = displayName?.replace(/\s+/g, '_').toLowerCase() || `user_${uid.slice(0, 6)}`;
      await setDoc(doc(db, 'users', uid), {
        uid,
        email,
        username,
        displayName: displayName || username,
        photoURL: photoURL ?? null,
        bio: '',
        isPrivate: false,
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        fcmToken: null,
        liveStatus: null,
        closeFriends: [],
        notificationPrefs: {
          likes: true,
          comments: true,
          newFollower: true,
          dm: true,
        },
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    const profile = await getUserProfile(uid);
    return { data: profile, error: null };
  } catch (error) {
    console.error('[authService] signInWithGoogle error:', error.code, error.message);
    return { data: null, error: error.code || error.message };
  }
}

/**
 * Mengirim email reset password.
 * @param {string} email
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { data: true, error: null };
  } catch (error) {
    console.error('[authService] resetPassword error:', error.code, error.message);
    return { data: null, error: error.code || error.message };
  }
}

/**
 * Logout user dari Firebase Auth.
 * @returns {Promise<{ data: boolean|null, error: string|null }>}
 */
export async function logout() {
  try {
    try {
      await GoogleSignin.signOut();
    } catch (_) {
    }
    await signOut(auth);
    return { data: true, error: null };
  } catch (error) {
    console.error('[authService] logout error:', error.code, error.message);
    return { data: null, error: error.message };
  }
}

/**
 * Subscribe ke perubahan auth state Firebase.
 * Mengembalikan profil Firestore lengkap saat user login.
 * @param {(user: Object|null) => void} callback
 * @returns {() => void} unsubscribe function
 */
export function subscribeToAuthState(callback) {
  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      callback(null);
      return;
    }
    const profile = await getUserProfile(firebaseUser.uid);
    callback(profile);
  });
}

/**
 * Memperbarui profil user di Firebase Auth dan Firestore.
 * @param {string} userId - UID user
 * @param {Object} updates - Field yang akan diupdate (displayName, photoURL, bio, dll)
 * @returns {Promise<{ data: Object|null, error: string|null }>}
 */
export async function updateUserProfile(userId, updates) {
  try {
    // Update Firebase Auth profile jika displayName atau photoURL berubah
    const authUpdates = {};
    if (updates.displayName !== undefined) authUpdates.displayName = updates.displayName;
    if (updates.photoURL !== undefined) authUpdates.photoURL = updates.photoURL;

    if (Object.keys(authUpdates).length > 0 && auth.currentUser) {
      await updateProfile(auth.currentUser, authUpdates);
    }

    // Update Firestore user document
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });

    const profile = await getUserProfile(userId);
    return { data: profile, error: null };
  } catch (error) {
    console.error('[authService] updateUserProfile error:', error.code, error.message);
    return { data: null, error: error.code || error.message };
  }
}
