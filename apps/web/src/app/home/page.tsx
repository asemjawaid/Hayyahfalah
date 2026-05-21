'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Moon, MapPin, Calculator, Users, Share2, Flame, ChevronLeft, ChevronRight } from 'lucide-react';
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
import { db, getActiveCycle, endCycle, startCycle, getPrayerStreak } from '@/lib/db';
import type { PrayerTimesResult } from '@/lib/prayer-engine';
import { cn } from '@/lib/utils';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function HomePage() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  const { todayLogs, qazaLedger, loadForDate, loadQaza, setSelectedDate } = usePrayerStore();
  const { times, nextPrayer, countdown, locate, recalculate, tick, lat, lng, isLocating } = usePrayerTimesStore();
  const { profiles, memberLogs, loadProfiles, loadLogsForDate } = useFamilyStore();
  const [showQazaEstimate, setShowQazaEstimate] = useState(false);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [shareToast, setShareToast] = useState(false);
  const [selectedDate, setLocalSelectedDate] = useState(todayString());
  const [pastTimes, setPastTimes] = useState<PrayerTimesResult | null>(null);

  const todayStr = todayString();
  const isToday = selectedDate === todayStr;

  function changeDate(dir: 'prev' | 'next') {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + (dir === 'next' ? 1 : -1));
    const newDate = d.toISOString().split('T')[0];
    // Don't go future beyond today
    if (newDate > todayStr) return;
    // Don't go back more than 90 days
    const ninetyAgo = new Date(Date.now() - 90 * 86400000).toISOString().split('T')[0];
    if (newDate < ninetyAgo) return;
    setLocalSelectedDate(newDate);
    setSelectedDate(newDate); // updates prayer-store to load that date's logs
  }

  // For past dates, calculate prayer times using stored lat/lng
  useEffect(() => {
    if (!isToday && lat !== null && lng !== null) {
      const method = (profile?.calculationMethod as any) ?? 'MuslimWorldLeague';
      const madhab = profile?.madhab === 'hanafi' ? 'hanafi' : 'shafi';
      const pastDate = new Date(selectedDate + 'T12:00:00'); // noon to avoid DST issues
      try {
        const t = calculatePrayerTimes({ lat, lng, date: pastDate, method, madhab });
        setPastTimes(t);
      } catch { setPastTimes(null); }
    } else {
      setPastTimes(null);
    }
  }, [selectedDate, isToday, lat, lng]);

  useEffect(() => {
    if (profile && !profile.onboardingComplete) {
      router.replace('/onboarding');
      return;
    }
    loadForDate(todayString());
    loadQaza();
    getPrayerStreak().then(setStreak);
    loadProfiles();
    if (lat !== null) {
      recalculate();
    } else {
      locate();
    }
    if (profile?.womensModeEnabled) {
      getActiveCycle().then(c => setActiveCycle(c ?? null));
    }
  }, []);

  useEffect(() => {
    const today = todayString();
    for (const p of profiles) loadLogsForDate(p.id, today);
  }, [profiles.length]);

  useEffect(() => {
    const interval = setInterval(tick, 30000);
    return () => clearInterval(interval);
  }, [tick]);

  // Schedule browser notifications for today's remaining prayers
  useEffect(() => {
    if (!times || typeof Notification === 'undefined' || Notification.permission !== 'granted') return;
    const PRAYER_LABELS_MAP: Record<string, string> = {
      fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: "Isha'",
    };
    const now = Date.now();
    const timers: ReturnType<typeof setTimeout>[] = [];
    (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).forEach(prayer => {
      const prayerTime = times[prayer];
      if (!prayerTime) return;
      const ms = prayerTime.getTime() - now;
      if (ms > 0 && ms < 24 * 60 * 60 * 1000) {
        timers.push(setTimeout(() => {
          new Notification(`🕌 ${PRAYER_LABELS_MAP[prayer]} time`, {
            body: 'It is time to pray. May Allah accept your worship.',
            icon: '/icon-192.png',
            tag: `prayer-${prayer}`,
          });
        }, ms));
      }
    });
    return () => timers.forEach(clearTimeout);
  }, [times]);

  const terminology = profile?.terminology ?? 'arabic';
  const totalQaza = Object.values(qazaLedger).reduce((sum, q) => sum + (q?.count ?? 0), 0);
  const displayDate = new Date(selectedDate + 'T12:00:00');
  const hijriDate = formatHijriDate(displayDate);
  const gregDate = formatDate(displayDate);
  // Use past-date prayer times when viewing a previous day
  const displayTimes = isToday ? times : pastTimes;

  const nextPrayerLabel = nextPrayer
    ? getPrayerLabel(nextPrayer.name, terminology)
    : null;

  async function handleShare() {
    const prayers: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    const statusEmoji: Record<PrayerStatus, string> = {
      on_time: '✅', late: '🕐', jamaah: '🕌', jamaah_home: '✅',
      qaza: '📿', missed: '❌', excused: '🤒',
    };
    const prayerText = prayers.map(p => {
      const log = todayLogs[p];
      return `${getPrayerLabel(p, terminology as any)} ${log ? (statusEmoji[log.status] ?? '✅') : '⬜'}`;
    }).join('  ');
    const logged = prayers.filter(p => todayLogs[p]).length;
    const streakText = streak > 1 ? `\n${streak} day streak 🔥` : '';
    const text = `🕌 My prayers today:\n${prayerText}\n${logged}/5 logged${streakText}\n\nTracked with Hayya Falah — حَيَّ عَلَى الْفَلَاح`;
    if (navigator.share) {
      await navigator.share({ text });
    } else {
      await navigator.clipboard.writeText(text);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <div className="font-arabic text-sm text-[var(--accent-primary)]">{hijriDate}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{gregDate}</div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors relative"
              aria-label="Share today's prayers"
            >
              <Share2 size={18} className="text-[var(--text-secondary)]" />
              {shareToast && (
                <span className="absolute -bottom-7 right-0 text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2 py-1 rounded-lg whitespace-nowrap">
                  Copied!
                </span>
              )}
            </button>
            <Link href="/settings" className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <Settings size={20} className="text-[var(--text-secondary)]" />
            </Link>
          </div>
        </div>

        {/* Date navigator */}
        <div className="max-w-lg mx-auto px-4 pb-2 flex items-center justify-between">
          <button
            onClick={() => changeDate('prev')}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)]"
            aria-label="Previous day"
          >
            <ChevronLeft size={18} />
          </button>

          <button
            onClick={() => {
              setLocalSelectedDate(todayStr);
              setSelectedDate(todayStr);
            }}
            className={cn(
              'text-xs font-medium px-3 py-1 rounded-full transition-all',
              isToday
                ? 'text-[var(--accent-primary)] bg-[var(--accent-primary)]/10'
                : 'text-[var(--text-secondary)] bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)]'
            )}
          >
            {isToday ? 'Today' : selectedDate}
          </button>

          <button
            onClick={() => changeDate('next')}
            disabled={isToday}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors text-[var(--text-secondary)] disabled:opacity-30"
            aria-label="Next day"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 space-y-6 pt-6">
        {/* Women's mode: active cycle banner */}
        {profile?.womensModeEnabled && activeCycle && !activeCycle.endDate && (
          <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-rose-400 text-sm font-medium">Cycle in progress</div>
              <div className="text-[var(--text-tertiary)] text-xs">Prayers are excused. May Allah grant you ease.</div>
            </div>
            <button
              onClick={async () => {
                await endCycle(activeCycle.id, todayString());
                setActiveCycle(null);
              }}
              className="text-xs text-rose-400 border border-rose-400/30 px-3 py-1.5 rounded-lg"
            >
              End cycle
            </button>
          </div>
        )}

        {/* Past-date banner */}
        {!isToday && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-xl px-4 py-2.5 flex items-center justify-between"
          >
            <span className="text-[var(--accent-primary)] text-sm">
              Logging prayers for {selectedDate}
            </span>
            <button
              onClick={() => { setLocalSelectedDate(todayStr); setSelectedDate(todayStr); }}
              className="text-[var(--accent-primary)] text-xs underline underline-offset-2"
            >
              Back to today
            </button>
          </motion.div>
        )}

        {/* Hero — Next prayer (today only) */}
        {isToday && <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-2xl p-6 text-center space-y-2"
        >
          {isLocating ? (
            <div className="space-y-2">
              <MapPin size={24} className="mx-auto text-[var(--accent-primary)] animate-pulse" />
              <p className="text-[var(--text-secondary)] text-sm">Calculating prayer times…</p>
            </div>
          ) : times && nextPrayer ? (
            <>
              <div className="text-[var(--text-secondary)] text-sm uppercase tracking-widest">Next prayer</div>
              <div className="font-display text-4xl text-[var(--text-primary)] font-semibold">
                {nextPrayerLabel}
              </div>
              <div className="text-[var(--text-secondary)] text-lg font-mono">
                {formatPrayerTime(nextPrayer.time)}
              </div>
              <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--accent-primary)] text-sm font-medium">
                <span>in {countdown}</span>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <p className="text-[var(--text-secondary)] text-sm">
                {lat === null ? 'Location needed for prayer times' : 'All prayers complete for today'}
              </p>
              {lat === null && (
                <button
                  onClick={locate}
                  className="text-[var(--accent-primary)] text-sm underline"
                >
                  Allow location
                </button>
              )}
            </div>
          )}
        </motion.div>}

        {/* Streak badge (today only) */}
        {isToday && streak > 0 && (
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-medium">
              <Flame size={15} />
              <span>{streak} day streak</span>
              {streak >= 7 && <span className="text-xs opacity-70">🌟</span>}
              {streak >= 30 && <span className="text-xs opacity-70">🏆</span>}
            </div>
          </div>
        )}

        {/* Sunrise (informational) */}
        {displayTimes?.sunrise && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
            <span className="text-[var(--text-tertiary)] text-xs">
              Sunrise {formatPrayerTime(displayTimes.sunrise)}
            </span>
            <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
          </div>
        )}

        {/* Prayer rows */}
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

        {/* Family quick-view */}
        {profiles.length > 0 && (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users size={16} className="text-[var(--accent-primary)]" />
                <span className="text-[var(--text-primary)] font-medium text-sm">Family & Students</span>
              </div>
              <Link href="/family" className="text-xs text-[var(--accent-primary)]">Manage →</Link>
            </div>
            <div className="space-y-2">
              {profiles.map(p => {
                const logs = memberLogs[p.id] ?? {};
                const completed = ['fajr','dhuhr','asr','maghrib','isha'].filter(pr => logs[pr as PrayerName]).length;
                return (
                  <Link key={p.id} href={`/family/${p.id}`} className="flex items-center gap-3 group">
                    <div className="w-8 h-8 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center text-lg flex-shrink-0">
                      {p.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[var(--text-secondary)] text-sm truncate">{p.name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      {(['fajr','dhuhr','asr','maghrib','isha'] as PrayerName[]).map(pr => (
                        <div
                          key={pr}
                          className={cn(
                            'w-3 h-3 rounded-full',
                            logs[pr] ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
                          )}
                        />
                      ))}
                      <span className="text-[var(--text-tertiary)] text-xs ml-1">{completed}/5</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Qaza summary */}
        {totalQaza > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-[var(--bg-secondary)] rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Moon size={16} className="text-[var(--accent-primary)]" />
                <span className="text-[var(--text-primary)] font-medium text-sm">Qaza Balance</span>
              </div>
              <span className="text-[var(--text-tertiary)] text-xs">Tap to make up</span>
            </div>
            <div className="flex gap-3">
              {PRAYERS.map(p => {
                const q = qazaLedger[p];
                const count = q?.count ?? 0;
                if (count === 0) return null;
                return (
                  <div key={p} className="text-center">
                    <div className="text-[var(--accent-primary)] font-semibold text-lg">{count}</div>
                    <div className="text-[var(--text-tertiary)] text-xs capitalize">{getPrayerLabel(p, terminology as any)}</div>
                  </div>
                );
              })}
            </div>
            {Object.values(qazaLedger).some(q => (q?.totalMadeUp ?? 0) > 0) && (
              <div className="mt-3 pt-3 border-t border-[var(--bg-tertiary)]">
                <p className="text-[var(--text-tertiary)] text-xs">
                  You've made up {Object.values(qazaLedger).reduce((s, q) => s + (q?.totalMadeUp ?? 0), 0)} Qaza prayers. May Allah accept. 🤍
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* Estimate Qaza / Women's mode shortcuts */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowQazaEstimate(true)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm hover:border-[var(--accent-secondary)] transition-colors"
          >
            <Calculator size={16} /> Estimate Qaza
          </button>
          {profile?.womensModeEnabled && !activeCycle && (
            <button
              onClick={async () => {
                await startCycle(todayString());
                const c = await getActiveCycle();
                setActiveCycle(c ?? null);
              }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-rose-500/30 text-rose-400 text-sm hover:border-rose-500/60 transition-colors"
            >
              Start cycle
            </button>
          )}
        </div>

        {/* Greeting */}
        {profile?.name && (
          <div className="text-center text-[var(--text-tertiary)] text-sm">
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
