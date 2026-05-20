import type { Terminology } from './db';

type TermKey = 'prayer' | 'prayers' | 'fast' | 'ablution' | 'missed_prayer' | 'almsgiving' | 'pilgrimage' | 'fajr' | 'dhuhr' | 'asr' | 'maghrib' | 'isha';

type TermMap = Record<TermKey, string>;

const TERMS: Record<Terminology, TermMap> = {
  arabic: {
    prayer: 'Salah',
    prayers: 'Salawat',
    fast: 'Sawm',
    ablution: 'Wudu',
    missed_prayer: 'Qaza',
    almsgiving: 'Zakah',
    pilgrimage: 'Hajj',
    fajr: 'Fajr',
    dhuhr: 'Dhuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: "Isha'",
  },
  urdu: {
    prayer: 'Namaz',
    prayers: 'Namazein',
    fast: 'Roza',
    ablution: 'Wuzu',
    missed_prayer: 'Qaza',
    almsgiving: 'Zakat',
    pilgrimage: 'Hajj',
    fajr: 'Fajr',
    dhuhr: 'Zuhr',
    asr: 'Asr',
    maghrib: 'Maghrib',
    isha: 'Isha',
  },
  indonesian: {
    prayer: 'Shalat',
    prayers: 'Shalat',
    fast: 'Puasa',
    ablution: 'Wudhu',
    missed_prayer: 'Qadha',
    almsgiving: 'Zakat',
    pilgrimage: 'Haji',
    fajr: 'Subuh',
    dhuhr: 'Dzuhur',
    asr: 'Ashar',
    maghrib: 'Maghrib',
    isha: 'Isya',
  },
  malay: {
    prayer: 'Solat',
    prayers: 'Solat',
    fast: 'Puasa',
    ablution: 'Wuduk',
    missed_prayer: 'Qadha',
    almsgiving: 'Zakat',
    pilgrimage: 'Haji',
    fajr: 'Subuh',
    dhuhr: 'Zohor',
    asr: 'Asar',
    maghrib: 'Maghrib',
    isha: 'Isyak',
  },
  turkish: {
    prayer: 'Namaz',
    prayers: 'Namazlar',
    fast: 'Oruç',
    ablution: 'Abdest',
    missed_prayer: 'Kaza',
    almsgiving: 'Zekat',
    pilgrimage: 'Hac',
    fajr: 'Sabah',
    dhuhr: 'Öğle',
    asr: 'İkindi',
    maghrib: 'Akşam',
    isha: 'Yatsı',
  },
};

export function getTerm(key: TermKey, terminology: Terminology = 'arabic'): string {
  return TERMS[terminology]?.[key] ?? TERMS.arabic[key];
}

export function getPrayerLabel(prayer: string, terminology: Terminology = 'arabic'): string {
  const keyMap: Record<string, TermKey> = {
    fajr: 'fajr', dhuhr: 'dhuhr', asr: 'asr', maghrib: 'maghrib', isha: 'isha',
  };
  const key = keyMap[prayer];
  if (!key) return prayer;
  return getTerm(key, terminology);
}
