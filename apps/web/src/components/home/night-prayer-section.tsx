'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Plus, Check } from 'lucide-react';
import { getNightPrayersForDate, logNightPrayer, type NightPrayerLog, type NightPrayerType } from '@/lib/db';
import { todayString } from '@/lib/utils';
import { cn } from '@/lib/utils';

const NIGHT_PRAYERS: { type: NightPrayerType; label: string; arabic: string; desc: string }[] = [
  { type: 'tahajjud', label: 'Tahajjud', arabic: 'تهجد', desc: 'Night prayer — after midnight' },
  { type: 'witr', label: 'Witr', arabic: 'وتر', desc: 'Odd-unit closing prayer' },
  { type: 'taraweeh', label: 'Taraweeh', arabic: 'تراويح', desc: 'Ramadan night prayer' },
  { type: 'duha', label: 'Duha', arabic: 'ضحى', desc: 'Mid-morning voluntary prayer' },
  { type: 'qiyam', label: 'Qiyam', arabic: 'قيام', desc: 'Standing night worship' },
];

export function NightPrayerSection() {
  const [logs, setLogs] = useState<NightPrayerLog[]>([]);
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<NightPrayerType | null>(null);

  async function load() {
    const data = await getNightPrayersForDate(todayString());
    setLogs(data);
  }

  useEffect(() => { load(); }, []);

  const loggedTypes = new Set(logs.filter(l => l.completed).map(l => l.type));

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full flex items-center justify-between p-4"
      >
        <div className="flex items-center gap-2">
          <Moon size={16} className="text-[var(--accent-primary)]" />
          <span className="text-[var(--text-primary)] font-medium text-sm">Qiyam al-Layl</span>
          {loggedTypes.size > 0 && (
            <span className="text-xs bg-[var(--accent-primary)]/20 text-[var(--accent-primary)] px-2 py-0.5 rounded-full">
              {loggedTypes.size} logged
            </span>
          )}
        </div>
        <span className="text-[var(--text-tertiary)] text-xs">{expanded ? '▲' : '▼'}</span>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {NIGHT_PRAYERS.map(({ type, label, arabic, desc }) => {
                const isLogged = loggedTypes.has(type);
                const log = logs.find(l => l.type === type);
                return (
                  <div
                    key={type}
                    className={cn(
                      'flex items-center justify-between p-3 rounded-xl border transition-all',
                      isLogged ? 'border-[var(--accent-primary)]/40 bg-[var(--accent-primary)]/5' : 'border-[var(--bg-tertiary)]'
                    )}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[var(--text-primary)] text-sm font-medium">{label}</span>
                        <span className="font-arabic text-[var(--accent-primary)] text-sm">{arabic}</span>
                      </div>
                      <div className="text-[var(--text-tertiary)] text-xs">{desc}</div>
                      {isLogged && log?.rakats && (
                        <div className="text-[var(--accent-primary)] text-xs mt-0.5">{log.rakats} rakats</div>
                      )}
                    </div>
                    <button
                      onClick={() => isLogged ? null : setModal(type)}
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center transition-all',
                        isLogged
                          ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                          : 'border-2 border-[var(--bg-tertiary)] hover:border-[var(--accent-primary)] text-[var(--text-tertiary)]'
                      )}
                    >
                      {isLogged ? <Check size={14} /> : <Plus size={14} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modal && (
          <NightPrayerModal
            type={modal}
            onClose={() => setModal(null)}
            onSave={async (rakats, note) => {
              await logNightPrayer({
                date: todayString(),
                type: modal,
                rakats,
                completed: true,
                note,
              });
              load();
              setModal(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function NightPrayerModal({
  type,
  onClose,
  onSave,
}: {
  type: NightPrayerType;
  onClose: () => void;
  onSave: (rakats: number | undefined, note: string | undefined) => void;
}) {
  const info = NIGHT_PRAYERS.find(p => p.type === type)!;
  const [rakats, setRakats] = useState<number | undefined>(undefined);
  const [note, setNote] = useState('');

  const RAKAT_OPTIONS = [2, 4, 6, 8, 10, 12];

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
          <div>
            <div className="font-display text-lg text-[var(--text-primary)]">{info.label}</div>
            <div className="font-arabic text-[var(--accent-primary)]">{info.arabic}</div>
          </div>
          <button onClick={onClose} className="text-[var(--text-tertiary)] text-xl">✕</button>
        </div>

        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">
            Rakats prayed (optional)
          </label>
          <div className="flex gap-2 flex-wrap">
            {RAKAT_OPTIONS.map(r => (
              <button
                key={r}
                onClick={() => setRakats(rakats === r ? undefined : r)}
                className={cn(
                  'w-12 h-10 rounded-xl text-sm font-medium transition-all',
                  rakats === r ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                )}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">Note (optional)</label>
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Personal reflection…"
            className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
          />
        </div>

        <button
          onClick={() => onSave(rakats, note || undefined)}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
        >
          Log {info.label}
        </button>
      </motion.div>
    </motion.div>
  );
}
