'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun, Star, Clock, ChevronLeft, ChevronRight, Plus, UtensilsCrossed } from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import { db, logFast, getFastingLogsForMonth, type FastingLog, type FastType, type FastStatus } from '@/lib/db';
import { formatHijriDate, toHijri, isSunnahFastDay, isWhiteDay } from '@/lib/hijri';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { formatPrayerTime } from '@/lib/prayer-engine';
import { cn } from '@/lib/utils';
import { todayString } from '@/lib/utils';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

type TabId = 'today' | 'ramadan' | 'sunnah' | 'history';

function isRamadan(date: Date): boolean {
  const h = toHijri(date);
  return h.month === 9; // Ramadan is month 9
}

function getMakeupCount(logs: FastingLog[]): number {
  const ramadanExcused = logs.filter(l => l.type === 'ramadan' && l.status === 'excused').length;
  const ramadanMadeUp = logs.filter(l => l.type === 'makeup').length;
  return Math.max(0, ramadanExcused - ramadanMadeUp);
}

const STATUS_CONFIG: Record<FastStatus, { label: string; color: string; icon: string }> = {
  completed: { label: 'Completed', color: 'text-emerald-400', icon: '✓' },
  partial: { label: 'Partial', color: 'text-amber-400', icon: '◑' },
  broken: { label: 'Broke fast', color: 'text-rose-400', icon: '✗' },
  excused: { label: 'Excused', color: 'text-sky-400', icon: '~' },
};

const TYPE_LABELS: Record<FastType, string> = {
  ramadan: 'Ramadan',
  sunnah: 'Sunnah',
  makeup: 'Makeup',
  voluntary: 'Voluntary',
  nadhr: 'Vow (Nadhr)',
};

export default function FastingPage() {
  const [tab, setTab] = useState<TabId>('today');
  const [todayLog, setTodayLog] = useState<FastingLog | null>(null);
  const [monthLogs, setMonthLogs] = useState<FastingLog[]>([]);
  const [logModal, setLogModal] = useState(false);
  const [historyDate, setHistoryDate] = useState(new Date());
  const { times } = usePrayerTimesStore();
  const today = new Date();
  const hijri = toHijri(today);
  const ramadanActive = isRamadan(today);

  const load = useCallback(async () => {
    const t = await db.fastingLog.where('date').equals(todayString()).first();
    setTodayLog(t ?? null);
    const logs = await getFastingLogsForMonth(historyDate.getFullYear(), historyDate.getMonth() + 1);
    setMonthLogs(logs);
  }, [historyDate]);

  useEffect(() => { load(); }, [load]);

  const TABS: { id: TabId; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'sunnah', label: 'Sunnah' },
    { id: 'history', label: 'History' },
  ];

  const isSunnahToday = isSunnahFastDay(today);
  const isWhiteDayToday = isWhiteDay(today);

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Fasting</h1>
          <p className="text-[var(--text-tertiary)] text-xs">{formatHijriDate(today)}</p>
        </div>
        <div className="max-w-lg mx-auto px-4 flex gap-2 pb-3">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all',
                tab === t.id
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">

        {/* TODAY TAB */}
        {tab === 'today' && (
          <div className="space-y-4">
            {/* Ramadan banner */}
            {ramadanActive && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-[var(--accent-secondary)] to-[var(--accent-primary)] rounded-2xl p-4 text-center"
              >
                <div className="text-[#0D1421] font-display text-xl font-semibold">Ramadan Mubarak</div>
                <div className="text-[#0D1421]/80 text-sm">{hijri.day} Ramadan {hijri.year}</div>
              </motion.div>
            )}

            {/* Suhoor / Iftar times */}
            {times && (
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center">
                  <Moon size={20} className="mx-auto mb-2 text-[var(--accent-primary)]" />
                  <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">Suhoor ends</div>
                  <div className="text-[var(--text-primary)] font-semibold text-lg mt-1">
                    {formatPrayerTime(times.fajr)}
                  </div>
                  <div className="text-[var(--text-tertiary)] text-xs">(Fajr time)</div>
                </div>
                <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center">
                  <Sun size={20} className="mx-auto mb-2 text-[var(--accent-primary)]" />
                  <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">Iftar / Maghrib</div>
                  <div className="text-[var(--text-primary)] font-semibold text-lg mt-1">
                    {formatPrayerTime(times.maghrib)}
                  </div>
                  <div className="text-[var(--text-tertiary)] text-xs">(Maghrib time)</div>
                </div>
              </div>
            )}

            {/* Special day notice */}
            {(isSunnahToday || isWhiteDayToday) && !ramadanActive && (
              <div className="bg-[var(--bg-secondary)] rounded-xl p-3 flex items-center gap-3">
                <Star size={16} className="text-[var(--accent-primary)] shrink-0" />
                <p className="text-[var(--text-secondary)] text-sm">
                  {isWhiteDayToday
                    ? `White Day — fasting on the ${hijri.day}th of the Hijri month is recommended.`
                    : 'Today is a recommended Sunnah fast day (Monday or Thursday).'}
                </p>
              </div>
            )}

            {/* Today's log status */}
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[var(--text-primary)] font-medium">Today's fast</span>
                {todayLog && (
                  <span className={cn('text-sm font-medium', STATUS_CONFIG[todayLog.status].color)}>
                    {STATUS_CONFIG[todayLog.status].icon} {STATUS_CONFIG[todayLog.status].label}
                  </span>
                )}
              </div>

              {!todayLog ? (
                <div className="space-y-2">
                  <p className="text-[var(--text-tertiary)] text-sm">Are you fasting today?</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      [ramadanActive ? 'ramadan' : isSunnahToday ? 'sunnah' : 'voluntary', 'completed', 'Yes — fasting'],
                      ['voluntary', 'broken', 'Not today'],
                    ] as [FastType, FastStatus, string][]).map(([type, status, label]) => (
                      <button
                        key={label}
                        onClick={async () => {
                          await logFast({ date: todayString(), type, status });
                          load();
                        }}
                        className="py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--accent-primary)] hover:text-[#0D1421] transition-all"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setLogModal(true)}
                    className="w-full py-2 text-[var(--accent-primary)] text-sm"
                  >
                    Log with details →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
                    <span>Type: {TYPE_LABELS[todayLog.type]}</span>
                  </div>
                  <button
                    onClick={() => setLogModal(true)}
                    className="text-[var(--accent-primary)] text-sm"
                  >
                    Edit →
                  </button>
                </div>
              )}
            </div>

            {/* Makeup counter */}
            {(() => {
              const makeupCount = getMakeupCount(monthLogs);
              return makeupCount > 0 ? (
                <div className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-[var(--text-primary)] font-medium text-sm">Makeup fasts owed</div>
                    <div className="text-[var(--text-tertiary)] text-xs">From Ramadan or excused days</div>
                  </div>
                  <div className="text-[var(--accent-primary)] font-bold text-2xl">{makeupCount}</div>
                </div>
              ) : null;
            })()}
          </div>
        )}

        {/* SUNNAH TAB */}
        {tab === 'sunnah' && (
          <div className="space-y-4">
            <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-3">
              <h3 className="text-[var(--text-primary)] font-medium">Recommended Fast Days</h3>
              {[
                { name: 'Monday & Thursday', desc: 'Weekly Sunnah — the Prophet ﷺ fasted on these days', hadith: 'Tirmidhi 745' },
                { name: 'White Days (Ayyam al-Bid)', desc: '13th, 14th & 15th of each Hijri month', hadith: 'Abu Dawud 2449' },
                { name: 'Day of Arafah (9 Dhul Hijjah)', desc: 'Expiates sins of 2 years — fasting on this day', hadith: 'Muslim 1162' },
                { name: 'Ashura (10 Muharram)', desc: 'Expiates sins of the past year — add 9th or 11th', hadith: 'Muslim 1162' },
                { name: '6 Days of Shawwal', desc: 'After Eid al-Fitr — like fasting the whole year', hadith: 'Muslim 1164' },
                { name: 'First 9 days of Dhul Hijjah', desc: 'Best days of the year — especially the 9th', hadith: 'Various' },
              ].map(day => (
                <div key={day.name} className="border-b border-[var(--bg-tertiary)] pb-3 last:border-0 last:pb-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[var(--text-primary)] text-sm font-medium">{day.name}</div>
                      <div className="text-[var(--text-tertiary)] text-xs mt-0.5">{day.desc}</div>
                      <div className="text-[var(--accent-secondary)] text-xs mt-0.5">{day.hadith}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => setLogModal(true)}
              className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2"
            >
              <Plus size={18} /> Log a fast
            </button>
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === 'history' && (
          <div className="space-y-4">
            {/* Month nav */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setHistoryDate(d => { const n = new Date(d); n.setMonth(n.getMonth() - 1); return n; })}
                className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
              </button>
              <span className="text-[var(--text-primary)] font-medium">
                {MONTH_NAMES[historyDate.getMonth()]} {historyDate.getFullYear()}
              </span>
              <button
                onClick={() => setHistoryDate(d => { const n = new Date(d); n.setMonth(n.getMonth() + 1); return n; })}
                className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors"
              >
                <ChevronRight size={20} className="text-[var(--text-secondary)]" />
              </button>
            </div>

            {/* Summary */}
            {monthLogs.length > 0 ? (
              <>
                <div className="grid grid-cols-3 gap-2 text-center">
                  {[
                    ['Completed', monthLogs.filter(l => l.status === 'completed').length, 'text-emerald-400'],
                    ['Partial', monthLogs.filter(l => l.status === 'partial').length, 'text-amber-400'],
                    ['Excused', monthLogs.filter(l => l.status === 'excused').length, 'text-sky-400'],
                  ].map(([label, count, color]) => (
                    <div key={label as string} className="bg-[var(--bg-secondary)] rounded-xl p-3">
                      <div className={cn('font-bold text-xl', color as string)}>{count}</div>
                      <div className="text-[var(--text-tertiary)] text-xs">{label}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  {monthLogs.map(log => (
                    <div key={log.id} className="bg-[var(--bg-secondary)] rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <div className="text-[var(--text-primary)] text-sm">{log.date}</div>
                        <div className="text-[var(--text-tertiary)] text-xs">{TYPE_LABELS[log.type]}</div>
                      </div>
                      <span className={cn('text-sm font-medium', STATUS_CONFIG[log.status].color)}>
                        {STATUS_CONFIG[log.status].icon} {STATUS_CONFIG[log.status].label}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-[var(--text-tertiary)]">
                <UtensilsCrossed size={32} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm">No fasts logged this month</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Log modal */}
      <AnimatePresence>
        {logModal && (
          <FastLogModal
            date={todayString()}
            existing={todayLog}
            onClose={() => setLogModal(false)}
            onSave={async (log) => { await logFast(log); load(); setLogModal(false); }}
          />
        )}
      </AnimatePresence>

      <BottomNav />
    </div>
  );
}

function FastLogModal({
  date,
  existing,
  onClose,
  onSave,
}: {
  date: string;
  existing: FastingLog | null;
  onClose: () => void;
  onSave: (log: Omit<FastingLog, 'id'>) => void;
}) {
  const [type, setType] = useState<FastType>(existing?.type ?? 'voluntary');
  const [status, setStatus] = useState<FastStatus>(existing?.status ?? 'completed');
  const [reason, setReason] = useState(existing?.reason ?? '');

  const TYPES: FastType[] = ['ramadan', 'sunnah', 'makeup', 'voluntary', 'nadhr'];
  const STATUSES: FastStatus[] = ['completed', 'partial', 'broken', 'excused'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 z-50 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="w-full bg-[var(--bg-secondary)] rounded-t-3xl p-6 space-y-5 max-w-lg mx-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg text-[var(--text-primary)]">Log Fast — {date}</h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] text-xl">✕</button>
        </div>

        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-all',
                  type === t ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                )}
              >
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Status</label>
          <div className="grid grid-cols-2 gap-2">
            {STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={cn(
                  'py-2.5 rounded-xl text-sm font-medium transition-all border',
                  status === s
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                    : 'border-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                )}
              >
                {STATUS_CONFIG[s].icon} {STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {(status === 'broken' || status === 'excused') && (
          <div>
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">Reason (optional)</label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Illness, travel, menstruation..."
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
            />
          </div>
        )}

        <button
          onClick={() => onSave({ date, type, status, reason: reason || undefined })}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
        >
          Save
        </button>
      </motion.div>
    </motion.div>
  );
}

