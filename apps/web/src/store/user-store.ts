'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile, Theme, ColorMode, Madhab, Terminology, Gender } from '@/lib/db';

interface UserState {
  profile: Partial<UserProfile> | null;
  isLoaded: boolean;

  setProfile: (p: Partial<UserProfile>) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;
  completeOnboarding: () => void;
  reset: () => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      profile: null,
      isLoaded: false,

      setProfile: (p) => set({ profile: p, isLoaded: true }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: { ...state.profile, ...updates, updatedAt: new Date().toISOString() },
        })),

      completeOnboarding: () =>
        set((state) => ({
          profile: {
            ...state.profile,
            onboardingComplete: true,
            updatedAt: new Date().toISOString(),
          },
        })),

      reset: () => set({ profile: null, isLoaded: false }),
    }),
    {
      name: 'hayya-falah-user',
      onRehydrateStorage: () => (state) => {
        if (state) state.isLoaded = true;
      },
    }
  )
);

export const defaultProfile: Partial<UserProfile> = {
  id: 'local',
  language: 'en',
  terminology: 'arabic',
  theme: 'fajr_dark',
  colorMode: 'dark',
  madhab: 'shafii',
  calculationMethod: 'MuslimWorldLeague',
  onboardingComplete: false,
};
