/**
 * sync.ts — bidirectional sync between local Dexie DB and Supabase
 *
 * Strategy: local is source of truth while offline.
 * On sign-in, pull cloud → merge into local.
 * On any write, also write to Supabase (fire-and-forget when offline).
 */

import { supabase } from './supabase';
import { db } from './db';
import type { PrayerLog, QazaLedger, FastingLog, NightPrayerLog, UserProfile } from './db';

// ── User profile sync ────────────────────────────────────────────────────────

/** Push user profile to Supabase user_profiles table */
export async function pushUserProfile(profile: Partial<UserProfile>, userId: string): Promise<void> {
  // Only push meaningful profiles (onboarding completed or has location/name)
  if (!profile || (!profile.onboardingComplete && !profile.name && !profile.locationCity)) return;
  await supabase.from('user_profiles').upsert(
    { id: userId, profile_data: profile, updated_at: new Date().toISOString() },
    { onConflict: 'id' }
  );
}

/** Pull user profile from Supabase — returns null if none stored yet */
export async function pullUserProfile(userId: string): Promise<Partial<UserProfile> | null> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('profile_data')
    .eq('id', userId)
    .maybeSingle();
  if (error || !data) return null;
  return data.profile_data as Partial<UserProfile>;
}

// ── Push one prayer log to Supabase ─────────────────────────────────────────

export async function pushPrayerLog(log: PrayerLog, userId: string) {
  await supabase.from('prayer_logs').upsert({
    id: log.id,
    user_id: userId,
    date: log.date,
    prayer: log.prayer,
    status: log.status,
    reason: log.reason ?? null,
    note: log.note ?? null,
    logged_at: log.loggedAt,
    original_date: log.originalDate ?? null,
  }, { onConflict: 'id' });
}

export async function pushQazaLedger(ledger: QazaLedger, userId: string) {
  await supabase.from('qaza_ledger').upsert({
    user_id: userId,
    prayer: ledger.prayer,
    count: ledger.count,
    total_made_up: ledger.totalMadeUp,
    last_updated: ledger.lastUpdated,
  }, { onConflict: 'user_id,prayer' });
}

export async function pushFastingLog(log: FastingLog, userId: string) {
  await supabase.from('fasting_logs').upsert({
    id: log.id,
    user_id: userId,
    date: log.date,
    type: log.type,
    status: log.status,
    reason: log.reason ?? null,
    original_date: log.originalDate ?? null,
  }, { onConflict: 'id' });
}

export async function pushNightPrayerLog(log: NightPrayerLog, userId: string) {
  await supabase.from('night_prayer_logs').upsert({
    id: log.id,
    user_id: userId,
    date: log.date,
    type: log.type,
    rakats: log.rakats ?? null,
    completed: log.completed,
    note: log.note ?? null,
    logged_at: log.loggedAt,
  }, { onConflict: 'id' });
}

// ── Pull all cloud data → merge into local Dexie ────────────────────────────

/** Returns the cloud user profile if it exists (so caller can update user-store) */
export async function pullFromCloud(userId: string): Promise<Partial<UserProfile> | null> {
  try {
    // Prayer logs
    const { data: prayerLogs } = await supabase
      .from('prayer_logs')
      .select('*')
      .eq('user_id', userId);

    if (prayerLogs && prayerLogs.length > 0) {
      const mapped: PrayerLog[] = prayerLogs.map((r: any) => ({
        id: r.id,
        date: r.date,
        prayer: r.prayer,
        status: r.status,
        reason: r.reason ?? undefined,
        note: r.note ?? undefined,
        loggedAt: r.logged_at,
        originalDate: r.original_date ?? undefined,
      }));
      await db.prayerLog.bulkPut(mapped);
    }

    // Qaza ledger
    const { data: qaza } = await supabase
      .from('qaza_ledger')
      .select('*')
      .eq('user_id', userId);

    if (qaza && qaza.length > 0) {
      const mapped: QazaLedger[] = qaza.map((r: any) => ({
        prayer: r.prayer,
        count: r.count,
        totalMadeUp: r.total_made_up,
        lastUpdated: r.last_updated,
      }));
      await db.qazaLedger.bulkPut(mapped);
    }

    // Fasting logs
    const { data: fasting } = await supabase
      .from('fasting_logs')
      .select('*')
      .eq('user_id', userId);

    if (fasting && fasting.length > 0) {
      const mapped: FastingLog[] = fasting.map((r: any) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        status: r.status,
        reason: r.reason ?? undefined,
        originalDate: r.original_date ?? undefined,
      }));
      await db.fastingLog.bulkPut(mapped);
    }

    // Night prayer logs
    const { data: night } = await supabase
      .from('night_prayer_logs')
      .select('*')
      .eq('user_id', userId);

    if (night && night.length > 0) {
      const mapped: NightPrayerLog[] = night.map((r: any) => ({
        id: r.id,
        date: r.date,
        type: r.type,
        rakats: r.rakats ?? undefined,
        completed: r.completed,
        note: r.note ?? undefined,
        loggedAt: r.logged_at,
      }));
      await db.nightPrayerLog.bulkPut(mapped);
    }
    // User profile — pull and merge into Dexie too
    const cloudProfile = await pullUserProfile(userId);
    if (cloudProfile && cloudProfile.onboardingComplete) {
      // Merge: cloud profile wins for settings, keep local ID
      const existing = await db.userProfile.get('local');
      await db.userProfile.put({ ...existing, ...cloudProfile, id: 'local' } as UserProfile);
      return cloudProfile;
    }

    return null;
  } catch (e) {
    // Sync failure is non-fatal — local data is the source of truth
    console.warn('[sync] pull failed:', e);
    return null;
  }
}

// ── Push all local data → cloud (used on first sign-in) ─────────────────────

export async function pushAllToCloud(userId: string): Promise<void> {
  try {
    const [prayerLogs, qaza, fasting, night, profile] = await Promise.all([
      db.prayerLog.toArray(),
      db.qazaLedger.toArray(),
      db.fastingLog.toArray(),
      db.nightPrayerLog.toArray(),
      db.userProfile.get('local'),
    ]);

    await Promise.allSettled([
      ...prayerLogs.map(l => pushPrayerLog(l, userId)),
      ...qaza.map(l => pushQazaLedger(l, userId)),
      ...fasting.map(l => pushFastingLog(l, userId)),
      ...night.map(l => pushNightPrayerLog(l, userId)),
      ...(profile ? [pushUserProfile(profile, userId)] : []),
    ]);
  } catch (e) {
    console.warn('[sync] push all failed:', e);
  }
}
