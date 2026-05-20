'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Sun, Moon, Star } from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import { toHijri, HIJRI_MONTHS_EN, formatHijriDate, isSunnahFastDay, isWhiteDay, isRamadan, getDaySpecialStatus } from '@/lib/hijri';
import { usePrayerStore } from '@/store/prayer-store';
import { useUserStore } from '@/store/user-store';
import { getPrayerLabel } from '@/lib/terminology';
import { dateToString, stringToDate, addDays, isSameDay, todayString } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { PrayerLog, PrayerName } from '@/lib/db';
import { db } from '@/lib/db';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function getDaysInMonth(year: number, month: number): Date[] {
  const days: Date[] = [];
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  for (let d = firstDay; d <= lastDay; d = addDays(d, 1)) {
    days.push(new Date(d));
  }
  return days;
}

const STATUS_COLORS: Record<string, string> = {
  on_time: 'bg-[var(--accent-primary)]',
  jamaah: 'bg-[var(--accent-primary)] ring-1 ring-offset-1',
  late: 'bg-[var(--accent-secondary)]',
  qaza: 'bg-[var(--accent-secondary)] opacity-60',
  missed: 'bg-red-500',
  excused: 'bg-[var(--bg-tertiary)]',
};

export default function CalendarPage() {
  const today = new Date();
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [monthLogs, setMonthLogs] = useState<Record<string, PrayerLog[]>>({});
  const { profile } = useUserStore();
  const { loadForDate, todayLogs } = usePrayerStore();

  const terminology = (profile?.terminology ?? 'arabic') as any;

  useEffect(() => {
    loadMonthLogs();
  }, [viewDate]);

  useEffect(() => {
    loadForDate(dateToString(selectedDate));
  }, [selectedDate]);

  async function loadMonthLogs() {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const days = getDaysInMonth(year, month);
    const result: Record<string, PrayerLog[]> = {};
    for (const d of days) {
      const key = dateToString(d);
      result[key] = await db.prayerLog.where('date').equals(key).toArray();
    }
    setMonthLogs(result);
  }

  function prevMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  const days = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDayOfWeek = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1).getDay();
  const hijriMonth = toHijri(viewDate);
  const selectedLogs = monthLogs[dateToString(selectedDate)] ?? todayLogs ? Object.values(todayLogs) : [];
  const specialStatus = getDaySpecialStatus(selectedDate);

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <ChevronLeft size={20} className="text-[var(--text-secondary)]" />
            </button>
            <div className="text-center">
              <div className="text-[var(--text-primary)] font-medium">
                {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
              </div>
              <div className="font-arabic text-xs text-[var(--accent-primary)]">
                {hijriMonth.monthName} {hijriMonth.year} AH
              </div>
            </div>
            <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
              <ChevronRight size={20} className="text-[var(--text-secondary)]" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-6">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 text-center">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
            <div key={d} className="text-[var(--text-tertiary)] text-xs py-1">{d}</div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first week */}
          {Array.from({ length: firstDayOfWeek }).map((_, i) => (
            <div key={`e-${i}`} />
          ))}
          {days.map(day => {
            const key = dateToString(day);
            const logs = monthLogs[key] ?? [];
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            const hijri = toHijri(day);
            const isSunnah = isSunnahFastDay(day);
            const isWhite = isWhiteDay(day);
            const isRam = isRamadan(day);

            const logsMap = Object.fromEntries(logs.map(l => [l.prayer, l]));
            const prayedCount = logs.filter(l => l.status !== 'missed' && l.status !== 'excused').length;

            return (
              <button
                key={key}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'relative flex flex-col items-center py-2 rounded-xl transition-all',
                  isSelected ? 'bg-[var(--accent-primary)]' : isToday ? 'bg-[var(--bg-tertiary)]' : 'hover:bg-[var(--bg-secondary)]',
                  isRam ? 'ring-1 ring-[var(--accent-primary)]/30' : ''
                )}
              >
                {/* Gregorian day number */}
                <span className={cn(
                  'text-sm font-medium',
                  isSelected ? 'text-[#0D1421]' : isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                )}>
                  {day.getDate()}
                </span>
                {/* Hijri day number */}
                <span className={cn(
                  'text-[9px]',
                  isSelected ? 'text-[#0D1421]/70' : 'text-[var(--text-tertiary)]'
                )}>
                  {hijri.day}
                </span>
                {/* Special day indicators */}
                <div className="flex gap-0.5 mt-0.5">
                  {isSunnah && !isSelected && <div className="w-1 h-1 rounded-full bg-blue-400" />}
                  {isWhite && !isSelected && <div className="w-1 h-1 rounded-full bg-yellow-300" />}
                  {logs.length > 0 && !isSelected && (
                    <div className={cn('w-1 h-1 rounded-full', prayedCount >= 4 ? 'bg-[var(--accent-primary)]' : 'bg-orange-400')} />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-xs text-[var(--text-tertiary)] justify-center">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-blue-400" /> Sunnah fast</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-yellow-300" /> White day</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" /> Prayers logged</div>
        </div>

        {/* Selected day detail */}
        <motion.div
          key={dateToString(selectedDate)}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-4"
        >
          <div>
            <div className="text-[var(--text-primary)] font-medium">
              {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </div>
            <div className="font-arabic text-sm text-[var(--accent-primary)]">
              {formatHijriDate(selectedDate)}
            </div>
          </div>

          {/* Special day info */}
          {(specialStatus.isSunnahFast || specialStatus.isWhiteDay || specialStatus.events.length > 0) && (
            <div className="space-y-1">
              {specialStatus.isSunnahFast && (
                <div className="flex items-center gap-2 text-blue-400 text-xs">
                  <Moon size={12} /> Sunnah fast day (Monday/Thursday)
                </div>
              )}
              {specialStatus.isWhiteDay && (
                <div className="flex items-center gap-2 text-yellow-400 text-xs">
                  <Star size={12} /> White Day fasting recommended
                </div>
              )}
              {specialStatus.events.map(e => (
                <div key={e.name} className="flex items-center gap-2 text-[var(--accent-primary)] text-xs">
                  <Sun size={12} /> {e.name} — {e.description}
                </div>
              ))}
            </div>
          )}

          {/* Prayer logs for this day */}
          <div className="space-y-1">
            {PRAYERS.map(prayer => {
              const logs = monthLogs[dateToString(selectedDate)] ?? [];
              const log = logs.find(l => l.prayer === prayer);
              return (
                <div key={prayer} className="flex items-center justify-between py-1">
                  <span className="text-[var(--text-secondary)] text-sm">{getPrayerLabel(prayer, terminology)}</span>
                  <span className={cn(
                    'text-xs px-2 py-0.5 rounded-full',
                    log?.status === 'on_time' ? 'bg-[var(--accent-primary)] text-[#0D1421]' :
                    log?.status === 'jamaah' ? 'bg-[var(--accent-primary)] text-[#0D1421]' :
                    log?.status === 'late' ? 'bg-[var(--accent-secondary)] text-white' :
                    log?.status === 'missed' ? 'bg-red-500/20 text-red-400' :
                    log?.status === 'excused' ? 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]' :
                    log?.status === 'qaza' ? 'bg-[var(--accent-secondary)]/30 text-[var(--accent-primary)]' :
                    'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]'
                  )}>
                    {log?.status ? log.status.replace('_', ' ') : 'not logged'}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <BottomNav />
    </div>
  );
}
