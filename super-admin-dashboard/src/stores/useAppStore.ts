import { create } from 'zustand';

interface DashboardState {
  isSidebarCollapsed: boolean;
  globalSearch: string;
  toggleSidebar: () => void;
  setGlobalSearch: (q: string) => void;
}

export const useAppStore = create<DashboardState>((set) => ({
  isSidebarCollapsed: false,
  globalSearch: '',
  toggleSidebar: () => set((s) => ({ isSidebarCollapsed: !s.isSidebarCollapsed })),
  setGlobalSearch: (q) => set({ globalSearch: q }),
}));
