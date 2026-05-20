'use client';

import { create } from 'zustand';
import type { PrayerLog, PrayerName, PrayerStatus, QazaLedger } from '@/lib/db';
import { logPrayer, getPrayerLogsForDate, getQazaLedger, adjustQaza } from '@/lib/db';
import { todayString, generateId } from '@/lib/utils';

interface PrayerState {
  todayLogs: Partial<Record<PrayerName, PrayerLog>>;
  qazaLedger: Partial<Record<PrayerName, QazaLedger>>;
  selectedDate: string;
  isLoading: boolean;

  loadForDate: (date: string) => Promise<void>;
  logPrayer: (prayer: PrayerName, status: PrayerStatus, extras?: Partial<PrayerLog>) => Promise<void>;
  loadQaza: () => Promise<void>;
  setSelectedDate: (date: string) => void;
}

export const usePrayerStore = create<PrayerState>((set, get) => ({
  todayLogs: {},
  qazaLedger: {},
  selectedDate: todayString(),
  isLoading: false,

  loadForDate: async (date: string) => {
    set({ isLoading: true });
    const logs = await getPrayerLogsForDate(date);
    const map: Partial<Record<PrayerName, PrayerLog>> = {};
    for (const log of logs) map[log.prayer] = log;
    set({ todayLogs: map, selectedDate: date, isLoading: false });
  },

  logPrayer: async (prayer, status, extras = {}) => {
    const date = get().selectedDate;
    await logPrayer({
      prayer,
      status,
      date,
      ...extras,
    });
    await get().loadForDate(date);
    await get().loadQaza();
  },

  loadQaza: async () => {
    const ledger = await getQazaLedger();
    set({ qazaLedger: ledger });
  },

  setSelectedDate: (date) => {
    set({ selectedDate: date });
    get().loadForDate(date);
  },
}));
