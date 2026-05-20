import Dexie, { type Table } from 'dexie';

export type PrayerStatus =
  | 'on_time'
  | 'late'
  | 'jamaah'
  | 'jamaah_home'
  | 'qaza'
  | 'missed'
  | 'excused';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type NightPrayerType = 'tahajjud' | 'witr' | 'taraweeh' | 'qiyam' | 'duha';

export type FastType = 'ramadan' | 'sunnah' | 'makeup' | 'voluntary' | 'nadhr';
export type FastStatus = 'completed' | 'partial' | 'broken' | 'excused';

export type ZakatAssetCategory =
  | 'cash' | 'gold' | 'silver' | 'stocks' | 'crypto'
  | 'business' | 'receivables' | 'real_estate' | 'retirement';
export type ZakatLiabilityCategory = 'mortgage' | 'loan' | 'credit_card' | 'other';
export type ZakatRecipientCategory =
  | 'poor' | 'needy' | 'collector' | 'heart_inclined'
  | 'freeing_captive' | 'debtor' | 'in_path_of_allah' | 'traveler';

export type Gender = 'female' | 'male' | 'not_specified';
export type Madhab = 'hanafi' | 'shafii' | 'maliki' | 'hanbali' | 'jafari';
export type Theme =
  | 'fajr_dark'
  | 'fajr_light'
  | 'midnight_dark'
  | 'midnight_light'
  | 'verdant_dark'
  | 'verdant_light'
  | 'clay_dark'
  | 'clay_light';
export type ColorMode = 'dark' | 'light' | 'auto';
export type Terminology = 'arabic' | 'urdu' | 'indonesian' | 'malay' | 'turkish';

export interface UserProfile {
  id: string;
  name?: string;
  gender?: Gender;
  dateOfBirth?: string;
  pubertyDate?: string;
  prayerStartDate?: string;
  language: string;
  terminology: Terminology;
  theme: Theme;
  colorMode: ColorMode;
  madhab: Madhab;
  calculationMethod: string;
  locationLat?: number;
  locationLng?: number;
  locationCity?: string;
  locationCountry?: string;
  onboardingComplete: boolean;
  womensModeEnabled?: boolean;
  pregnancyMode?: boolean;
  breastfeedingMode?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface PrayerLog {
  id: string;
  date: string;
  prayer: PrayerName;
  status: PrayerStatus;
  reason?: string;
  locationMasjidId?: string;
  note?: string;
  loggedAt: string;
  originalDate?: string;
}

export interface QazaLedger {
  prayer: PrayerName;
  count: number;
  totalMadeUp: number;
  lastUpdated: string;
}

export interface CycleLog {
  id: string;
  startDate: string;
  endDate?: string;
  notes?: string;
}

export interface FastingLog {
  id: string;
  date: string;
  type: FastType;
  status: FastStatus;
  reason?: string;
  originalDate?: string;
}

export interface NightPrayerLog {
  id: string;
  date: string;
  type: NightPrayerType;
  rakats?: number;
  completed: boolean;
  note?: string;
  loggedAt: string;
}

export interface ZakatAsset {
  id: string;
  category: ZakatAssetCategory;
  label?: string;
  value: number;
  currency: string;
  weightGrams?: number;
  notes?: string;
  addedAt: string;
}

export interface ZakatLiability {
  id: string;
  category: ZakatLiabilityCategory;
  label?: string;
  value: number;
  currency: string;
  notes?: string;
}

export interface ZakatPayment {
  id: string;
  paidDate: string;
  amount: number;
  currency: string;
  recipientCategory?: ZakatRecipientCategory;
  recipientNote?: string;
  hawlYear?: number;
  loggedAt: string;
}

export type MemberRelationship = 'child' | 'student' | 'spouse' | 'sibling' | 'parent' | 'other';

export interface MemberProfile {
  id: string;
  name: string;
  emoji: string;
  relationship: MemberRelationship;
  gender: Gender;
  createdAt: string;
}

export interface MemberPrayerLog {
  id: string;
  profileId: string;
  date: string;
  prayer: PrayerName;
  status: PrayerStatus;
  loggedAt: string;
  note?: string;
}

export interface SavedMasjid {
  masjidId: string;
  isHome: boolean;
  savedAt: string;
}

export interface AppSetting {
  key: string;
  value: string;
}

export class HayyaFalahDB extends Dexie {
  userProfile!: Table<UserProfile>;
  prayerLog!: Table<PrayerLog>;
  qazaLedger!: Table<QazaLedger>;
  cycleLog!: Table<CycleLog>;
  fastingLog!: Table<FastingLog>;
  nightPrayerLog!: Table<NightPrayerLog>;
  zakatAssets!: Table<ZakatAsset>;
  zakatLiabilities!: Table<ZakatLiability>;
  zakatPayments!: Table<ZakatPayment>;
  savedMasjids!: Table<SavedMasjid>;
  settings!: Table<AppSetting>;
  memberProfiles!: Table<MemberProfile>;
  memberPrayerLog!: Table<MemberPrayerLog>;

  constructor() {
    super('HayyaFalahDB');
    this.version(1).stores({
      userProfile: 'id',
      prayerLog: 'id, date, prayer, status, loggedAt',
      qazaLedger: 'prayer',
      cycleLog: 'id, startDate',
      fastingLog: 'id, date, type',
      savedMasjids: 'masjidId',
      settings: 'key',
    });
    this.version(2).stores({
      userProfile: 'id',
      prayerLog: 'id, date, prayer, status, loggedAt',
      qazaLedger: 'prayer',
      cycleLog: 'id, startDate',
      fastingLog: 'id, date, type',
      nightPrayerLog: 'id, date, type, loggedAt',
      zakatAssets: 'id, category, addedAt',
      zakatLiabilities: 'id, category',
      zakatPayments: 'id, paidDate',
      savedMasjids: 'masjidId',
      settings: 'key',
    });
    this.version(3).stores({
      userProfile: 'id',
      prayerLog: 'id, date, prayer, status, loggedAt',
      qazaLedger: 'prayer',
      cycleLog: 'id, startDate',
      fastingLog: 'id, date, type',
      nightPrayerLog: 'id, date, type, loggedAt',
      zakatAssets: 'id, category, addedAt',
      zakatLiabilities: 'id, category',
      zakatPayments: 'id, paidDate',
      savedMasjids: 'masjidId',
      settings: 'key',
      memberProfiles: 'id, createdAt',
      memberPrayerLog: 'id, profileId, date, [profileId+date]',
    });
  }
}

export const db = new HayyaFalahDB();

export async function getProfile(): Promise<UserProfile | undefined> {
  return db.userProfile.get('local');
}

export async function saveProfile(profile: Partial<UserProfile>): Promise<void> {
  const existing = await getProfile();
  const now = new Date().toISOString();
  await db.userProfile.put({
    id: 'local',
    language: 'en',
    terminology: 'arabic',
    theme: 'fajr_dark',
    colorMode: 'dark',
    madhab: 'shafii',
    calculationMethod: 'MuslimWorldLeague',
    onboardingComplete: false,
    createdAt: now,
    ...existing,
    ...profile,
    updatedAt: now,
  });
}

export async function getPrayerLogsForDate(date: string): Promise<PrayerLog[]> {
  return db.prayerLog.where('date').equals(date).toArray();
}

export async function logPrayer(log: Omit<PrayerLog, 'id' | 'loggedAt'>): Promise<void> {
  const existing = await db.prayerLog
    .where('date').equals(log.date)
    .and(l => l.prayer === log.prayer)
    .first();

  const now = new Date().toISOString();
  const entry: PrayerLog = {
    id: existing?.id ?? crypto.randomUUID(),
    loggedAt: now,
    ...log,
  };

  await db.prayerLog.put(entry);

  if (existing) {
    await adjustQaza(log.prayer, existing.status, log.status);
  } else {
    await adjustQaza(log.prayer, null, log.status);
  }

  // Fire-and-forget cloud sync
  try {
    const { getSyncUser } = await import('./sync-user');
    const userId = getSyncUser();
    if (userId) {
      const { pushPrayerLog, pushQazaLedger } = await import('./sync');
      pushPrayerLog(entry, userId).catch(() => {});
      const ledger = await db.qazaLedger.get(log.prayer);
      if (ledger) pushQazaLedger(ledger, userId).catch(() => {});
    }
  } catch {}
}

export async function adjustQaza(
  prayer: PrayerName,
  oldStatus: PrayerStatus | null,
  newStatus: PrayerStatus
): Promise<void> {
  const existing = await db.qazaLedger.get(prayer);
  const current: QazaLedger = existing ?? {
    prayer,
    count: 0,
    totalMadeUp: 0,
    lastUpdated: new Date().toISOString(),
  };

  let delta = 0;
  let madUpDelta = 0;

  if (oldStatus === 'missed') delta--;
  if (oldStatus === 'qaza') { delta++; madUpDelta--; }

  if (newStatus === 'missed') delta++;
  if (newStatus === 'qaza') { delta--; madUpDelta++; }

  await db.qazaLedger.put({
    ...current,
    count: Math.max(0, current.count + delta),
    totalMadeUp: Math.max(0, current.totalMadeUp + madUpDelta),
    lastUpdated: new Date().toISOString(),
  });
}

export async function getQazaLedger(): Promise<Record<PrayerName, QazaLedger>> {
  const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  const result: Partial<Record<PrayerName, QazaLedger>> = {};
  for (const p of prayers) {
    result[p] = (await db.qazaLedger.get(p)) ?? {
      prayer: p, count: 0, totalMadeUp: 0, lastUpdated: new Date().toISOString(),
    };
  }
  return result as Record<PrayerName, QazaLedger>;
}

export async function getNightPrayersForDate(date: string): Promise<NightPrayerLog[]> {
  return db.nightPrayerLog.where('date').equals(date).toArray();
}

export async function logNightPrayer(log: Omit<NightPrayerLog, 'id' | 'loggedAt'>): Promise<void> {
  const existing = await db.nightPrayerLog
    .where('date').equals(log.date)
    .and(l => l.type === log.type)
    .first();
  const now = new Date().toISOString();
  await db.nightPrayerLog.put({
    id: existing?.id ?? crypto.randomUUID(),
    loggedAt: now,
    ...log,
  });
}

export async function getFastingLogsForMonth(year: number, month: number): Promise<FastingLog[]> {
  const start = `${year}-${String(month).padStart(2, '0')}-01`;
  const end = `${year}-${String(month).padStart(2, '0')}-31`;
  return db.fastingLog.where('date').between(start, end, true, true).toArray();
}

export async function logFast(log: Omit<FastingLog, 'id'>): Promise<void> {
  const existing = await db.fastingLog.where('date').equals(log.date).first();
  await db.fastingLog.put({
    id: existing?.id ?? crypto.randomUUID(),
    ...log,
  });
}

export async function getActiveCycle(): Promise<CycleLog | undefined> {
  return db.cycleLog.filter(c => !c.endDate).last();
}

export async function startCycle(startDate: string, notes?: string): Promise<void> {
  await db.cycleLog.put({ id: crypto.randomUUID(), startDate, notes });
}

export async function endCycle(id: string, endDate: string): Promise<void> {
  const existing = await db.cycleLog.get(id);
  if (existing) await db.cycleLog.put({ ...existing, endDate });
}

export async function getZakatAssets(): Promise<ZakatAsset[]> {
  return db.zakatAssets.orderBy('addedAt').toArray();
}

export async function addZakatAsset(asset: Omit<ZakatAsset, 'id' | 'addedAt'>): Promise<void> {
  await db.zakatAssets.put({ id: crypto.randomUUID(), addedAt: new Date().toISOString(), ...asset });
}

export async function deleteZakatAsset(id: string): Promise<void> {
  await db.zakatAssets.delete(id);
}

export async function getZakatLiabilities(): Promise<ZakatLiability[]> {
  return db.zakatLiabilities.toArray();
}

export async function addZakatLiability(liability: Omit<ZakatLiability, 'id'>): Promise<void> {
  await db.zakatLiabilities.put({ id: crypto.randomUUID(), ...liability });
}

export async function deleteZakatLiability(id: string): Promise<void> {
  await db.zakatLiabilities.delete(id);
}

export async function getZakatPayments(): Promise<ZakatPayment[]> {
  return db.zakatPayments.orderBy('paidDate').reverse().toArray();
}

export async function logZakatPayment(payment: Omit<ZakatPayment, 'id' | 'loggedAt'>): Promise<void> {
  await db.zakatPayments.put({ id: crypto.randomUUID(), loggedAt: new Date().toISOString(), ...payment });
}

// ── Member profiles ───────────────────────────────────────────────────────────

export async function getMemberProfiles(): Promise<MemberProfile[]> {
  return db.memberProfiles.orderBy('createdAt').toArray();
}

export async function addMemberProfile(p: Omit<MemberProfile, 'id' | 'createdAt'>): Promise<string> {
  const id = crypto.randomUUID();
  await db.memberProfiles.put({ id, createdAt: new Date().toISOString(), ...p });
  return id;
}

export async function deleteMemberProfile(id: string): Promise<void> {
  await db.memberProfiles.delete(id);
  await db.memberPrayerLog.where('profileId').equals(id).delete();
}

export async function getMemberPrayerLogsForDate(profileId: string, date: string): Promise<MemberPrayerLog[]> {
  return db.memberPrayerLog
    .where('[profileId+date]').equals([profileId, date])
    .toArray();
}

export async function logMemberPrayer(log: Omit<MemberPrayerLog, 'id' | 'loggedAt'>): Promise<void> {
  const existing = await db.memberPrayerLog
    .where('profileId').equals(log.profileId)
    .and(l => l.date === log.date && l.prayer === log.prayer)
    .first();
  await db.memberPrayerLog.put({
    id: existing?.id ?? crypto.randomUUID(),
    loggedAt: new Date().toISOString(),
    ...log,
  });
}

// ── Streak ────────────────────────────────────────────────────────────────────

export async function getPrayerStreak(): Promise<number> {
  const allLogs = await db.prayerLog.orderBy('date').reverse().toArray();
  const dates = [...new Set(allLogs.map(l => l.date))].sort().reverse();
  if (dates.length === 0) return 0;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86_400_000).toISOString().split('T')[0];
  if (dates[0] !== today && dates[0] !== yesterday) return 0;

  let streak = 0;
  const cursor = new Date(dates[0]);
  for (const date of dates) {
    if (date === cursor.toISOString().split('T')[0]) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
}

export async function getSetting(key: string): Promise<string | undefined> {
  const s = await db.settings.get(key);
  return s?.value;
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.settings.put({ key, value });
}
