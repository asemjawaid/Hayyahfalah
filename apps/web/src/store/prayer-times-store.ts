'use client';

import { create } from 'zustand';
import type { PrayerTimesResult } from '@/lib/prayer-engine';
import { calculatePrayerTimes, getCurrentPrayer, getNextPrayer, getTimeUntil } from '@/lib/prayer-engine';
import type { CalculationMethodKey } from '@/lib/prayer-engine';

interface PrayerTimesState {
  times: PrayerTimesResult | null;
  currentPrayer: string | null;
  nextPrayer: { name: string; time: Date } | null;
  countdown: string;
  isLocating: boolean;
  locationError: string | null;
  lat: number | null;
  lng: number | null;
  city: string | null;
  method: CalculationMethodKey;
  madhab: 'shafi' | 'hanafi';

  locate: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, city?: string) => void;
  setCalculationSettings: (method: CalculationMethodKey, madhab: 'shafi' | 'hanafi') => void;
  recalculate: () => void;
  tick: () => void;
}

function readSettingsFromStorage(): { method: CalculationMethodKey; madhab: 'shafi' | 'hanafi' } {
  try {
    if (typeof localStorage === 'undefined') return { method: 'MuslimWorldLeague', madhab: 'shafi' };
    const stored = localStorage.getItem('hayya-falah-user');
    if (!stored) return { method: 'MuslimWorldLeague', madhab: 'shafi' };
    const parsed = JSON.parse(stored);
    const profile = parsed?.state?.profile;
    return {
      method: (profile?.calculationMethod as CalculationMethodKey) ?? 'MuslimWorldLeague',
      madhab: profile?.madhab === 'hanafi' ? 'hanafi' : 'shafi',
    };
  } catch {
    return { method: 'MuslimWorldLeague', madhab: 'shafi' };
  }
}

export const usePrayerTimesStore = create<PrayerTimesState>((set, get) => ({
  times: null,
  currentPrayer: null,
  nextPrayer: null,
  countdown: '',
  isLocating: false,
  locationError: null,
  lat: null,
  lng: null,
  city: null,
  method: 'MuslimWorldLeague',
  madhab: 'shafi',

  locate: () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({ locationError: 'Geolocation not supported', isLocating: false });
      return Promise.resolve();
    }
    set({ isLocating: true, locationError: null });
    return new Promise<void>((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          set({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            isLocating: false,
          });
          get().recalculate();
          resolve();
        },
        (err) => {
          set({ isLocating: false, locationError: err.message });
          resolve();
        },
        { timeout: 10000, enableHighAccuracy: false }
      );
    });
  },

  setManualLocation: (lat, lng, city) => {
    set({ lat, lng, city });
    get().recalculate();
  },

  setCalculationSettings: (method, madhab) => {
    set({ method, madhab });
    get().recalculate();
  },

  recalculate: () => {
    const state = get();
    const { lat, lng } = state;
    if (lat === null || lng === null) return;

    // Use store values if explicitly set, otherwise fall back to localStorage
    const stored = readSettingsFromStorage();
    const method = state.method !== 'MuslimWorldLeague' ? state.method : stored.method;
    const madhab = state.madhab !== 'shafi' ? state.madhab : stored.madhab;

    const times = calculatePrayerTimes({ lat, lng, method, madhab });
    const now = new Date();
    const currentPrayer = getCurrentPrayer(times, now);
    const nextPrayer = getNextPrayer(times, now);
    const countdown = nextPrayer ? getTimeUntil(nextPrayer.time, now) : '';

    set({ times, currentPrayer, nextPrayer, countdown, method, madhab });
  },

  tick: () => {
    const { times } = get();
    if (!times) return;
    const now = new Date();
    const currentPrayer = getCurrentPrayer(times, now);
    const nextPrayer = getNextPrayer(times, now);
    const countdown = nextPrayer ? getTimeUntil(nextPrayer.time, now) : '';
    set({ currentPrayer, nextPrayer, countdown });
  },
}));
