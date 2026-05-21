'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Moon, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrayerName, PrayerStatus, PrayerLog } from '@/lib/db';
import { usePrayerStore } from '@/store/prayer-store';
import { getPrayerLabel } from '@/lib/terminology';
import type { Terminology } from '@/lib/db';
import { formatPrayerTime } from '@/lib/prayer-engine';
import type { PrayerTimesResult } from '@/lib/prayer-engine';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const STATUS_CONFIGS: Record<PrayerStatus, { label: string; dotClass: string; icon?: React.ReactNode }> = {
  on_time:     { label: 'On time',        dotClass: 'prayer-dot-on_time',  icon: <Check    size={14} /> },
  late:        { label: 'Late',           dotClass: 'prayer-dot-late',     icon: <Clock    size={14} /> },
  jamaah:      { label: 'In jamaah',      dotClass: 'prayer-dot-jamaah',   icon: <Building2 size={14} /> },
  jamaah_home: { label: 'Jamaah (home)',  dotClass: 'prayer-dot-jamaah',   icon: <Building2 size={14} /> },
  qaza:        { label: 'Qaza (made up)', dotClass: 'prayer-dot-qaza',     icon: <Moon     size={14} /> },
  missed:      { label: 'Missed',         dotClass: 'prayer-dot-missed' },
  excused:     { label: 'Excused',        dotClass: 'prayer-dot-excused' },
};

interface PrayerRowProps {
  prayer: PrayerName;
  times: PrayerTimesResult;
  log?: PrayerLog;
  terminology: Terminology;
  isCurrent?: boolean;
  isUpcoming?: boolean;
  cycleActive?: boolean;
}

export function PrayerRow({ prayer, times, log, terminology, isCurrent, isUpcoming, cycleActive }: PrayerRowProps) {
  const [showModal, setShowModal] = useState(false);
  const { logPrayer } = usePrayerStore();

  const time = times[prayer];
  const formattedTime = time ? formatPrayerTime(time) : '—';
  const label = getPrayerLabel(prayer, terminology);
  const status = log?.status;
  const config = status ? STATUS_CONFIGS[status] : null;

  async function handleQuickLog() {
    if (cycleActive && !log) {
      await logPrayer(prayer, 'excused');
    } else if (!log) {
      await logPrayer(prayer, 'on_time');
    } else {
      setShowModal(true);
    }
  }

  return (
    <>
      <motion.div
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-xl transition-colors',
          isCurrent ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)]',
          isUpcoming ? 'opacity-70' : ''
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Prayer name + time */}
        <div className="flex-1 min-w-0">
          <div className={cn('font-medium', isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
            {label}
          </div>
          <div className="text-[var(--text-tertiary)] text-sm font-mono">{formattedTime}</div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center gap-2">
          {status && (
            <span className="text-xs text-[var(--text-tertiary)]">
              {status === 'missed'
                ? log?.qazaFinalized ? 'Missed · qaza' : 'Missed · pending'
                : config?.label}
            </span>
          )}
          <button
            onClick={handleQuickLog}
            onContextMenu={e => { e.preventDefault(); setShowModal(true); }}
            className={cn('prayer-dot', config?.dotClass ?? 'prayer-dot-empty', 'cursor-pointer')}
            aria-label={`Log ${label}`}
          >
            {config?.icon && (
              <span className="text-[#0D1421]">{config.icon}</span>
            )}
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <LogModal
            prayer={prayer}
            label={label}
            currentStatus={status}
            onClose={() => setShowModal(false)}
            onLog={async (s) => { await logPrayer(prayer, s); setShowModal(false); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function LogModal({ prayer, label, currentStatus, onClose, onLog }: {
  prayer: PrayerName;
  label: string;
  currentStatus?: PrayerStatus;
  onClose: () => void;
  onLog: (status: PrayerStatus) => Promise<void>;
}) {
  const statuses: { status: PrayerStatus; label: string; desc: string }[] = [
    { status: 'on_time', label: 'On time', desc: 'Prayed within the window' },
    { status: 'late', label: 'Late', desc: 'Prayed after the window' },
    { status: 'jamaah', label: 'In jamaah', desc: 'At the mosque' },
    { status: 'jamaah_home', label: 'Jamaah (home)', desc: 'With family' },
    { status: 'qaza', label: 'Qaza (make-up)', desc: 'Making up a missed prayer' },
    { status: 'missed', label: 'Missed', desc: 'Did not pray' },
    { status: 'excused', label: 'Excused', desc: 'Illness, travel, etc.' },
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
        <h3 className="font-display text-xl text-[var(--text-primary)]">Log {label}</h3>
        <div className="space-y-1">
          {statuses.map(({ status, label: sl, desc }) => (
            <button
              key={status}
              onClick={() => onLog(status)}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                currentStatus === status
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]'
              )}
            >
              <div>
                <div className="font-medium text-sm">{sl}</div>
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
