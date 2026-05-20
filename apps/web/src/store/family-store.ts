'use client';

import { create } from 'zustand';
import {
  getMemberProfiles, addMemberProfile, deleteMemberProfile,
  getMemberPrayerLogsForDate, logMemberPrayer as dbLogMemberPrayer,
} from '@/lib/db';
import type { MemberProfile, MemberPrayerLog, PrayerName, PrayerStatus } from '@/lib/db';

interface FamilyState {
  profiles: MemberProfile[];
  memberLogs: Record<string, Partial<Record<PrayerName, MemberPrayerLog>>>;
  isLoading: boolean;

  loadProfiles: () => Promise<void>;
  addProfile: (data: Omit<MemberProfile, 'id' | 'createdAt'>) => Promise<string>;
  removeProfile: (id: string) => Promise<void>;
  loadLogsForDate: (profileId: string, date: string) => Promise<void>;
  logPrayer: (profileId: string, prayer: PrayerName, status: PrayerStatus, date: string) => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  profiles: [],
  memberLogs: {},
  isLoading: false,

  loadProfiles: async () => {
    set({ isLoading: true });
    const profiles = await getMemberProfiles();
    set({ profiles, isLoading: false });
  },

  addProfile: async (data) => {
    const id = await addMemberProfile(data);
    await get().loadProfiles();
    return id;
  },

  removeProfile: async (id) => {
    await deleteMemberProfile(id);
    const updated = { ...get().memberLogs };
    delete updated[id];
    set({ memberLogs: updated });
    await get().loadProfiles();
  },

  loadLogsForDate: async (profileId, date) => {
    const logs = await getMemberPrayerLogsForDate(profileId, date);
    const map: Partial<Record<PrayerName, MemberPrayerLog>> = {};
    for (const log of logs) map[log.prayer] = log;
    set(s => ({ memberLogs: { ...s.memberLogs, [profileId]: map } }));
  },

  logPrayer: async (profileId, prayer, status, date) => {
    await dbLogMemberPrayer({ profileId, prayer, status, date });
    await get().loadLogsForDate(profileId, date);
  },
}));
