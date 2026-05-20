'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Moon, MapPin, Calculator, Users, Share2, Flame } from 'lucide-react';
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
import { formatPrayerTime } from '@hayyafalah/prayer-engine';
import { db, getActiveCycle, endCycle, startCycle, getPrayerStreak } from '@/lib/db';
import { cn } from '@/lib/utils';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export default function HomePage() {
  const router = useRouter();
  const { profile, updateProfile } = useUserStore();
  const { todayLogs, qazaLedger, loadForDate, loadQaza } = usePrayerStore();
  const { times, nextPrayer, countdown, locate, recalculate, tick, lat, isLocating } = usePrayerTimesStore();
  const { profiles, memberLogs, loadProfiles, loadLogsForDate } = useFamilyStore();
  const [showQazaEstimate, setShowQazaEstimate] = useState(false);
  const [activeCycle, setActiveCycle] = useState<any>(null);
  const [streak, setStreak] = useState(0);
  const [shareToast, setShareToast] = useState(false);

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

  const terminology = profile?.terminology ?? 'arabic';
  const totalQaza = Object.values(qazaLedger).reduce((sum, q) => sum + (q?.count ?? 0), 0);
  const today = new Date();
  const hijriDate = formatHijriDate(today);
  const gregDate = formatDate(today);

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
            <div className="font-arabic text-sm text-[var(--accent-primary)]">
              {hijriDate}
            </div>
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

        {/* Hero — Next prayer */}
        <motion.div
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
        </motion.div>

        {/* Streak badge */}
        {streak > 0 && (
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
        {times?.sunrise && (
          <div className="flex items-center gap-2 px-2">
            <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
            <span className="text-[var(--text-tertiary)] text-xs">
              Sunrise {formatPrayerTime(times.sunrise)}
            </span>
            <div className="flex-1 h-px bg-[var(--bg-tertiary)]" />
          </div>
        )}

        {/* Prayer rows */}
        <div className="space-y-2">
          {PRAYERS.map((prayer) => (
            <PrayerRow
              key={prayer}
              prayer={prayer}
              times={times ?? ({} as any)}
              log={todayLogs[prayer]}
              terminology={terminology as any}
              isCurrent={nextPrayer?.name === prayer}
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
