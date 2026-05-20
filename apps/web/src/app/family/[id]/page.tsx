'use client';

import { useEffect, useState } from 'react';
import { use } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronLeft, ChevronRight, Building2, Moon, Clock, Check } from 'lucide-react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/family-store';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { BottomNav } from '@/components/ui/nav';
import { cn } from '@/lib/utils';
import { formatPrayerTime } from '@/lib/prayer-engine';
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

function offsetDate(base: string, delta: number): string {
  const d = new Date(base);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

export default function MemberDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { profiles, memberLogs, loadProfiles, loadLogsForDate, logPrayer } = useFamilyStore();
  const { times } = usePrayerTimesStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [modalPrayer, setModalPrayer] = useState<PrayerName | null>(null);

  const profile = profiles.find(p => p.id === id);
  const logs = memberLogs[id] ?? {};
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (profiles.length === 0) loadProfiles();
  }, []);

  useEffect(() => {
    loadLogsForDate(id, date);
  }, [id, date]);

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

  async function handleLog(prayer: PrayerName, status: PrayerStatus) {
    await logPrayer(id, prayer, status, date);
    setModalPrayer(null);
  }

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
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-5 space-y-4">
        {/* Date navigator */}
        <div className="flex items-center justify-between bg-[var(--bg-secondary)] rounded-2xl px-4 py-3">
          <button
            onClick={() => setDate(offsetDate(date, -1))}
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
            onClick={() => date < today && setDate(offsetDate(date, 1))}
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
                className="flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] rounded-xl"
                whileTap={{ scale: 0.98 }}
              >
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
                        logPrayer(id, prayer, 'on_time', date);
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
              </motion.div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex items-center justify-between">
          <span className="text-[var(--text-secondary)] text-sm">Prayers logged</span>
          <span className="font-semibold text-[var(--accent-primary)]">
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
            onClose={() => setModalPrayer(null)}
            onLog={handleLog}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MemberLogModal({ prayer, currentStatus, onClose, onLog }: {
  prayer: PrayerName;
  currentStatus?: PrayerStatus;
  onClose: () => void;
  onLog: (prayer: PrayerName, status: PrayerStatus) => Promise<void>;
}) {
  const statuses: { status: PrayerStatus; label: string; desc: string }[] = [
    { status: 'on_time',     label: 'On time',         desc: 'Prayed within the window' },
    { status: 'late',        label: 'Late',             desc: 'Prayed after the window' },
    { status: 'jamaah',      label: 'In jamaah',        desc: 'At the mosque' },
    { status: 'jamaah_home', label: 'Jamaah (home)',    desc: 'With family' },
    { status: 'qaza',        label: 'Qaza (make-up)',   desc: 'Making up a missed prayer' },
    { status: 'missed',      label: 'Missed',           desc: 'Did not pray' },
    { status: 'excused',     label: 'Excused',          desc: 'Illness, travel, etc.' },
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
              onClick={() => onLog(prayer, status)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                currentStatus === status
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              )}
            >
              <div>
                <div className="font-medium text-sm">{label}</div>
                <div className={cn('text-xs', currentStatus === status ? 'text-[#0D1421]/70' : 'text-[var(--text-tertiary)]')}>{desc}</div>
              </div>
              {currentStatus === status && <Check size={16} />}
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
