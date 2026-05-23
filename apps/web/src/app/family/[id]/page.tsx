'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Building2, Moon, Clock, Check, Flame } from 'lucide-react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/family-store';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { BottomNav } from '@/components/ui/nav';
import { cn } from '@/lib/utils';
import { formatPrayerTime } from '@/lib/prayer-engine';
import { getMemberLogsForDateRange, db } from '@/lib/db';
import type { PrayerName, PrayerStatus, MemberPrayerLog } from '@/lib/db';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
const PRAYER_LABELS: Record<PrayerName, string> = {
  fajr: 'Fajr', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: "Isha'",
};

const STATUS_CONFIGS: Record<PrayerStatus, { label: string; dotClass: string; icon?: React.ReactNode }> = {
  on_time:     { label: 'On time',       dotClass: 'prayer-dot-on_time',  icon: <Check size={14} /> },
  late:        { label: 'Late',          dotClass: 'prayer-dot-late',     icon: <Clock size={14} /> },
  jamaah:      { label: 'In jamaah',     dotClass: 'prayer-dot-jamaah',   icon: <Building2 size={14} /> },
  jamaah_home: { label: 'Jamaah (home)', dotClass: 'prayer-dot-jamaah',   icon: <Building2 size={14} /> },
  qaza:        { label: 'Qaza',          dotClass: 'prayer-dot-qaza',     icon: <Moon size={14} /> },
  missed:      { label: 'Missed',        dotClass: 'prayer-dot-missed' },
  excused:     { label: 'Excused',       dotClass: 'prayer-dot-excused' },
};

const POSITIVE_STATUSES: PrayerStatus[] = ['on_time', 'late', 'jamaah', 'jamaah_home'];

function offsetDate(base: string, delta: number): string {
  const d = new Date(base + 'T12:00:00');
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

function getLast14Days(anchor: string): string[] {
  return Array.from({ length: 14 }, (_, i) => offsetDate(anchor, i - 13));
}

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function gridDotColor(status: PrayerStatus | null, isFuture: boolean): string {
  if (isFuture) return 'bg-[var(--bg-primary)]';
  if (!status) return 'bg-[var(--bg-tertiary)]';
  if (['on_time', 'jamaah', 'jamaah_home'].includes(status)) return 'bg-emerald-400';
  if (status === 'late') return 'bg-amber-400';
  if (status === 'qaza') return 'bg-purple-400';
  if (status === 'missed') return 'bg-rose-500';
  return 'bg-zinc-600';
}

interface MemberStats {
  streak: number;
  weekPct: number;
  totalLogged: number;
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profiles, memberLogs, loadProfiles, loadLogsForDate, logPrayer } = useFamilyStore();
  const { times } = usePrayerTimesStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalPrayer, setModalPrayer] = useState<PrayerName | null>(null);
  const [stats, setStats] = useState<MemberStats>({ streak: 0, weekPct: 0, totalLogged: 0 });
  const [weekGrid, setWeekGrid] = useState<Record<string, Record<PrayerName, PrayerStatus | null>>>({});
  const [refreshKey, setRefreshKey] = useState(0);

  const profile = profiles.find(p => p.id === id);
  const logs = memberLogs[id] ?? {};
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profiles.length === 0) loadProfiles();
  }, []);

  useEffect(() => {
    loadLogsForDate(id, date);
  }, [id, date]);

  useEffect(() => {
    loadStats();
  }, [id, refreshKey]);

  async function loadStats() {
    const days = getLast7Days();
    const [rangeLogs, totalCount] = await Promise.all([
      getMemberLogsForDateRange(id, days[0], today),
      db.memberPrayerLog.where('profileId').equals(id).count(),
    ]);

    // Build weekly grid (day → prayer → status)
    const grid: Record<string, Record<PrayerName, PrayerStatus | null>> = {};
    for (const day of days) {
      grid[day] = { fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null };
      for (const log of rangeLogs.filter(l => l.date === day)) {
        grid[day][log.prayer] = log.status;
      }
    }
    setWeekGrid(grid);

    // Week completion % (only days up to today)
    const daysToToday = days.filter(d => d <= today);
    const positiveCount = rangeLogs.filter(
      l => l.date <= today && POSITIVE_STATUSES.includes(l.status)
    ).length;
    const weekPct = daysToToday.length > 0
      ? Math.round((positiveCount / (daysToToday.length * 5)) * 100)
      : 0;

    // Streak: consecutive days (going back from today) where all 5 prayers are positive
    let streak = 0;
    for (let i = days.length - 1; i >= 0; i--) {
      if (days[i] > today) continue;
      const dayLogs = rangeLogs.filter(l => l.date === days[i]);
      const allPrayed = PRAYERS.every(p =>
        dayLogs.some(l => l.prayer === p && POSITIVE_STATUSES.includes(l.status))
      );
      if (allPrayed) streak++;
      else break;
    }

    setStats({ streak, weekPct, totalLogged: totalCount });
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[var(--text-secondary)]">Member not found</p>
          <Link href="/family" className="text-[var(--accent-primary)] text-sm">← Back to family</Link>
        </div>
      </div>
    );
  }

  const formattedDate = new Date(date + 'T12:00:00').toLocaleDateString('en', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  async function handleLog(prayer: PrayerName, status: PrayerStatus, note?: string) {
    await logPrayer(id, prayer, status, date, note);
    setModalPrayer(null);
    setRefreshKey(k => k + 1);
  }

  const days7 = getLast7Days();

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/family" className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
            <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
          </Link>
          <div className="text-2xl">{profile.emoji}</div>
          <div className="flex-1">
            <h1 className="font-display text-lg text-[var(--text-primary)]">{profile.name}</h1>
            <p className="text-[var(--text-tertiary)] text-xs capitalize">{profile.relationship}</p>
          </div>
          {profile.linkStatus === 'linked' && (
            <span className="text-[10px] text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-full">
              ✓ Linked
            </span>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2">
          {[
            {
              label: 'Streak',
              value: stats.streak > 0 ? `${stats.streak}d` : '—',
              accent: stats.streak > 0,
              icon: stats.streak > 0 ? <Flame size={13} className="text-amber-400" /> : null,
            },
            {
              label: 'This Week',
              value: `${stats.weekPct}%`,
              accent: stats.weekPct >= 80,
              icon: null,
            },
            {
              label: 'Total Logged',
              value: stats.totalLogged.toString(),
              accent: false,
              icon: null,
            },
          ].map(({ label, value, accent, icon }) => (
            <div key={label} className="bg-[var(--bg-secondary)] rounded-xl p-3 text-center">
              <div className={cn(
                'font-semibold text-base flex items-center justify-center gap-1',
                accent ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
              )}>
                {icon}
                {value}
              </div>
              <div className="text-[var(--text-tertiary)] text-xs mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* 7-day weekly prayer grid */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">7-Day Overview</span>
            <div className="flex items-center gap-1 text-[10px] text-[var(--text-tertiary)]">
              <span className="w-2.5 h-2 rounded-sm bg-emerald-400 inline-block" /> on time
              <span className="w-2.5 h-2 rounded-sm bg-amber-400 inline-block ml-1" /> late
              <span className="w-2.5 h-2 rounded-sm bg-rose-500 inline-block ml-1" /> missed
            </div>
          </div>
          <div className="grid grid-cols-7 gap-1">
            {days7.map(day => {
              const dayLabel = new Date(day + 'T12:00').toLocaleDateString('en', { weekday: 'narrow' });
              const dayStatus = weekGrid[day] ?? {};
              const isFuture = day > today;
              const isToday = day === today;
              const positiveCount = PRAYERS.filter(p => {
                const s = dayStatus[p];
                return s && POSITIVE_STATUSES.includes(s);
              }).length;

              return (
                <div key={day} className="flex flex-col items-center gap-0.5">
                  <span className={cn(
                    'text-[10px] font-medium mb-0.5',
                    isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'
                  )}>
                    {dayLabel}
                  </span>
                  {PRAYERS.map(prayer => (
                    <div
                      key={prayer}
                      className={cn(
                        'w-full h-2 rounded-sm transition-colors',
                        gridDotColor(dayStatus[prayer] ?? null, isFuture)
                      )}
                      title={`${prayer}: ${dayStatus[prayer] ?? 'not logged'}`}
                    />
                  ))}
                  <span className={cn(
                    'text-[9px] mt-0.5',
                    !isFuture && positiveCount === 5 ? 'text-emerald-400 font-medium' : 'text-[var(--text-tertiary)]'
                  )}>
                    {isFuture ? '·' : `${positiveCount}/5`}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Date navigator */}
        <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-2xl px-4 py-3">
          <button
            onClick={() => setDate(d => offsetDate(d, -1))}
            className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] transition-colors"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="text-center">
            <div className="text-[var(--text-primary)] font-medium text-sm">{formattedDate}</div>
            {date === today && (
              <div className="text-[var(--accent-primary)] text-xs">Today</div>
            )}
          </div>
          <button
            onClick={() => date < today && setDate(d => offsetDate(d, 1))}
            className={cn(
              'p-1.5 rounded-lg transition-colors',
              date >= today
                ? 'text-[var(--text-tertiary)] opacity-30'
                : 'hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
            )}
            disabled={date >= today}
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* Prayer rows */}
        <div className="space-y-2">
          {PRAYERS.map(prayer => {
            const log = logs[prayer];
            const status = log?.status;
            const config = status ? STATUS_CONFIGS[status] : null;
            const time = times?.[prayer];
            return (
              <motion.div
                key={prayer}
                className="bg-[var(--bg-secondary)] rounded-xl overflow-hidden"
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex-1">
                    <div className="font-medium text-[var(--text-secondary)]">{PRAYER_LABELS[prayer]}</div>
                    <div className="text-[var(--text-tertiary)] text-sm font-mono">
                      {time ? formatPrayerTime(time) : '—'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {status && (
                      <span className="text-xs text-[var(--text-tertiary)]">{config?.label}</span>
                    )}
                    <button
                      onClick={() => {
                        if (!log) {
                          logPrayer(id, prayer, 'on_time', date).then(() => setRefreshKey(k => k + 1));
                        } else {
                          setModalPrayer(prayer);
                        }
                      }}
                      onContextMenu={e => { e.preventDefault(); setModalPrayer(prayer); }}
                      className={cn('prayer-dot', config?.dotClass ?? 'prayer-dot-empty', 'cursor-pointer')}
                      aria-label={`Log ${PRAYER_LABELS[prayer]}`}
                    >
                      {config?.icon && <span className="text-[#0D1421]">{config.icon}</span>}
                    </button>
                  </div>
                </div>
                {/* Inline note display */}
                {log?.note && (
                  <div className="px-4 pb-2.5 text-[var(--text-tertiary)] text-xs italic border-t border-[var(--bg-tertiary)]/40 pt-2">
                    "{log.note}"
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex items-center justify-between">
          <span className="text-[var(--text-secondary)] text-sm">Prayers logged today</span>
          <span className={cn(
            'font-semibold text-lg',
            Object.keys(logs).length === 5 ? 'text-emerald-400' : 'text-[var(--accent-primary)]'
          )}>
            {Object.keys(logs).length} / 5
          </span>
        </div>
      </div>

      <BottomNav />

      <AnimatePresence>
        {modalPrayer && (
          <MemberLogModal
            prayer={modalPrayer}
            currentStatus={logs[modalPrayer]?.status}
            currentNote={logs[modalPrayer]?.note}
            onClose={() => setModalPrayer(null)}
            onLog={handleLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Log Modal ─────────────────────────────────────────────────────────────────

function MemberLogModal({
  prayer,
  currentStatus,
  currentNote,
  onClose,
  onLog,
}: {
  prayer: PrayerName;
  currentStatus?: PrayerStatus;
  currentNote?: string;
  onClose: () => void;
  onLog: (prayer: PrayerName, status: PrayerStatus, note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState(currentNote ?? '');

  const statuses: { status: PrayerStatus; label: string; desc: string }[] = [
    { status: 'on_time',     label: 'On time',         desc: 'Prayed within the window' },
    { status: 'late',        label: 'Late',             desc: 'Prayed after the window' },
    { status: 'jamaah',      label: 'In jamaah',        desc: 'At the mosque' },
    { status: 'jamaah_home', label: 'Jamaah (home)',    desc: 'With family at home' },
    { status: 'qaza',        label: 'Qaza (make-up)',   desc: 'Making up a missed prayer' },
    { status: 'missed',      label: 'Missed',           desc: 'Did not pray' },
    { status: 'excused',     label: 'Excused',          desc: 'Illness, travel, menses, etc.' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] rounded-t-2xl p-6 space-y-4"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-8 h-1 bg-[var(--bg-tertiary)] rounded-full mx-auto" />
        <h3 className="font-display text-xl text-[var(--text-primary)]">Log {PRAYER_LABELS[prayer]}</h3>

        <div className="space-y-1">
          {statuses.map(({ status, label, desc }) => (
            <button
              key={status}
              onClick={() => onLog(prayer, status, note || undefined)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                currentStatus === status
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              )}
            >
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className={cn('text-xs', currentStatus === status ? 'text-[#0D1421]/70' : 'text-[var(--text-tertiary)]')}>
                  {desc}
                </div>
              </div>
              {currentStatus === status && <Check size={16} />}
            </button>
          ))}
        </div>

        {/* Note */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
            Note <span className="text-[var(--text-tertiary)] normal-case">(optional)</span>
          </label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="e.g. prayed at school, made up yesterday's…"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none placeholder:text-[var(--text-tertiary)]"
          />
        </div>
      </motion.div>
    </motion.div>
  );
}
