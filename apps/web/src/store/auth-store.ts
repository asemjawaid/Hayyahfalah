'use client';

import { create } from 'zustand';
import { supabase, signInWithEmail, signOut, type SupabaseUser } from '@/lib/supabase';
import { pullFromCloud, pushAllToCloud } from '@/lib/sync';
import { setSyncUser } from '@/lib/sync-user';

interface AuthState {
  user: SupabaseUser | null;
  isLoading: boolean;
  isSyncing: boolean;
  emailSent: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  resetEmailSent: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isSyncing: false,
  emailSent: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const user: SupabaseUser = { id: data.user.id, email: data.user.email ?? '' };
        setSyncUser(user.id);
        set({ user });
        // Pull latest data from cloud
        set({ isSyncing: true });
        await pullFromCloud(user.id);
        set({ isSyncing: false });
      }
    } catch {
      // No session — that's fine
    }
    set({ isLoading: false });

    // Listen for auth state changes (magic link callback)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user: SupabaseUser = { id: session.user.id, email: session.user.email ?? '' };
        setSyncUser(user.id);
        set({ user, emailSent: false });
        // First sign-in: push local data up, then pull cloud data down
        set({ isSyncing: true });
        await pushAllToCloud(user.id);
        await pullFromCloud(user.id);
        set({ isSyncing: false });
      } else if (event === 'SIGNED_OUT') {
        setSyncUser(null);
        set({ user: null });
      }
    });
  },

  sendMagicLink: async (email: string) => {
    set({ isLoading: true, error: null });
    const { error } = await signInWithEmail(email);
    if (error) {
      set({ error, isLoading: false });
    } else {
      set({ emailSent: true, isLoading: false });
    }
  },

  logout: async () => {
    await signOut();
    set({ user: null, emailSent: false });
  },

  resetEmailSent: () => set({ emailSent: false }),
}));
