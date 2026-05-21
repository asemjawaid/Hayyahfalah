'use client';

import { create } from 'zustand';
import { supabase, signInWithPassword, signUpWithPassword, signInWithGoogle as _signInWithGoogle, signOut, type SupabaseUser } from '@/lib/supabase';
import { pullFromCloud, pushAllToCloud } from '@/lib/sync';
import { setSyncUser } from '@/lib/sync-user';
import { useUserStore } from '@/store/user-store';

interface AuthState {
  user: SupabaseUser | null;
  isLoading: boolean;
  isSyncing: boolean;
  error: string | null;

  initialize: () => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isSyncing: false,
  error: null,

  initialize: async () => {
    set({ isLoading: true });
    try {
      const { data } = await supabase.auth.getUser();
      if (data.user) {
        const user: SupabaseUser = { id: data.user.id, email: data.user.email ?? '' };
        setSyncUser(user.id);
        set({ user });
        // Pull latest cloud data and apply profile to user-store
        set({ isSyncing: true });
        const cloudProfile = await pullFromCloud(user.id);
        if (cloudProfile) useUserStore.getState().setProfile({ ...cloudProfile, id: 'local' });
        set({ isSyncing: false });
        upsertProfile(data.user.id, data.user.email ?? '');
      }
    } catch {
      // No session — that's fine
    }
    set({ isLoading: false });

    // Listen for sign-in/out events (covers OAuth callback, password sign-in)
    supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const user: SupabaseUser = { id: session.user.id, email: session.user.email ?? '' };
        setSyncUser(user.id);
        set({ user });
        // Push local data first, then pull cloud (so new device gets cloud profile)
        set({ isSyncing: true });
        await pushAllToCloud(user.id);
        const cloudProfile = await pullFromCloud(user.id);
        if (cloudProfile) useUserStore.getState().setProfile({ ...cloudProfile, id: 'local' });
        set({ isSyncing: false });
        upsertProfile(session.user.id, session.user.email ?? '');
        if (typeof window !== 'undefined') localStorage.removeItem('auth_skipped');
      } else if (event === 'SIGNED_OUT') {
        setSyncUser(null);
        set({ user: null });
      }
    });
  },

  signIn: async (email, password) => {
    set({ isLoading: true, error: null });
    const { error } = await signInWithPassword(email, password);
    // Session set — onAuthStateChange handles the rest
    if (error) set({ error, isLoading: false });
    else set({ isLoading: false });
  },

  signUp: async (email, password) => {
    set({ isLoading: true, error: null });
    const { error } = await signUpWithPassword(email, password);
    // Auto-confirmed — session is set immediately via onAuthStateChange
    if (error) set({ error, isLoading: false });
    else set({ isLoading: false });
  },

  signInWithGoogle: async () => {
    set({ error: null });
    const { error } = await _signInWithGoogle();
    if (error) set({ error });
    // OAuth redirect — page reloads on return; onAuthStateChange handles session
  },

  logout: async () => {
    await signOut();
    if (typeof window !== 'undefined') localStorage.removeItem('auth_skipped');
    set({ user: null });
  },
}));

/** Fire-and-forget: ensure a row in `profiles` table exists for this user */
function upsertProfile(userId: string, email: string): void {
  // First 8 hex chars of the UUID — shareable profile code
  const profileCode = userId.replace(/-/g, '').slice(0, 8).toUpperCase();
  void (async () => {
    try {
      await supabase
        .from('profiles')
        .upsert(
          { id: userId, email, profile_code: profileCode, updated_at: new Date().toISOString() },
          { onConflict: 'id', ignoreDuplicates: false }
        );
    } catch {
      // Best-effort — non-critical
    }
  })();
}

/** Get the current user's shareable profile code (first 8 chars of UUID) */
export function getProfileCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
}
