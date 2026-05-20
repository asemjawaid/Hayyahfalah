export interface HijriDate {
  day: number;
  month: number;
  year: number;
  monthName: string;
  monthNameAr: string;
}

export const HIJRI_MONTHS_EN = [
  'Muharram', 'Safar', "Rabi' al-Awwal", "Rabi' al-Thani",
  'Jumada al-Ula', 'Jumada al-Akhirah', 'Rajab', "Sha'ban",
  'Ramadan', 'Shawwal', "Dhul Qa'dah", 'Dhul Hijjah',
];

export const HIJRI_MONTHS_AR = [
  'مُحَرَّم', 'صَفَر', 'رَبِيعُ الأَوَّل', 'رَبِيعُ الثَّانِي',
  'جُمَادَى الأُولَى', 'جُمَادَى الآخِرَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو القَعْدَة', 'ذُو الحِجَّة',
];

export function toHijri(date: Date): HijriDate {
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
    const parts = formatter.formatToParts(date);
    const get = (t: string) => parseInt(parts.find(p => p.type === t)?.value ?? '0', 10);
    const month = get('month');
    return {
      day: get('day'),
      month,
      year: get('year'),
      monthName: HIJRI_MONTHS_EN[month - 1] ?? '',
      monthNameAr: HIJRI_MONTHS_AR[month - 1] ?? '',
    };
  } catch {
    return { day: 1, month: 1, year: 1447, monthName: 'Muharram', monthNameAr: 'مُحَرَّم' };
  }
}

export function formatHijriDate(date: Date, lang = 'en'): string {
  const h = toHijri(date);
  if (lang === 'ar') return `${h.day} ${h.monthNameAr} ${h.year}`;
  return `${h.day} ${h.monthName} ${h.year}`;
}

export interface IslamicEvent {
  name: string;
  nameAr: string;
  hijriMonth: number;
  hijriDay: number;
  notifyDaysBefore: number;
  description: string;
}

export const ISLAMIC_EVENTS: IslamicEvent[] = [
  { name: 'Islamic New Year', nameAr: 'رأس السنة الهجرية', hijriMonth: 1, hijriDay: 1, notifyDaysBefore: 3, description: 'First day of Muharram' },
  { name: "Ashura", nameAr: 'عاشوراء', hijriMonth: 1, hijriDay: 10, notifyDaysBefore: 4, description: 'Recommended fast — expiation of past year' },
  { name: 'Mawlid al-Nabi', nameAr: 'المولد النبوي', hijriMonth: 3, hijriDay: 12, notifyDaysBefore: 3, description: "Prophet's ﷺ birthday (informational)" },
  { name: "Isra and Mi'raj", nameAr: 'الإسراء والمعراج', hijriMonth: 7, hijriDay: 27, notifyDaysBefore: 3, description: 'Night journey of the Prophet ﷺ' },
  { name: "Laylat al-Bara'ah", nameAr: 'ليلة البراءة', hijriMonth: 8, hijriDay: 15, notifyDaysBefore: 2, description: 'Night of Forgiveness (15th Sha\'ban)' },
  { name: 'First day of Ramadan', nameAr: 'أول رمضان', hijriMonth: 9, hijriDay: 1, notifyDaysBefore: 5, description: 'The blessed month of fasting begins' },
  { name: "Laylat al-Qadr (27th)", nameAr: 'ليلة القدر', hijriMonth: 9, hijriDay: 27, notifyDaysBefore: 2, description: 'Night of Power — better than 1000 months' },
  { name: 'Eid al-Fitr', nameAr: 'عيد الفطر', hijriMonth: 10, hijriDay: 1, notifyDaysBefore: 3, description: 'Festival of Breaking the Fast' },
  { name: 'First 10 days of Dhul Hijjah', nameAr: 'عشر ذي الحجة', hijriMonth: 12, hijriDay: 1, notifyDaysBefore: 5, description: 'Best days of the year — increase worship' },
  { name: 'Day of Arafah', nameAr: 'يوم عرفة', hijriMonth: 12, hijriDay: 9, notifyDaysBefore: 4, description: 'Recommended fast — expiates two years of sins' },
  { name: 'Eid al-Adha', nameAr: 'عيد الأضحى', hijriMonth: 12, hijriDay: 10, notifyDaysBefore: 3, description: 'Festival of Sacrifice' },
];

export function isSunnahFastDay(date: Date): boolean {
  const day = date.getDay();
  return day === 1 || day === 4;
}

export function isWhiteDay(date: Date): boolean {
  const { day } = toHijri(date);
  return day === 13 || day === 14 || day === 15;
}

export function isRamadan(date: Date): boolean {
  return toHijri(date).month === 9;
}

export function getHijriDaysInMonth(month: number, year: number): number {
  const islamicMonthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  return islamicMonthLengths[month - 1] ?? 30;
}

export function getDaySpecialStatus(date: Date): { isSunnahFast: boolean; isWhiteDay: boolean; isRamadan: boolean; events: IslamicEvent[] } {
  const h = toHijri(date);
  const matchedEvents = ISLAMIC_EVENTS.filter(e => e.hijriMonth === h.month && e.hijriDay === h.day);
  return {
    isSunnahFast: isSunnahFastDay(date),
    isWhiteDay: isWhiteDay(date),
    isRamadan: h.month === 9,
    events: matchedEvents,
  };
}
