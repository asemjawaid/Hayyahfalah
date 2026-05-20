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
        // Ensure profile row exists in Supabase
        upsertProfile(data.user.id, data.user.email ?? '');
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
        // Ensure profile row exists
        upsertProfile(session.user.id, session.user.email ?? '');
        // Clear skip flag now that user has signed in
        if (typeof window !== 'undefined') localStorage.removeItem('auth_skipped');
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
    // Remove skip flag so next open prompts sign-in again
    if (typeof window !== 'undefined') localStorage.removeItem('auth_skipped');
    set({ user: null, emailSent: false });
  },

  resetEmailSent: () => set({ emailSent: false }),
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
