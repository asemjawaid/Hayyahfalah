import {
  PrayerTimes,
  Coordinates,
  CalculationMethod,
  CalculationParameters,
  Madhab,
  Prayer,
  SunnahTimes,
  Qibla,
  HighLatitudeRule,
} from 'adhan';

export type PrayerName = 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';
export type AllPrayerName = PrayerName | 'sunrise';

export type CalculationMethodKey =
  | 'MuslimWorldLeague'
  | 'ISNA'
  | 'Egyptian'
  | 'UmmAlQura'
  | 'Karachi'
  | 'Tehran'
  | 'Singapore'
  | 'Kuwait'
  | 'Qatar'
  | 'Dubai'
  | 'MoonsightingCommittee'
  | 'Turkey'
  | 'Custom';

export type MadhabKey = 'shafi' | 'hanafi';

export type HighLatitudeRuleKey =
  | 'MiddleOfTheNight'
  | 'SeventhOfTheNight'
  | 'TwilightAngle';

export interface PrayerTimesResult {
  fajr: Date;
  sunrise: Date;
  dhuhr: Date;
  asr: Date;
  maghrib: Date;
  isha: Date;
  midnight: Date;
}

export interface PrayerOffset {
  fajr?: number;
  dhuhr?: number;
  asr?: number;
  maghrib?: number;
  isha?: number;
}

export interface PrayerEngineOptions {
  lat: number;
  lng: number;
  date?: Date;
  method?: CalculationMethodKey;
  madhab?: MadhabKey;
  highLatitudeRule?: HighLatitudeRuleKey;
  offsets?: PrayerOffset;
  fajrAngle?: number;
  ishaAngle?: number;
}

const METHOD_MAP: Record<CalculationMethodKey, () => CalculationParameters> = {
  MuslimWorldLeague: CalculationMethod.MuslimWorldLeague,
  ISNA: CalculationMethod.NorthAmerica,
  Egyptian: CalculationMethod.Egyptian,
  UmmAlQura: CalculationMethod.UmmAlQura,
  Karachi: CalculationMethod.Karachi,
  Tehran: CalculationMethod.Tehran,
  Singapore: CalculationMethod.Singapore,
  Kuwait: CalculationMethod.Kuwait,
  Qatar: CalculationMethod.Qatar,
  Dubai: CalculationMethod.Dubai,
  MoonsightingCommittee: CalculationMethod.MoonsightingCommittee,
  Turkey: CalculationMethod.Turkey,
  Custom: CalculationMethod.Other,
};

export const CALCULATION_METHOD_LABELS: Record<CalculationMethodKey, string> = {
  MuslimWorldLeague: 'Muslim World League',
  ISNA: 'Islamic Society of North America',
  Egyptian: 'Egyptian General Authority of Survey',
  UmmAlQura: 'Umm al-Qura University, Makkah',
  Karachi: 'University of Islamic Sciences, Karachi',
  Tehran: 'Institute of Geophysics, Tehran',
  Singapore: 'Majlis Ugama Islam Singapura',
  Kuwait: 'Kuwait',
  Qatar: 'Qatar',
  Dubai: 'Dubai (UAE)',
  MoonsightingCommittee: 'Moonsighting Committee Worldwide',
  Turkey: 'Diyanet (Turkey)',
  Custom: 'Custom',
};

export function getDefaultMethodForCountry(countryCode: string): CalculationMethodKey {
  const map: Record<string, CalculationMethodKey> = {
    SA: 'UmmAlQura',
    AE: 'Dubai',
    BH: 'Kuwait',
    KW: 'Kuwait',
    QA: 'Qatar',
    OM: 'UmmAlQura',
    YE: 'UmmAlQura',
    US: 'ISNA',
    CA: 'ISNA',
    PK: 'Karachi',
    IN: 'Karachi',
    BD: 'Karachi',
    EG: 'Egyptian',
    SY: 'Egyptian',
    JO: 'Egyptian',
    LB: 'Egyptian',
    PS: 'Egyptian',
    TR: 'Turkey',
    ID: 'Singapore',
    MY: 'Singapore',
    SG: 'Singapore',
    IR: 'Tehran',
  };
  return map[countryCode] ?? 'MuslimWorldLeague';
}

function applyOffsets(times: PrayerTimesResult, offsets: PrayerOffset): PrayerTimesResult {
  const result = { ...times };
  if (offsets.fajr) result.fajr = new Date(result.fajr.getTime() + offsets.fajr * 60000);
  if (offsets.dhuhr) result.dhuhr = new Date(result.dhuhr.getTime() + offsets.dhuhr * 60000);
  if (offsets.asr) result.asr = new Date(result.asr.getTime() + offsets.asr * 60000);
  if (offsets.maghrib) result.maghrib = new Date(result.maghrib.getTime() + offsets.maghrib * 60000);
  if (offsets.isha) result.isha = new Date(result.isha.getTime() + offsets.isha * 60000);
  return result;
}

export function calculatePrayerTimes(options: PrayerEngineOptions): PrayerTimesResult {
  const { lat, lng, date = new Date(), method = 'MuslimWorldLeague', madhab = 'shafi', offsets } = options;

  const coords = new Coordinates(lat, lng);
  const params = (METHOD_MAP[method] ?? CalculationMethod.MuslimWorldLeague)();

  params.madhab = madhab === 'hanafi' ? Madhab.Hanafi : Madhab.Shafi;

  if (options.highLatitudeRule) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (params as any).highLatitudeRule = HighLatitudeRule[options.highLatitudeRule];
  }

  if (options.fajrAngle) params.fajrAngle = options.fajrAngle;
  if (options.ishaAngle) params.ishaAngle = options.ishaAngle;

  const pt = new PrayerTimes(coords, date, params);
  const st = new SunnahTimes(pt);

  const result: PrayerTimesResult = {
    fajr: pt.fajr,
    sunrise: pt.sunrise,
    dhuhr: pt.dhuhr,
    asr: pt.asr,
    maghrib: pt.maghrib,
    isha: pt.isha,
    midnight: st.middleOfTheNight,
  };

  return offsets ? applyOffsets(result, offsets) : result;
}

export function getQiblaDirection(lat: number, lng: number): number {
  return Qibla(new Coordinates(lat, lng));
}

export function getCurrentPrayer(times: PrayerTimesResult, now = new Date()): PrayerName | null {
  const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (let i = prayers.length - 1; i >= 0; i--) {
    if (now >= times[prayers[i]]) return prayers[i];
  }
  return null;
}

export function getNextPrayer(times: PrayerTimesResult, now = new Date()): { name: PrayerName; time: Date } | null {
  const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
  for (const prayer of prayers) {
    if (now < times[prayer]) return { name: prayer, time: times[prayer] };
  }
  return null;
}

export function formatPrayerTime(date: Date, use24h = false): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: !use24h,
  });
}

export function getTimeUntil(target: Date, now = new Date()): string {
  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) return 'Now';
  const totalMin = Math.floor(diffMs / 60000);
  const hours = Math.floor(totalMin / 60);
  const mins = totalMin % 60;
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
