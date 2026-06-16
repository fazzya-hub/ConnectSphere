import { useCallback } from 'react';
import useAuthStore from '../store/authStore';
import {
  registerWithEmail,
  loginWithEmail,
  signInWithGoogle,
  resetPassword,
  logout,
  updateUserProfile,
} from '../services/authService';
import { uploadProfilePhoto } from '../services/storageService';

/**
 * Hook utama untuk operasi autentikasi.
 * Menggabungkan Zustand store dengan auth service layer.
 * @returns {Object} state dan fungsi auth
 */
export function useAuth() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const setUser = useAuthStore((state) => state.setUser);
  const clearUser = useAuthStore((state) => state.clearUser);

  const register = useCallback(async (email, password, username, photoURL = null) => {
    const { data, error } = await registerWithEmail(email, password, username, photoURL);
    if (data) setUser(data);
    return { data, error };
  }, [setUser]);

  const login = useCallback(async (email, password) => {
    const { data, error } = await loginWithEmail(email, password);
    if (data) setUser(data);
    return { data, error };
  }, [setUser]);

  const googleSignIn = useCallback(async (idToken) => {
    const { data, error } = await signInWithGoogle(idToken);
    if (data) setUser(data);
    return { data, error };
  }, [setUser]);

  const forgotPassword = useCallback(async (email) => {
    return resetPassword(email);
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await logout();
    if (!error) clearUser();
    return { error };
  }, [clearUser]);

  const updateProfile = useCallback(async (updates) => {
    if (!user?.uid) return { error: 'No user' };
    const { data, error } = await updateUserProfile(user.uid, updates);
    if (data) setUser(data);
    return { data, error };
  }, [user?.uid, setUser]);

  return {
    user,
    isAuthenticated,
    isLoading,
    register,
    login,
    googleSignIn,
    forgotPassword,
    signOut,
    updateProfile,
  };
}
