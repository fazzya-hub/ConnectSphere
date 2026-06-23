import { create } from 'zustand';

const useSocialStore = create((set) => ({
  followingIds: [],
  setFollowingIds: (ids) => set({ followingIds: ids }),
}));

export default useSocialStore;
