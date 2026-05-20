'use client';

import { create } from 'zustand';
import type { PrayerTimesResult } from '@hayyafalah/prayer-engine';
import { calculatePrayerTimes, getCurrentPrayer, getNextPrayer, getTimeUntil, formatPrayerTime } from '@hayyafalah/prayer-engine';
import type { CalculationMethodKey } from '@hayyafalah/prayer-engine';

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

  locate: () => Promise<void>;
  setManualLocation: (lat: number, lng: number, city?: string) => void;
  recalculate: () => void;
  tick: () => void;
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

  locate: async () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      set({ locationError: 'Geolocation not supported' });
      return;
    }
    set({ isLocating: true, locationError: null });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          isLocating: false,
        });
        get().recalculate();
      },
      (err) => {
        set({ isLocating: false, locationError: err.message });
      },
      { timeout: 10000 }
    );
  },

  setManualLocation: (lat, lng, city) => {
    set({ lat, lng, city });
    get().recalculate();
  },

  recalculate: () => {
    const { lat, lng } = get();
    if (lat === null || lng === null) return;

    const stored = typeof localStorage !== 'undefined'
      ? localStorage.getItem('hayya-falah-user')
      : null;
    let method: CalculationMethodKey = 'MuslimWorldLeague';
    let madhab: 'shafi' | 'hanafi' = 'shafi';
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const profile = parsed?.state?.profile;
        if (profile?.calculationMethod) method = profile.calculationMethod as CalculationMethodKey;
        if (profile?.madhab === 'hanafi') madhab = 'hanafi';
      } catch {}
    }

    const times = calculatePrayerTimes({ lat, lng, method, madhab });
    const now = new Date();
    const currentPrayer = getCurrentPrayer(times, now);
    const nextPrayer = getNextPrayer(times, now);
    const countdown = nextPrayer ? getTimeUntil(nextPrayer.time, now) : '';

    set({ times, currentPrayer, nextPrayer, countdown });
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
