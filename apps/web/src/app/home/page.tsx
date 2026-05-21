'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, MapPin, Calculator, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '@/store/user-store';
import { usePrayerStore } from '@/store/prayer-store';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { useFamilyStore } from '@/store/family-store';
import { PrayerRow } from '@/components/prayer/prayer-row';
import { BottomNav } from '@/components/ui/nav';
import { NightPrayerSection } from '@/components/home/night-prayer-section';
import { QazaEstimationModal } from '@/components/home/qaza-estimation-modal';
import { formatHijriDate } from '@/lib/hijri';
import { getPrayerLabel } from '@/lib/terminology';
import { todayString, formatDate } from '@/lib/utils';
import type { PrayerName, PrayerStatus } from '@/lib/db';
import { formatPrayerTime, calculatePrayerTimes } from '@/lib/prayer-engine';
import { db, getActiveCycle, endCycle, startCycle, getPrayerStreak, finalizeExpiredMissed } from '@/lib/db';
import type { PrayerTimesResult } from '@/lib/prayer-engine';
import { cn } from '@/lib/utils';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_ABBR: Record<PrayerName, string> = {
  fajr: 'Faj', dhuhr: 'Dhu', asr: 'Asr', maghrib: 'Mag', isha: 'Ish',
};
const RING_R = 84;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_R; // ≈ 527.79

/** Only these statuses count as "prayed" for the ring and pill bars. */
const PRAYED_STATUSES: PrayerStatus[] = ['on_time', 'late', 'jamaah', 'jamaah_home'];

const COACH_NUDGES = [
  "Don't wait for a perfect day. Pray the very next prayer, even if you missed the last one. Allah is more merciful than your self-judgement.",
  "The Prophet ﷺ said: 'The first thing a person will be held accountable for on the Day of Judgment is the prayer.' Protect it.",
  "Consistency over perfection. A small deed done regularly is more beloved to Allah than a great deed done once.",
  "Hayya 'alal-falah — Come to success. Every prayer is an invitation answered.",
  "Between a man and shirk and kufr there stands his abandonment of the prayer. Guard it as you would guard your heart.",
];

/**
 * Returns the Date at which a prayer's time window closes.
 * After this point a 'missed' prayer becomes qaza debt.
 *   fajr     → sunrise
 *   dhuhr    → asr
 *   asr      → maghrib
 *   maghrib  → isha
 *   isha     → end of the night (23:59 same day)
 */
function getWindowEndTime(prayer: PrayerName, times: PrayerTimesResult): Date | null {
  switch (prayer) {
    case 'fajr':    return (times.sunrise as Date | undefined) ?? null;
    case 'dhuhr':   return (times.asr     as Date | undefined) ?? null;
    case 'asr':     return (times.maghrib as Date | undefined) ?? null;
    case 'maghrib': return (times.isha    as Date | undefined) ?? null;
    case 'isha': {
      const isha = times.isha as Date | undefined;
      if (!isha) return null;
      const midnight = new Date(isha);
      midnight.setHours(23, 59, 59, 0);
      return midnight;
    }
    default: return null;
  }
}

export default function HomePage() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  const { todayLogs, qazaLedger, loadForDate, loadQaza, setSelectedDate } = usePrayerStore();
  const { times, nextPrayer, countdown, locate, recalculate, tick, lat, lng, isLocating } = usePrayerTimesStore();
  const { profiles, memberLogs, loadProfiles, loadLogsForDate } = useFamilyStore();
  const [showQazaEstimate, setShowQazaEstimate] = useState(false);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [thirtyDayRate, setThirtyDayRate] = useState(0);
  const [selectedDate, setLocalSelectedDate] = useState(todayString());
  const [pastTimes, setPastTimes] = useState<PrayerTimesResult | null>(null);
  const [nudgeIdx] = useState(() => Math.floor(Math.random() * COACH_NUDGES.length));

  const todayStr = todayString();
  const isToday = selectedDate === todayStr;
  // Hoist displayTimes above all effects so their dependency arrays are valid
  const displayTimes = isToday ? times : pastTimes;

  function changeDate(dir: 'prev' | 'next') {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
    const newDate = d.toISOString().split('T')[0];
    if (newDate > todayStr) return;
    const ninetyAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    if (newDate < ninetyAgo) return;
    setLocalSelectedDate(newDate);
    setSelectedDate(newDate);
  }

  // Past-date prayer times
  useEffect(() => {
    if (!isToday && lat !== null && lng !== null) {
      const method = (profile?.calculationMethod as any) ?? 'MuslimWorldLeague';
      const madhab = profile?.madhab === 'hanafi' ? 'hanafi' : 'shafi';
      try {
        const t = calculatePrayerTimes({ lat, lng, date: new Date(selectedDate + 'T12:00:00'), method, madhab });
        setPastTimes(t);
      } catch { setPastTimes(null); }
    } else {
      setPastTimes(null);
    }
  }, [selectedDate, isToday, lat, lng]);

  useEffect(() => {
    if (profile && !profile.onboardingComplete) { router.replace('/onboarding'); return; }
    loadForDate(todayString());
    loadQaza();
    getPrayerStreak().then(setStreak);
    loadProfiles();
    if (lat !== null) recalculate(); else locate();
    if (profile?.womensModeEnabled) getActiveCycle().then(c => setActiveCycle(c ?? null));

    // 30-day prayer rate
    (async () => {
      const thirtyAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
      const logs = await db.prayerLog.where('date').aboveOrEqual(thirtyAgo).toArray();
      const good: PrayerStatus[] = ['on_time', 'late', 'jamaah', 'jamaah_home', 'qaza'];
      const counted = logs.filter(l => good.includes(l.status)).length;
      setThirtyDayRate(Math.round((counted / (5 * 30)) * 100));
    })();
  }, []);

  useEffect(() => {
    const today = todayString();
    for (const p of profiles) loadLogsForDate(p.id, today);
  }, [profiles.length]);

  useEffect(() => {
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [tick]);

  // Browser notifications
  useEffect(() => {
    if (!times || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const labels: Record<string, string> = { fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: "Isha'" };
    const now = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(prayer => {
      const prayerTime = times[prayer];
      if (!prayerTime) return;
      const ms = prayerTime.getTime() - now;
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        timers.push(setTimeout(() => {
          new Notification(`🕌 ${labels[prayer]} time`, {
            body: 'It is time to pray. May Allah accept your worship.',
            icon: '/icon-192.png', tag: `prayer-${prayer}`,
          });
        }, ms));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [times]);

  // ── Auto-finalize missed prayers whose window has already expired ──────────
  useEffect(() => {
    if (!displayTimes) return;
    const now = Date.now();
    (async () => {
      let anyFinalized = false;
      for (const prayer of PRAYERS) {
        const log = todayLogs[prayer];
        if (!log || log.status !== 'missed' || log.qazaFinalized) continue;

        if (!isToday) {
          // Past date → window is definitely closed, finalize immediately
          await finalizeExpiredMissed(prayer, selectedDate);
          anyFinalized = true;
        } else {
          // Today → check whether the window has already passed
          const windowEnd = getWindowEndTime(prayer, displayTimes);
          if (windowEnd && windowEnd.getTime() <= now) {
            await finalizeExpiredMissed(prayer, selectedDate);
            anyFinalized = true;
          }
        }
      }
      if (anyFinalized) loadQaza();
    })();
  // Re-run whenever the selected date or its logs change
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, displayTimes, JSON.stringify(
    PRAYERS.map(p => `${todayLogs[p]?.status}-${todayLogs[p]?.qazaFinalized}`)
  )]);

  // ── Schedule window-close notifications + deferred finalization ─────────────
  useEffect(() => {
    if (!isToday || !displayTimes) return;

    const PRAYER_LABELS: Record<PrayerName, string> = {
      fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: "Isha'",
    };
    const timers: ReturnType<typeof setTimeout>[] = [];
    const now = Date.now();

    for (const prayer of PRAYERS) {
      const log = todayLogs[prayer];
      if (!log || log.status !== 'missed' || log.qazaFinalized) continue;

      const windowEnd = getWindowEndTime(prayer, displayTimes);
      if (!windowEnd) continue;
      const msUntilClose = windowEnd.getTime() - now;
      if (msUntilClose <= 0) continue; // already expired — handled by auto-finalize above

      // 10-min warning notification
      const msUntilWarn = msUntilClose - 10 * 60 * 1000;
      if (msUntilWarn > 0) {
        timers.push(setTimeout(() => {
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
            new Notification(`⏰ ${PRAYER_LABELS[prayer]} qaza window closing`, {
              body: `10 minutes left — pray ${PRAYER_LABELS[prayer]} now before it becomes qaza debt.`,
              icon: '/icon-192.png',
              tag: `qaza-warn-${prayer}`,
            });
          }
        }, msUntilWarn));
      }

      // Finalize + refresh qaza count when window actually closes
      timers.push(setTimeout(async () => {
        await finalizeExpiredMissed(prayer, selectedDate);
        loadQaza();
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification(`📿 ${PRAYER_LABELS[prayer]} added to qaza`, {
            body: `The ${PRAYER_LABELS[prayer]} window has closed. It has been added to your qaza balance.`,
            icon: '/icon-192.png',
            tag: `qaza-final-${prayer}`,
          });
        }
      }, msUntilClose));
    }

    return () => timers.forEach(clearTimeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isToday, displayTimes, JSON.stringify(
    PRAYERS.map(p => `${todayLogs[p]?.status}-${todayLogs[p]?.qazaFinalized}`)
  ), selectedDate]);

  const terminology = profile?.terminology ?? 'arabic';
  const totalQaza = Object.values(qazaLedger).reduce((sum, q) => sum + (q?.count ?? 0), 0);
  const displayDate = new Date(selectedDate + 'T12:00:00');
  const hijriDate = formatHijriDate(displayDate);
  const gregDate = formatDate(displayDate);
  // displayTimes is hoisted above effects — see declaration near top of component
  const nextPrayerLabel = nextPrayer ? getPrayerLabel(nextPrayer.name, terminology) : null;

  // Ring calculation — only count prayers that were actually performed
  const isPrayerDone = (p: PrayerName): boolean => {
    const log = todayLogs[p];
    return !!log && PRAYED_STATUSES.includes(log.status);
  };
  const completedToday = PRAYERS.filter(isPrayerDone).length;
  const ringOffset = RING_CIRCUMFERENCE * (1 - completedToday / 5);

  async function handleShare() {
    const statusEmoji: Record<PrayerStatus, string> = {
      on_time: '✅', late: '🕐', jamaah: '🕌', jamaah_home: '✅',
      qaza: '📿', missed: '❌', excused: '🤒',
    };
    const prayerText = PRAYERS.map(p => {
      const log = todayLogs[p];
      return `${getPrayerLabel(p, terminology as any)} ${log ? (statusEmoji[log.status] ?? '✅') : '⬜'}`;
    }).join('  ');
    const logged = PRAYERS.filter(p => todayLogs[p]).length;
    const streakText = streak > 1 ? `\n${streak} day streak 🔥` : '';
    const text = `🕌 My prayers today:\n${prayerText}\n${logged}/5 logged${streakText}\n\nTracked with Hayya Falah — حَيَّ عَلَى الْفَلَاح`;
    if (navigator.share) await navigator.share({ text });
    else await navigator.clipboard.writeText(text);
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">

      {/* ── Header ── */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-arabic text-sm text-[var(--accent-primary)]">{hijriDate}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{gregDate}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={handleShare} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors" aria-label="Share">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </button>
            <Link href="/settings" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <Settings size={20} className="text-[var(--text-secondary)]" />
            </Link>
          </div>
        </div>

        {/* Date navigator */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex items-center justify-between">
          <button onClick={() => changeDate('prev')} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]">
            <ChevronLeft size={18} />
          </button>
          <button
            onClick={() => { setLocalSelectedDate(todayStr); setSelectedDate(todayStr); }}
            className={cn('text-xs font-medium px-3 py-1 rounded-full transition-all', isToday
              ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
              : 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
            )}
          >
            {isToday ? 'Today' : selectedDate}
          </button>
          <button onClick={() => changeDate('next')} disabled={isToday} className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] disabled:opacity-30">
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-4 pt-5">

        {/* Women's cycle banner */}
        {profile?.womensModeEnabled && activeCycle && !activeCycle.endDate && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl p-4 flex items-center justify-between">
            <div>
              <div className="text-rose-400 text-sm font-medium">Cycle in progress</div>
              <div className="text-[var(--text-tertiary)] text-xs">Prayers are excused. May Allah grant you ease.</div>
            </div>
            <button onClick={async () => { await endCycle(activeCycle.id, todayString()); setActiveCycle(null); }}
              className="text-xs text-rose-400 border border-rose-400/30 px-3 py-1.5 rounded-lg">
              End cycle
            </button>
          </div>
        )}

        {/* Past-date banner */}
        {!isToday && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xl px-4 py-2.5 flex items-center justify-between">
            <span className="text-[var(--accent-primary)] text-sm">Logging prayers for {selectedDate}</span>
            <button onClick={() => { setLocalSelectedDate(todayStr); setSelectedDate(todayStr); }}
              className="text-[var(--accent-primary)] text-xs underline underline-offset-2">Back to today</button>
          </motion.div>
        )}

        {/* ── Prayer Ring Card ── (shown for today AND past dates) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-3xl p-6 flex flex-col items-center gap-5 border border-[var(--bg-tertiary)]"
        >
          {/* SVG ring */}
          <div className="relative" style={{ width: 192, height: 192 }}>
            <svg width="192" height="192" className="-rotate-90" aria-hidden>
              {/* Track */}
              <circle cx="96" cy="96" r={RING_R} fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
              {/* Progress */}
              <circle
                cx="96" cy="96" r={RING_R} fill="none"
                stroke={completedToday === 5 ? '#4ade80' : 'var(--accent-primary)'}
                strokeWidth="12" strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={ringOffset}
                style={{ transition: 'stroke-dashoffset 700ms cubic-bezier(0.16, 1, 0.3, 1), stroke 400ms ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="font-display text-4xl text-[var(--text-primary)] leading-none">
                {completedToday}<span className="text-[var(--text-tertiary)]">/5</span>
              </span>
              <span className="text-[10px] uppercase tracking-[0.18em] text-[var(--text-tertiary)] font-medium mt-2">
                {completedToday === 5 ? 'All done 🌟' : 'Completed'}
              </span>
            </div>
          </div>

          {/* 5 pill bars — lit only for actually prayed statuses */}
          <div className="w-full space-y-1.5">
            <div className="grid grid-cols-5 gap-2 w-full">
              {PRAYERS.map(p => (
                <div key={p} className={cn(
                  'h-1.5 rounded-full transition-colors duration-500',
                  isPrayerDone(p) ? (completedToday === 5 ? 'bg-green-400' : 'bg-[var(--accent-primary)]') : 'bg-[var(--bg-tertiary)]'
                )} />
              ))}
            </div>
            <div className="grid grid-cols-5 gap-1 w-full text-center">
              {PRAYERS.map(p => (
                <span key={p} className={cn(
                  'text-[10px] uppercase tracking-wider font-medium',
                  isPrayerDone(p) ? (completedToday === 5 ? 'text-green-400' : 'text-[var(--accent-primary)]') : 'text-[var(--text-tertiary)]'
                )}>
                  {PRAYER_ABBR[p]}
                </span>
              ))}
            </div>
          </div>

          {/* Bottom row: next prayer for today, date label for past */}
          {isToday ? (
            isLocating ? (
              <div className="w-full flex items-center justify-center gap-2 py-2.5 bg-[var(--bg-tertiary)] rounded-xl">
                <MapPin size={14} className="text-[var(--accent-primary)] animate-pulse" />
                <span className="text-[var(--text-secondary)] text-sm">Locating…</span>
              </div>
            ) : times && nextPrayer ? (
              <div className="w-full flex items-center justify-between px-4 py-2.5 bg-[var(--bg-tertiary)] rounded-xl">
                <span className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] font-medium">Next</span>
                <span className="text-[var(--text-primary)] font-medium text-sm">{nextPrayerLabel}</span>
                <span className="text-[var(--accent-primary)] text-sm font-mono">{formatPrayerTime(nextPrayer.time)}</span>
                <span className="text-[var(--text-tertiary)] text-xs">in {countdown}</span>
              </div>
            ) : lat === null ? (
              <button onClick={locate} className="w-full py-2.5 bg-[var(--bg-tertiary)] rounded-xl text-[var(--accent-primary)] text-sm flex items-center justify-center gap-2">
                <MapPin size={14} /> Enable location
              </button>
            ) : (
              <div className="w-full py-2.5 bg-[var(--bg-tertiary)] rounded-xl text-center text-[var(--text-tertiary)] text-sm">
                All prayers complete ✓
              </div>
            )
          ) : (
            <div className="w-full py-2 text-center text-[var(--text-tertiary)] text-xs tracking-widest uppercase">
              {selectedDate}
            </div>
          )}
        </motion.div>

        {/* ── Stats Row ── */}
        {isToday && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: `${streak}d`, label: 'Fajr streak' },
              { value: `${thirtyDayRate}%`, label: '30-day rate' },
              { value: `${totalQaza}`, label: 'Qaza left' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-[var(--bg-secondary)] rounded-2xl px-3 py-4 border border-[var(--bg-tertiary)] text-center">
                <p className="font-display text-2xl tabular-nums text-[var(--text-primary)]">{value}</p>
                <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--text-tertiary)] font-medium mt-1">{label}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Habit coach nudge ── */}
        {isToday && (
          <div className="px-4 py-3 bg-[var(--bg-secondary)] rounded-2xl border border-[var(--bg-tertiary)]">
            <p className="text-[var(--text-tertiary)] text-xs leading-relaxed italic">{COACH_NUDGES[nudgeIdx]}</p>
          </div>
        )}

        {/* Sunrise divider */}
        {displayTimes?.sunrise && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
            <span className="text-[var(--text-tertiary)] text-xs">Sunrise {formatPrayerTime(displayTimes.sunrise)}</span>
            <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
          </div>
        )}

        {/* ── Prayer Rows ── */}
        <div className="space-y-2">
          {PRAYERS.map((prayer) => (
            <PrayerRow
              key={`${prayer}-${selectedDate}`}
              prayer={prayer}
              times={displayTimes ?? ({} as any)}
              log={todayLogs[prayer]}
              terminology={terminology as any}
              isCurrent={isToday && nextPrayer?.name === prayer}
              cycleActive={!!(profile?.womensModeEnabled && activeCycle && !activeCycle.endDate)}
            />
          ))}
        </div>

        {/* Night prayers */}
        <NightPrayerSection />

        {/* ── Ledger Cards Row ── */}
        <div className="grid grid-cols-2 gap-3">

          {/* Qaza Balance */}
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 border border-[var(--bg-tertiary)] space-y-3">
            <h3 className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.18em]">Qaza Balance</h3>
            <div className="flex items-end gap-1.5">
              <span className="font-display text-4xl text-[var(--text-primary)] tabular-nums leading-none">{totalQaza}</span>
              <span className="pb-0.5 text-xs text-[var(--text-tertiary)]">remaining</span>
            </div>
            <div className="border-t border-[var(--bg-tertiary)] pt-2">
              <button
                onClick={() => setShowQazaEstimate(true)}
                className="text-xs font-medium text-[var(--accent-primary)] hover:underline"
              >
                Manage →
              </button>
            </div>
          </div>

          {/* Family Circle */}
          <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 border border-[var(--bg-tertiary)] space-y-3">
            <h3 className="text-[10px] font-medium text-[var(--text-tertiary)] uppercase tracking-[0.18em]">Family Circle</h3>
            {profiles.length === 0 ? (
              <div className="space-y-2">
                <p className="text-sm text-[var(--text-tertiary)] leading-snug">No members added yet.</p>
                <div className="border-t border-[var(--bg-tertiary)] pt-2">
                  <Link href="/family" className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                    Add first →
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {profiles.slice(0, 3).map(p => {
                  const logs = memberLogs[p.id] ?? {};
                  const done = PRAYERS.filter(pr => logs[pr]).length;
                  return (
                    <Link key={p.id} href={`/family/${p.id}`} className="flex items-center gap-2 group">
                      <span className="text-base leading-none">{p.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[var(--text-secondary)] text-xs truncate">{p.name}</div>
                        <div className="flex gap-0.5 mt-1">
                          {PRAYERS.map(pr => (
                            <div key={pr} className={cn('h-1 rounded-full flex-1', logs[pr] ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]')} />
                          ))}
                        </div>
                      </div>
                      <span className="text-[var(--text-tertiary)] text-[10px] shrink-0">{done}/5</span>
                    </Link>
                  );
                })}
                <div className="border-t border-[var(--bg-tertiary)] pt-2">
                  <Link href="/family" className="text-xs font-medium text-[var(--accent-primary)] hover:underline">
                    {profiles.length > 3 ? `+${profiles.length - 3} more →` : 'Manage →'}
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Women's mode + Qaza shortcuts */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowQazaEstimate(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm hover:border-[var(--accent-primary)]/30 transition-colors"
          >
            <Calculator size={16} /> Estimate Qaza
          </button>
          {profile?.womensModeEnabled && !activeCycle && (
            <button
              onClick={async () => { await startCycle(todayString()); const c = await getActiveCycle(); setActiveCycle(c ?? null); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/30 text-rose-400 text-sm hover:border-rose-500/60 transition-colors"
            >
              Start cycle
            </button>
          )}
        </div>

        {/* Greeting */}
        {profile?.name && (
          <div className="text-center text-[var(--text-tertiary)] text-sm pb-2">
            Assalamu alaykum, {profile.name} 🌙
          </div>
        )}
      </div>

      <AnimatePresence>
        {showQazaEstimate && (
          <QazaEstimationModal
            onClose={() => setShowQazaEstimate(false)}
            onDone={() => { setShowQazaEstimate(false); loadQaza(); }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}
