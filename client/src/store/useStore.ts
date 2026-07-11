import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  display_name: string;
  role: 'developer' | 'mentor' | 'admin';
}

interface Project {
  id: string;
  title: string;
  description: string;
  vision: string;
  status: string;
  created_at: string;
  updated_at: string;
  member_role: string;
}

interface AppState {
  user: User | null;
  token: string | null;
  currentProject: Project | null;
  setUser: (user: User, token: string) => void;
  setCurrentProject: (project: Project) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  token: localStorage.getItem('pdna_token'),
  currentProject: null,
  setUser: (user, token) => {
    localStorage.setItem('pdna_token', token);
    set({ user, token });
  },
  setCurrentProject: (project) => set({ currentProject: project }),
  logout: () => {
    localStorage.removeItem('pdna_token');
    set({ user: null, token: null, currentProject: null });
  },
}));
