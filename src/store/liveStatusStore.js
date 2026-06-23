import { create } from 'zustand';

const useLiveStatusStore = create((set) => ({
  liveStatuses: {},

  setLiveStatus: (uid, status) =>
    set((state) => ({
      liveStatuses: { ...state.liveStatuses, [uid]: status },
    })),

  clearAllLiveStatuses: () => set({ liveStatuses: {} }),
}));

export default useLiveStatusStore;
