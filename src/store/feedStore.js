import { create } from 'zustand';

const useFeedStore = create((set) => ({
  posts: [],
  shouldRefresh: false,
  setPosts: (posts) => set({ posts }),
  appendPosts: (newPosts) =>
    set((state) => ({
      posts: [...state.posts, ...newPosts],
    })),
  updatePost: (postId, updates) =>
    set((state) => ({
      posts: state.posts.map((p) => (p.id === postId ? { ...p, ...updates } : p)),
    })),
  clearPosts: () => set({ posts: [] }),
  triggerRefresh: () => set({ shouldRefresh: true }),
  clearRefresh: () => set({ shouldRefresh: false }),
}));

export default useFeedStore;
