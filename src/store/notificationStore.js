import { create } from 'zustand';

/**
 * Zustand store untuk state notifikasi global.
 * Digunakan oleh useNotifications hook dan NotificationBadge.
 */
const useNotificationStore = create((set) => ({
  notifications: [],
  unreadCount: 0,
  preferences: {
    likes: true,
    comments: true,
    newFollower: true,
    dm: true,
  },
  setNotifications: (notifications) => set({ notifications }),
  setUnreadCount: (count) => set({ unreadCount: count }),
  markAllRead: () => set({ unreadCount: 0 }),
  setPreferences: (prefs) =>
    set((state) => ({
      preferences: { ...state.preferences, ...prefs },
    })),
}));

export default useNotificationStore;
