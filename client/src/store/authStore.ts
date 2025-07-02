import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { authService, LoginRequest, RegisterRequest } from '@/services/api';

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: Omit<RegisterRequest, 'password'> & { password: string }) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isLoading: false,
      
      login: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          const response = await authService.login(email, password);
          console.log('Response from login:', response); // Debug
          const { data } = response;
          const { accessToken: token, user } = data;
          
          // S'assurer que le token est bien stocké
          localStorage.setItem('auth-token', token);
          localStorage.setItem('velocitaleads-auth', JSON.stringify({ token, user }));
          
          set({ token, user, isLoading: false });
        } catch (error) {
          console.error('Login error:', error); // Debug
          set({ isLoading: false });
          throw error;
        }
      },
      
      register: async (userData) => {
        set({ isLoading: true });
        try {
          await authService.register(userData);
          set({ isLoading: false });
        } catch (error) {
          set({ isLoading: false });
          throw error;
        }
      },
      
      logout: () => {
        localStorage.removeItem('auth-token');
        localStorage.removeItem('velocitaleads-auth');
        set({ token: null, user: null });
      },
      
      setToken: (token: string) => {
        localStorage.setItem('auth-token', token);
        set({ token });
      },
      
      setUser: (user: User) => set({ user }),
    }),
    {
      name: 'velocitaleads-auth',
      partialize: (state) => ({ 
        token: state.token, 
        user: state.user 
      }),
    }
  )
);