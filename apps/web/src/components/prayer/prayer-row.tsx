'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Moon, Clock, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PrayerName, PrayerStatus, PrayerLog } from '@/lib/db';
import { usePrayerStore } from '@/store/prayer-store';
import { getPrayerLabel, getJumuahLabel } from '@/lib/terminology';
import type { Terminology } from '@/lib/db';
import { formatPrayerTime } from '@/lib/prayer-engine';
import type { PrayerTimesResult } from '@/lib/prayer-engine';

// ─── Sunnah context per prayer ────────────────────────────────────────────────

const SUNNAH_CONFIG: Record<PrayerName, { label: string; rakats: string }> = {
  fajr:    { label: 'Fajr sunnah',    rakats: '2 rakats before (Muakkadah)' },
  dhuhr:   { label: 'Dhuhr sunnah',   rakats: '4 before · 2 after (Muakkadah)' },
  asr:     { label: 'Asr sunnah',     rakats: '4 rakats before (Ghair Muakkadah)' },
  maghrib: { label: 'Maghrib sunnah', rakats: '2 rakats after (Muakkadah)' },
  isha:    { label: 'Isha sunnah',    rakats: '2 after · witr (Muakkadah)' },
};

const POSITIVE_STATUSES: PrayerStatus[] = ['on_time', 'late', 'jamaah', 'jamaah_home'];

// ─── Status config ────────────────────────────────────────────────────────────

const STATUS_CONFIGS: Record<PrayerStatus, { label: string; dotClass: string; icon?: React.ReactNode }> = {
  on_time:     { label: 'On time',        dotClass: 'prayer-dot-on_time',  icon: <Check    size={14} /> },
  late:        { label: 'Late',           dotClass: 'prayer-dot-late',     icon: <Clock    size={14} /> },
  jamaah:      { label: 'In jamaah',      dotClass: 'prayer-dot-jamaah',   icon: <Building2 size={14} /> },
  jamaah_home: { label: 'Jamaah (home)',  dotClass: 'prayer-dot-jamaah',   icon: <Building2 size={14} /> },
  qaza:        { label: 'Qaza (made up)', dotClass: 'prayer-dot-qaza',     icon: <Moon     size={14} /> },
  missed:      { label: 'Missed',         dotClass: 'prayer-dot-missed' },
  excused:     { label: 'Excused',        dotClass: 'prayer-dot-excused' },
};

// ─── PrayerRow ────────────────────────────────────────────────────────────────

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

  const isFriday = new Date().getDay() === 5;
  const isJumua  = prayer === 'dhuhr' && isFriday;

  const time          = times[prayer];
  const formattedTime = time ? formatPrayerTime(time) : '—';
  const label         = isJumua ? getJumuahLabel(terminology) : getPrayerLabel(prayer, terminology);
  const status        = log?.status;
  const config        = status ? STATUS_CONFIGS[status] : null;
  const hasSunnah     = log?.sunnahPrayed === true;

  const statusLabel = isJumua && status === 'jamaah'
    ? "At masjid (Jumu'ah)"
    : isJumua && status === 'jamaah_home'
    ? 'Prayed Zuhr at home'
    : status === 'missed'
    ? (log?.qazaFinalized ? 'Missed · qaza' : 'Missed · pending')
    : config?.label;

  async function handleQuickLog() {
    if (cycleActive && !log) {
      await logPrayer(prayer, 'excused');
    } else if (!log) {
      await logPrayer(prayer, isJumua ? 'jamaah' : 'on_time');
    } else {
      setShowModal(true);
    }
  }

  return (
    <>
      <motion.div
        className={cn(
          'flex items-center justify-between px-4 py-3 rounded-xl transition-colors',
          isCurrent  ? 'bg-[var(--bg-tertiary)]' : 'bg-[var(--bg-secondary)]',
          isUpcoming ? 'opacity-70' : '',
        )}
        whileTap={{ scale: 0.98 }}
      >
        {/* Prayer name + time */}
        <div className="flex-1 min-w-0">
          <div className={cn('font-medium flex items-center gap-1.5', isCurrent ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]')}>
            {label}
            {isJumua && (
              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] font-medium uppercase tracking-wide">
                Friday
              </span>
            )}
          </div>
          <div className="text-[var(--text-tertiary)] text-sm font-mono">{formattedTime}</div>
        </div>

        {/* Status + sunnah indicator */}
        <div className="flex items-center gap-2">
          {status && (
            <span className="text-xs text-[var(--text-tertiary)]">{statusLabel}</span>
          )}
          {/* Sunnah indicator badge */}
          {hasSunnah && (
            <span className="text-[9px] font-bold text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded-full leading-none">
              +S
            </span>
          )}
          <div className="relative">
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
        </div>
      </motion.div>

      <AnimatePresence>
        {showModal && (
          <LogModal
            prayer={prayer}
            label={label}
            currentStatus={status}
            currentSunnah={log?.sunnahPrayed}
            isJumua={isJumua}
            onClose={() => setShowModal(false)}
            onLog={async (s, sunnah) => {
              await logPrayer(prayer, s, sunnah !== undefined ? { sunnahPrayed: sunnah } : {});
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// ─── LogModal ─────────────────────────────────────────────────────────────────

function LogModal({
  prayer, label, currentStatus, currentSunnah, isJumua, onClose, onLog,
}: {
  prayer: PrayerName;
  label: string;
  currentStatus?: PrayerStatus;
  currentSunnah?: boolean;
  isJumua?: boolean;
  onClose: () => void;
  onLog: (status: PrayerStatus, sunnahPrayed?: boolean) => Promise<void>;
}) {
  const [selectedStatus, setSelectedStatus] = useState<PrayerStatus | null>(currentStatus ?? null);
  const [sunnahPrayed,   setSunnahPrayed]   = useState(currentSunnah ?? false);
  const [saving,         setSaving]         = useState(false);

  const isPositive = selectedStatus ? POSITIVE_STATUSES.includes(selectedStatus) : false;
  const sunnah     = SUNNAH_CONFIG[prayer];

  const statuses: { status: PrayerStatus; label: string; desc: string }[] = isJumua
    ? [
        { status: 'jamaah',      label: "At masjid — Jumu'ah", desc: "Attended Jumu'ah prayer in congregation" },
        { status: 'jamaah_home', label: 'Prayed Zuhr at home',  desc: 'Could not attend Jumu\'ah, prayed Zuhr' },
        { status: 'on_time',     label: 'On time',              desc: 'Prayed within the window' },
        { status: 'late',        label: 'Late Zuhr',            desc: 'Prayed after the Dhuhr window' },
        { status: 'qaza',        label: 'Qaza (make-up)',       desc: 'Making up a missed prayer' },
        { status: 'missed',      label: 'Missed',               desc: 'Did not pray' },
        { status: 'excused',     label: 'Excused',              desc: 'Illness, travel, etc.' },
      ]
    : [
        { status: 'on_time',     label: 'On time',              desc: 'Prayed within the window' },
        { status: 'late',        label: 'Late',                 desc: 'Prayed after the window' },
        { status: 'jamaah',      label: 'In jamaah',            desc: 'At the mosque' },
        { status: 'jamaah_home', label: 'Jamaah (home)',        desc: 'With family' },
        { status: 'qaza',        label: 'Qaza (make-up)',       desc: 'Making up a missed prayer' },
        { status: 'missed',      label: 'Missed',               desc: 'Did not pray' },
        { status: 'excused',     label: 'Excused',              desc: 'Illness, travel, etc.' },
      ];

  async function handleStatusTap(status: PrayerStatus) {
    if (saving) return;
    setSaving(true);
    const newIsPositive = POSITIVE_STATUSES.includes(status);
    setSelectedStatus(status);
    // If switching away from a positive status, clear sunnah
    if (!newIsPositive) setSunnahPrayed(false);
    await onLog(status, newIsPositive ? sunnahPrayed : undefined);
    setSaving(false);
  }

  async function handleSunnahToggle() {
    if (!selectedStatus || saving) return;
    setSaving(true);
    const next = !sunnahPrayed;
    setSunnahPrayed(next);
    await onLog(selectedStatus, next);
    setSaving(false);
  }

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
        className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] rounded-t-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-8 h-1 bg-[var(--bg-tertiary)] rounded-full mx-auto" />
        <div>
          <h3 className="font-display text-xl text-[var(--text-primary)]">
            Log {label}
            {isJumua && <span className="text-sm text-[var(--accent-primary)] ml-2 font-normal">· Friday</span>}
          </h3>
          {isJumua && (
            <p className="text-[var(--text-tertiary)] text-xs mt-1">
              Jumu'ah is obligatory for men. Women may pray Zuhr at home.
            </p>
          )}
        </div>

        {/* Prayer status options */}
        <div className="space-y-1">
          {statuses.map(({ status, label: sl, desc }) => (
            <button
              key={status}
              onClick={() => handleStatusTap(status)}
              disabled={saving}
              className={cn(
                'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                selectedStatus === status
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)] hover:bg-[var(--bg-primary)]',
              )}
            >
              <div>
                <div className="font-medium text-sm">{sl}</div>
                <div className={cn('text-xs', selectedStatus === status ? 'text-[#0D1421]/70' : 'text-[var(--text-tertiary)]')}>
                  {desc}
                </div>
              </div>
              {selectedStatus === status && <Check size={16} />}
            </button>
          ))}
        </div>

        {/* Sunnah section — appears for any positive fard status */}
        <AnimatePresence>
          {isPositive && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-[var(--bg-tertiary)] pt-3 space-y-2">
                <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">
                  Sunnah prayers
                </div>
                <button
                  onClick={handleSunnahToggle}
                  disabled={saving}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left',
                    sunnahPrayed
                      ? 'bg-emerald-400/15 text-emerald-400'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                  )}
                >
                  {/* Checkbox circle */}
                  <div className={cn(
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all',
                    sunnahPrayed
                      ? 'bg-emerald-400 border-emerald-400 text-white'
                      : 'border-current',
                  )}>
                    {sunnahPrayed && <Check size={11} />}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-medium">{sunnah.label}</div>
                    <div className="text-xs opacity-70 mt-0.5">{sunnah.rakats}</div>
                  </div>
                  {sunnahPrayed && (
                    <span className="ml-auto text-emerald-400 text-xs font-semibold shrink-0">✓ Saved</span>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
