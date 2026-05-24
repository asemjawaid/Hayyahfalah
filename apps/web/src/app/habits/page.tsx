'use client';

import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Moon, Sun, Plus, Check, Share2, Flame,
  RotateCcw, X, Trash2, UtensilsCrossed, Star, Search, ChevronDown, ChevronUp,
} from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import {
  db,
  getHabitDefs, addHabitDef, deleteHabitDef,
  getHabitLogsForDate, logHabitValue,
  getQuranTotalPages, getQuranTodayPages, getQuranRecentLogs, QURAN_HABIT_ID,
  logFast, getActiveCycle, getFastingStreak, getAllTimeMakeupFastsOwed, getFastingLogForDate,
  getSetting, setSetting,
  type HabitDef, type HabitLog, type HabitType, type FastingLog, type FastType, type FastStatus,
} from '@/lib/db';
import { formatHijriDate, isSunnahFastDay, isWhiteDay, toHijri } from '@/lib/hijri';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { useUserStore } from '@/store/user-store';
import { formatPrayerTime } from '@/lib/prayer-engine';
import { todayString, cn } from '@/lib/utils';
import { DUAS, DUA_CATEGORIES, searchDuas, getDuasByCategory, type DuaCategory, type Dua } from '@/lib/duas';
import { useT } from '@/lib/i18n';

// ─── Constants ────────────────────────────────────────────────────────────────

type TabId = 'today' | 'quran' | 'fast' | 'dhikr' | 'dua';

const TABS: { id: TabId; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'quran', label: 'Quran' },
  { id: 'fast',  label: 'Fast' },
  { id: 'dhikr', label: 'Dhikr' },
  { id: 'dua',   label: 'Dua' },
];

const PRESET_HABITS: Omit<HabitDef, 'id' | 'createdAt' | 'active'>[] = [
  { type: 'quran',           label: 'Read Quran',       emoji: '📖', targetValue: 5,   targetUnit: 'pages'   },
  { type: 'quran_memorize',  label: 'Memorise Quran',   emoji: '🧠', targetValue: 3,   targetUnit: 'ayahs'   },
  { type: 'adhkar',          label: 'Morning Adhkar',   emoji: '🤲', targetValue: 1,   targetUnit: 'session' },
  { type: 'dhikr',           label: 'Dhikr',            emoji: '📿', targetValue: 100, targetUnit: 'times'   },
  { type: 'sadaqa',          label: 'Give Sadaqa',      emoji: '💰', targetValue: 1,   targetUnit: 'act'     },
  { type: 'sadaqa_jariyah',  label: 'Sadaqa Jariyah',   emoji: '🌱', targetValue: 1,   targetUnit: 'act'     },
  { type: 'study',           label: 'Islamic Study',    emoji: '📚', targetValue: 15,  targetUnit: 'min'     },
  { type: 'qiyam',           label: 'Qiyam al-Layl',   emoji: '🌙', targetValue: 1,   targetUnit: 'night'   },
  { type: 'sunnah_fast',     label: 'Sunnah Fast',      emoji: '🍊', targetValue: 1,   targetUnit: 'fast'    },
  { type: 'kindness',        label: 'Act of Kindness',  emoji: '🤝', targetValue: 1,   targetUnit: 'act'     },
  { type: 'water',           label: 'Drink Water',      emoji: '💧', targetValue: 8,   targetUnit: 'glasses' },
  { type: 'exercise',        label: 'Exercise',         emoji: '🏃', targetValue: 30,  targetUnit: 'min'     },
  { type: 'sleep',           label: 'Sleep on time',    emoji: '💤', targetValue: 1,   targetUnit: 'night'   },
];

const CUSTOM_EMOJIS = ['✨', '⭐', '🎯', '💪', '🙏', '🌸', '🔑', '🌟', '📝', '🎨', '🧘', '🌿'];

const DHIKR_OPTIONS = [
  { id: 'subhanallah',      label: 'SubhanAllah',         arabic: 'سُبْحَانَ اللَّه',                                                                    transliteration: 'SubḥānAllāh',                                                         target: 33  },
  { id: 'alhamdulillah',   label: 'Alhamdulillah',       arabic: 'الْحَمْدُ لِلَّه',                                                                    transliteration: 'Alḥamdulillāh',                                                       target: 33  },
  { id: 'allahu_akbar',    label: 'Allahu Akbar',         arabic: 'اللَّهُ أَكْبَر',                                                                     transliteration: 'Allāhu Akbar',                                                         target: 34  },
  { id: 'la_ilaha',        label: 'Lā ilāha illallāh',   arabic: 'لَا إِلٰهَ إِلَّا اللَّه',                                                            transliteration: 'Lā ilāha illAllāh',                                                    target: 100 },
  { id: 'astaghfirullah',  label: 'Astaghfirullāh',      arabic: 'أَسْتَغْفِرُ اللَّه',                                                                 transliteration: 'Astaghfirullāh',                                                       target: 100 },
  { id: 'salawat',         label: 'Salawāt',              arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّد',                                                     transliteration: 'Allāhumma ṣalli ʿalā Muḥammad',                                       target: 100 },
  { id: 'dua_yunus',       label: 'Dua of Yunus',         arabic: 'لَا إِلَٰهَ إِلَّا أَنتَ سُبْحَانَكَ إِنِّي كُنتُ مِنَ الظَّالِمِينَ',              transliteration: 'Lā ilāha illā anta subḥānaka innī kuntu mina ẓ-ẓālimīn',               target: 40  },
  { id: 'hasbiyallah',     label: 'Hasbiyallāh',          arabic: 'حَسْبِيَ اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ عَلَيْهِ تَوَكَّلْتُ',                     transliteration: 'Ḥasbiyallāhu lā ilāha illā huwa ʿalayhi tawakkaltu',                  target: 7   },
  { id: 'la_hawla',        label: 'La Hawla',             arabic: 'لَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللَّه',                                            transliteration: 'Lā ḥawla wa lā quwwata illā billāh',                                  target: 100 },
  { id: 'subhanallah_azim',label: 'SubhānAllāh wa Biḥamdih', arabic: 'سُبْحَانَ اللَّهِ وَبِحَمْدِهِ',                                                 transliteration: 'SubḥānAllāhi wa biḥamdihī',                                            target: 100 },
  { id: 'laylatul_qadr',   label: 'Dua of Forgiveness',   arabic: 'اللَّهُمَّ إِنَّكَ عَفُوٌّ تُحِبُّ الْعَفْوَ فَاعْفُ عَنِّي',                       transliteration: "Allāhumma innaka ʿafuwwun tuḥibbul-ʿafwa faʿfu ʿannī",                target: 100 },
];

// Post-prayer tasbih sequence (SubhānAllāh×33, Alḥamdulillāh×33, Allāhu Akbar×34)
const PRAYER_SEQUENCE = [
  { id: 'subhanallah',   label: 'SubhānAllāh',   arabic: 'سُبْحَانَ اللَّه',  transliteration: 'SubḥānAllāh',   target: 33 },
  { id: 'alhamdulillah', label: 'Alḥamdulillāh', arabic: 'الْحَمْدُ لِلَّه',  transliteration: 'Alḥamdulillāh', target: 33 },
  { id: 'allahu_akbar',  label: 'Allāhu Akbar',   arabic: 'اللَّهُ أَكْبَر',   transliteration: 'Allāhu Akbar',   target: 34 },
] as const;

const TARGET_PRESETS = [7, 11, 33, 34, 99, 100, 300, 1000];

const FAST_STATUS_CONFIG: Record<FastStatus, { label: string; color: string; icon: string }> = {
  completed: { label: 'Completed', color: 'text-emerald-400', icon: '✓' },
  partial:   { label: 'Partial',   color: 'text-amber-400',   icon: '◑' },
  broken:    { label: 'Broke fast',color: 'text-rose-400',    icon: '✗' },
  excused:   { label: 'Excused',   color: 'text-sky-400',     icon: '~' },
};

const TYPE_LABELS: Record<FastType, string> = {
  ramadan: 'Ramadan', sunnah: 'Sunnah', makeup: 'Makeup',
  voluntary: 'Voluntary', nadhr: 'Vow (Nadhr)',
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HabitsPage() {
  const [tab, setTab] = useState<TabId>('today');
  const today = new Date();
  const t = useT();

  const TAB_LABELS: Record<TabId, string> = {
    today: t('tab_today'),
    quran: t('tab_quran'),
    fast:  t('tab_fast'),
    dhikr: t('tab_dhikr'),
    dua:   t('tab_dua'),
  };

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">{t('page_habits')}</h1>
          <p className="text-[var(--text-tertiary)] text-xs">{formatHijriDate(today)}</p>
        </div>
        <div className="max-w-lg mx-auto px-4 flex gap-2 pb-3 overflow-x-auto">
          {TABS.map(tab_ => (
            <button
              key={tab_.id}
              onClick={() => setTab(tab_.id)}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium transition-all whitespace-nowrap',
                tab === tab_.id
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
              )}
            >
              {TAB_LABELS[tab_.id]}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-4">
        {tab === 'today' && <TodayTab />}
        {tab === 'quran' && <QuranTab />}
        {tab === 'fast'  && <FastTab />}
        {tab === 'dhikr' && <DhikrTab />}
        {tab === 'dua'   && <DuaTab />}
      </div>

      <BottomNav />
    </div>
  );
}

// ─── Today Tab ────────────────────────────────────────────────────────────────

function TodayTab() {
  const [habits, setHabits] = useState<HabitDef[]>([]);
  const [logs,   setLogs]   = useState<HabitLog[]>([]);
  const [showAddSheet,  setShowAddSheet]  = useState(false);
  const [activeHabit,   setActiveHabit]   = useState<HabitDef | null>(null);
  const today = todayString();

  const load = useCallback(async () => {
    const [defs, dayLogs] = await Promise.all([
      getHabitDefs(),
      getHabitLogsForDate(today),
    ]);
    setHabits(defs);
    setLogs(dayLogs);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  const getLog  = (hid: string) => logs.find(l => l.habitId === hid);
  const getValue = (h: HabitDef) => getLog(h.id)?.value ?? 0;
  const isDone  = (h: HabitDef) => getValue(h) >= h.targetValue;
  const doneCount = habits.filter(isDone).length;

  const RING_R = 44;
  const CIRC   = 2 * Math.PI * RING_R;
  const progress = habits.length > 0 ? doneCount / habits.length : 0;

  return (
    <div className="space-y-4">
      {/* Completion summary */}
      {habits.length > 0 && (
        <div className="flex items-center gap-4 bg-[var(--bg-secondary)] rounded-2xl p-4">
          <svg width={104} height={104} className="-rotate-90 shrink-0">
            <circle cx={52} cy={52} r={RING_R} stroke="var(--bg-tertiary)" strokeWidth={9} fill="none" />
            <circle
              cx={52} cy={52} r={RING_R}
              stroke="var(--accent-primary)" strokeWidth={9} fill="none"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - progress)}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="flex-1">
            <div className="text-3xl font-bold text-[var(--text-primary)]">
              {doneCount}
              <span className="text-[var(--text-tertiary)] text-xl font-normal">/{habits.length}</span>
            </div>
            <div className="text-[var(--text-tertiary)] text-xs mb-2">habits done today</div>
            {doneCount === habits.length ? (
              <div className="text-[var(--accent-primary)] text-sm font-medium">All done! 🌟 MashAllah</div>
            ) : (
              <div className="text-[var(--text-secondary)] text-sm">
                {habits.length - doneCount} remaining
              </div>
            )}
          </div>
        </div>
      )}

      {/* Habit list */}
      {habits.length === 0 ? (
        <EmptyHabitsState onAdd={() => setShowAddSheet(true)} />
      ) : (
        <div className="space-y-2">
          {habits.map(h => (
            <HabitCard
              key={h.id}
              habit={h}
              value={getValue(h)}
              onTap={() => setActiveHabit(h)}
              onDelete={async () => { await deleteHabitDef(h.id); await load(); }}
            />
          ))}
        </div>
      )}

      {/* Add button */}
      <button
        onClick={() => setShowAddSheet(true)}
        className="w-full py-3 border-2 border-dashed border-[var(--bg-tertiary)] rounded-2xl text-[var(--text-tertiary)] text-sm flex items-center justify-center gap-2 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
      >
        <Plus size={16} /> Add habit
      </button>

      {/* Quick-log sheet */}
      <AnimatePresence>
        {activeHabit && (
          <QuickLogSheet
            habit={activeHabit}
            currentValue={getValue(activeHabit)}
            onClose={() => setActiveHabit(null)}
            onLog={async (val) => {
              await logHabitValue(activeHabit.id, today, val);
              await load();
              setActiveHabit(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Add-habit sheet */}
      <AnimatePresence>
        {showAddSheet && (
          <AddHabitSheet
            existingTypes={habits.map(h => h.type)}
            onClose={() => setShowAddSheet(false)}
            onAdd={async (def) => {
              await addHabitDef({ ...def, active: true });
              await load();
              setShowAddSheet(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Habit Card ───────────────────────────────────────────────────────────────

function HabitCard({
  habit, value, onTap, onDelete,
}: {
  habit: HabitDef;
  value: number;
  onTap: () => void;
  onDelete: () => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const ratio  = Math.min(1, value / habit.targetValue);
  const done   = value >= habit.targetValue;

  return (
    <motion.div
      className={cn(
        'relative flex items-center gap-3 p-4 rounded-2xl transition-all cursor-pointer overflow-hidden',
        done
          ? 'bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30'
          : 'bg-[var(--bg-secondary)] border border-transparent',
      )}
      whileTap={{ scale: 0.98 }}
      onClick={onTap}
    >
      <div className="text-2xl select-none">{habit.emoji}</div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className={cn('font-medium text-sm', done ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]')}>
            {habit.label}
          </span>
          <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
            {value}/{habit.targetValue} {habit.targetUnit}
          </span>
        </div>
        <div className="h-1.5 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
            style={{ width: `${ratio * 100}%` }}
          />
        </div>
      </div>
      {done ? (
        <Check size={18} className="text-[var(--accent-primary)] shrink-0" />
      ) : (
        <div
          className="p-1.5 rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors"
          onClick={e => { e.stopPropagation(); setConfirmDelete(c => !c); }}
        >
          <Trash2 size={14} className="text-[var(--text-tertiary)]" />
        </div>
      )}

      {/* Inline delete confirm */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute inset-0 bg-[var(--bg-tertiary)] rounded-2xl flex items-center justify-center gap-3 px-4"
            onClick={e => e.stopPropagation()}
          >
            <span className="text-[var(--text-secondary)] text-sm">Remove habit?</span>
            <button
              onClick={onDelete}
              className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-sm font-medium"
            >
              Remove
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 bg-[var(--bg-secondary)] text-[var(--text-secondary)] rounded-lg text-sm"
            >
              Cancel
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Quick Log Sheet ──────────────────────────────────────────────────────────

function QuickLogSheet({
  habit, currentValue, onClose, onLog,
}: {
  habit: HabitDef;
  currentValue: number;
  onClose: () => void;
  onLog: (value: number) => void;
}) {
  const [val, setVal] = useState(currentValue);
  const isBinary = habit.targetValue === 1;

  if (isBinary) {
    return (
      <BottomSheet onClose={onClose} title={`Log ${habit.label}`} emoji={habit.emoji}>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => onLog(1)}
            className="py-4 rounded-2xl bg-[var(--accent-primary)] text-[#0D1421] font-semibold flex flex-col items-center gap-1"
          >
            <Check size={22} />
            <span className="text-sm">Done ✓</span>
          </button>
          <button
            onClick={() => onLog(0)}
            className="py-4 rounded-2xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] font-semibold flex flex-col items-center gap-1"
          >
            <X size={22} />
            <span className="text-sm">Not yet</span>
          </button>
        </div>
      </BottomSheet>
    );
  }

  return (
    <BottomSheet onClose={onClose} title={`Log ${habit.label}`} emoji={habit.emoji}>
      <div className="space-y-4">
        {/* Progress */}
        <div className="text-center">
          <div className="text-4xl font-bold text-[var(--text-primary)] tabular-nums">{val}</div>
          <div className="text-[var(--text-tertiary)] text-sm">of {habit.targetValue} {habit.targetUnit}</div>
          {val >= habit.targetValue && (
            <div className="text-[var(--accent-primary)] text-sm mt-1">Target reached! 🌟</div>
          )}
        </div>

        {/* +/- controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => setVal(v => Math.max(0, v - 1))}
            className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-2xl font-bold flex items-center justify-center"
          >
            −
          </button>
          <input
            type="text"
            inputMode="decimal"
            pattern="[0-9]*"
            value={val}
            onChange={e => {
              const n = parseInt(e.target.value, 10);
              if (!isNaN(n) && n >= 0) setVal(n);
            }}
            className="w-20 text-center text-2xl font-bold bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl py-2 focus:outline-none"
          />
          <button
            onClick={() => setVal(v => v + 1)}
            className="w-14 h-14 rounded-full bg-[var(--accent-primary)] text-[#0D1421] text-2xl font-bold flex items-center justify-center"
          >
            +
          </button>
        </div>

        <button
          onClick={() => onLog(val)}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
        >
          Save
        </button>
      </div>
    </BottomSheet>
  );
}

// ─── Add Habit Sheet ──────────────────────────────────────────────────────────

function AddHabitSheet({
  existingTypes, onClose, onAdd,
}: {
  existingTypes: HabitType[];
  onClose: () => void;
  onAdd: (def: Omit<HabitDef, 'id' | 'createdAt' | 'active'>) => void;
}) {
  const [showCustom, setShowCustom] = useState(false);
  const [customLabel, setCustomLabel] = useState('');
  const [customEmoji, setCustomEmoji] = useState('✨');
  const [customTarget, setCustomTarget] = useState('1');
  const [customUnit,   setCustomUnit]   = useState('time');

  const available = PRESET_HABITS.filter(p => !existingTypes.includes(p.type));

  function submitCustom() {
    if (!customLabel.trim()) return;
    onAdd({
      type: 'custom',
      label: customLabel.trim(),
      emoji: customEmoji,
      targetValue: Math.max(1, parseInt(customTarget, 10) || 1),
      targetUnit: customUnit.trim() || 'time',
    });
  }

  return (
    <BottomSheet onClose={onClose} title="Add a habit">
      {!showCustom ? (
        <div className="space-y-3">
          <div className="grid grid-cols-1 gap-2">
            {available.map(p => (
              <button
                key={p.type}
                onClick={() => onAdd(p)}
                className="flex items-center gap-3 p-3 rounded-xl bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] transition-colors text-left"
              >
                <span className="text-xl">{p.emoji}</span>
                <div className="flex-1">
                  <div className="text-[var(--text-primary)] text-sm font-medium">{p.label}</div>
                  <div className="text-[var(--text-tertiary)] text-xs">
                    Target: {p.targetValue} {p.targetUnit}/day
                  </div>
                </div>
                <Plus size={16} className="text-[var(--accent-primary)]" />
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowCustom(true)}
            className="w-full py-3 border-2 border-dashed border-[var(--bg-tertiary)] rounded-xl text-[var(--text-tertiary)] text-sm flex items-center justify-center gap-2 hover:border-[var(--accent-primary)] hover:text-[var(--accent-primary)] transition-colors"
          >
            <Plus size={16} /> Create custom habit
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <button
            onClick={() => setShowCustom(false)}
            className="text-[var(--accent-primary)] text-sm"
          >
            ← Back to presets
          </button>

          {/* Emoji picker */}
          <div>
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">
              Emoji
            </label>
            <div className="flex flex-wrap gap-2">
              {CUSTOM_EMOJIS.map(e => (
                <button
                  key={e}
                  onClick={() => setCustomEmoji(e)}
                  className={cn(
                    'w-10 h-10 rounded-xl text-xl transition-all',
                    customEmoji === e
                      ? 'bg-[var(--accent-primary)]'
                      : 'bg-[var(--bg-tertiary)]',
                  )}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
              Habit name
            </label>
            <input
              autoFocus
              value={customLabel}
              onChange={e => setCustomLabel(e.target.value)}
              placeholder="e.g. Memorise a dua"
              className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
                Daily target
              </label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9]*"
                value={customTarget}
                onChange={e => setCustomTarget(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>
            <div>
              <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
                Unit
              </label>
              <input
                value={customUnit}
                onChange={e => setCustomUnit(e.target.value)}
                placeholder="times"
                className="w-full px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={submitCustom}
            disabled={!customLabel.trim()}
            className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-40"
          >
            Add {customEmoji} {customLabel || 'habit'}
          </button>
        </div>
      )}
    </BottomSheet>
  );
}

// ─── Quran Tab ────────────────────────────────────────────────────────────────

const QURAN_TOTAL = 604;
const QURAN_JUZ   = 30;

function QuranTab() {
  const [totalPages, setTotalPages] = useState(0);
  const [todayPages, setTodayPages] = useState(0);
  const [dailyTarget, setDailyTarget] = useState(5);
  const [recentLogs,  setRecentLogs]  = useState<HabitLog[]>([]);
  const [showLogSheet, setShowLogSheet] = useState(false);
  const [newPages, setNewPages] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const today = todayString();

  const load = useCallback(async () => {
    const [tot, tod, logs, target] = await Promise.all([
      getQuranTotalPages(),
      getQuranTodayPages(today),
      getQuranRecentLogs(14),
      getSetting('quran_daily_target'),
    ]);
    setTotalPages(tot);
    setTodayPages(tod);
    setRecentLogs(logs);
    if (target) setDailyTarget(Math.max(1, parseInt(target, 10)));
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function logReading() {
    const pages = parseInt(newPages, 10);
    if (!pages || pages < 1) return;
    setIsSaving(true);
    const newTotal = todayPages + pages;
    await logHabitValue(QURAN_HABIT_ID, today, newTotal);
    await load();
    setNewPages('');
    setIsSaving(false);
    setShowLogSheet(false);
  }

  async function saveTarget(t: number) {
    setDailyTarget(t);
    await setSetting('quran_daily_target', String(t));
  }

  const pct          = Math.min(1, totalPages / QURAN_TOTAL);
  const juzDone      = (totalPages / QURAN_TOTAL) * QURAN_JUZ;
  const todayPct     = Math.min(1, todayPages / dailyTarget);
  const RING_R       = 84;
  const CIRC         = 2 * Math.PI * RING_R;

  return (
    <div className="space-y-4">
      {/* Main progress ring */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg width={200} height={200} className="-rotate-90">
            <circle cx={100} cy={100} r={RING_R} stroke="var(--bg-tertiary)" strokeWidth={12} fill="none" />
            <circle
              cx={100} cy={100} r={RING_R}
              stroke="var(--accent-primary)" strokeWidth={12} fill="none"
              strokeDasharray={CIRC}
              strokeDashoffset={CIRC * (1 - pct)}
              strokeLinecap="round"
              className="transition-all duration-700"
            />
          </svg>
          <div className="absolute text-center">
            <div className="font-display text-3xl font-semibold text-[var(--text-primary)]">
              {totalPages}
            </div>
            <div className="text-[var(--text-tertiary)] text-xs">pages</div>
            <div className="text-[var(--accent-primary)] text-sm font-medium mt-0.5">
              {(pct * 100).toFixed(1)}%
            </div>
          </div>
        </div>
        <div className="text-[var(--text-tertiary)] text-xs mt-2">
          Quran journey — {QURAN_TOTAL} pages total
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          ['Today', todayPages + ' pg', ''],
          ['Juz done', juzDone.toFixed(1), '/ 30'],
          ['Pages left', Math.max(0, QURAN_TOTAL - totalPages) + '', ''],
        ].map(([label, val, sub]) => (
          <div key={label} className="bg-[var(--bg-secondary)] rounded-xl p-3">
            <div className="text-[var(--accent-primary)] font-bold text-lg leading-tight">{val}</div>
            {sub && <div className="text-[var(--text-tertiary)] text-xs">{sub}</div>}
            <div className="text-[var(--text-tertiary)] text-xs">{label}</div>
          </div>
        ))}
      </div>

      {/* Daily target progress */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[var(--text-primary)] font-medium text-sm">Daily target</span>
          <div className="flex items-center gap-2">
            {[3, 5, 10, 20].map(n => (
              <button
                key={n}
                onClick={() => saveTarget(n)}
                className={cn(
                  'px-2 py-0.5 rounded-full text-xs font-medium transition-all',
                  dailyTarget === n
                    ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]',
                )}
              >
                {n}
              </button>
            ))}
            <span className="text-[var(--text-tertiary)] text-xs">pg/day</span>
          </div>
        </div>
        <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--accent-primary)] rounded-full transition-all duration-500"
            style={{ width: `${todayPct * 100}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
          <span>{todayPages} logged today</span>
          <span>Target: {dailyTarget}</span>
        </div>
      </div>

      {/* Log reading button */}
      <button
        onClick={() => setShowLogSheet(true)}
        className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl flex items-center justify-center gap-2"
      >
        <BookOpen size={18} /> Log today's reading
      </button>

      {/* Recent logs */}
      {recentLogs.length > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-3">
            Recent readings
          </div>
          <div className="space-y-2">
            {recentLogs.map(log => (
              <div key={log.id} className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-tertiary)]">{log.date}</span>
                <div className="flex items-center gap-2">
                  <div
                    className="h-1.5 rounded-full bg-[var(--accent-primary)]"
                    style={{ width: `${Math.min(80, (log.value / dailyTarget) * 80)}px` }}
                  />
                  <span className="text-[var(--text-primary)] tabular-nums w-16 text-right">
                    {log.value} pages
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {totalPages === 0 && (
        <div className="text-center py-4">
          <p className="text-[var(--text-tertiary)] text-xs">
            "Recite in the name of your Lord who created." — Surah Al-Alaq 96:1
          </p>
        </div>
      )}

      {/* Log sheet */}
      <AnimatePresence>
        {showLogSheet && (
          <BottomSheet onClose={() => setShowLogSheet(false)} title="Log today's reading" emoji="📖">
            <div className="space-y-4">
              <div className="text-center text-[var(--text-tertiary)] text-sm">
                Already logged today: <span className="text-[var(--accent-primary)] font-medium">{todayPages} pages</span>
              </div>
              <div>
                <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">
                  Pages read this session
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setNewPages(v => String(Math.max(0, parseInt(v || '0', 10) - 1)))}
                    className="w-12 h-12 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-xl font-bold flex items-center justify-center"
                  >
                    −
                  </button>
                  <input
                    autoFocus
                    type="text"
                    inputMode="decimal"
                    pattern="[0-9]*"
                    value={newPages}
                    onChange={e => setNewPages(e.target.value)}
                    placeholder="0"
                    className="flex-1 text-center text-2xl font-bold bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-xl py-3 focus:outline-none"
                  />
                  <button
                    onClick={() => setNewPages(v => String(parseInt(v || '0', 10) + 1))}
                    className="w-12 h-12 rounded-full bg-[var(--accent-primary)] text-[#0D1421] text-xl font-bold flex items-center justify-center"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Quick amounts */}
              <div className="flex gap-2 justify-center">
                {[1, 2, 5, 10, 20].map(n => (
                  <button
                    key={n}
                    onClick={() => setNewPages(String(n))}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm transition-all',
                      newPages === String(n)
                        ? 'bg-[var(--accent-primary)] text-[#0D1421] font-medium'
                        : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                    )}
                  >
                    +{n}
                  </button>
                ))}
              </div>

              <button
                onClick={logReading}
                disabled={isSaving || !newPages || parseInt(newPages, 10) < 1}
                className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-40"
              >
                {isSaving ? 'Saving…' : `Add ${newPages || 0} pages`}
              </button>
            </div>
          </BottomSheet>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fast Tab ─────────────────────────────────────────────────────────────────

function FastTab() {
  const [todayLog,    setTodayLog]    = useState<FastingLog | null>(null);
  const [streak,      setStreak]      = useState(0);
  const [makeupOwed,  setMakeupOwed]  = useState(0);
  const [cycleActive, setCycleActive] = useState(false);
  const [showModal,   setShowModal]   = useState(false);
  const { times } = usePrayerTimesStore();
  const { profile } = useUserStore();
  const today = todayString();
  const now   = new Date();
  const hijri = toHijri(now);
  const isSunnahToday  = isSunnahFastDay(now);
  const isWhiteDayToday = isWhiteDay(now);
  const womenMode = profile?.gender === 'female' || profile?.womensModeEnabled;

  const load = useCallback(async () => {
    const [log, s, m, cycle] = await Promise.all([
      getFastingLogForDate(today),
      getFastingStreak(),
      getAllTimeMakeupFastsOwed(),
      getActiveCycle(),
    ]);
    setTodayLog(log ?? null);
    setStreak(s);
    setMakeupOwed(m);
    setCycleActive(!!cycle);
  }, [today]);

  useEffect(() => { load(); }, [load]);

  async function quickLog(type: FastType, status: FastStatus) {
    await logFast({ date: today, type, status });
    await load();
  }

  return (
    <div className="space-y-4">
      {/* Suhoor / Iftar times */}
      {times && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center">
            <Moon size={20} className="mx-auto mb-2 text-[var(--accent-primary)]" />
            <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">Suhoor ends</div>
            <div className="text-[var(--text-primary)] font-semibold text-lg mt-1">
              {formatPrayerTime(times.fajr)}
            </div>
            <div className="text-[var(--text-tertiary)] text-xs">at Fajr</div>
          </div>
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center">
            <Sun size={20} className="mx-auto mb-2 text-[var(--accent-primary)]" />
            <div className="text-[var(--text-tertiary)] text-xs uppercase tracking-wide">Iftar</div>
            <div className="text-[var(--text-primary)] font-semibold text-lg mt-1">
              {formatPrayerTime(times.maghrib)}
            </div>
            <div className="text-[var(--text-tertiary)] text-xs">at Maghrib</div>
          </div>
        </div>
      )}

      {/* Women's cycle mode banner */}
      {womenMode && cycleActive && (
        <div className="bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/30 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">🌸</div>
            <div>
              <div className="text-[var(--accent-primary)] font-medium text-sm">Cycle mode active</div>
              <div className="text-[var(--text-secondary)] text-xs mt-1">
                Fasting is not required during your cycle. These missed fasts are qada (makeup) —
                not fidya. Mark them as excused below when needed.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sunnah / White-day nudge */}
      {(isSunnahToday || isWhiteDayToday) && !todayLog && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-3 flex items-center gap-3">
          <Star size={16} className="text-[var(--accent-primary)] shrink-0" />
          <p className="text-[var(--text-secondary)] text-sm">
            {isWhiteDayToday
              ? `White Day — the ${hijri.day}th of the Hijri month. Fasting today is recommended.`
              : 'Today is Monday or Thursday — a recommended Sunnah fast day.'}
          </p>
        </div>
      )}

      {/* Today's fast card */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[var(--text-primary)] font-medium">Today's fast</span>
          {todayLog && (
            <span className={cn('text-sm font-medium', FAST_STATUS_CONFIG[todayLog.status].color)}>
              {FAST_STATUS_CONFIG[todayLog.status].icon} {FAST_STATUS_CONFIG[todayLog.status].label}
            </span>
          )}
        </div>

        {!todayLog ? (
          <div className="space-y-2">
            <p className="text-[var(--text-tertiary)] text-sm">Are you fasting today?</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => quickLog(isSunnahToday ? 'sunnah' : 'voluntary', 'completed')}
                className="py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--accent-primary)] hover:text-[#0D1421] transition-all"
              >
                ✓ Yes, fasting
              </button>
              <button
                onClick={() => quickLog('voluntary', 'broken')}
                className="py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium hover:bg-[var(--bg-primary)] transition-all"
              >
                Not today
              </button>
            </div>
            {womenMode && cycleActive && (
              <button
                onClick={() => quickLog('ramadan', 'excused')}
                className="w-full py-2 rounded-xl border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] text-sm"
              >
                Mark as excused (cycle)
              </button>
            )}
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-1.5 text-[var(--accent-primary)] text-sm"
            >
              Log with details →
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="text-sm text-[var(--text-secondary)]">Type: {TYPE_LABELS[todayLog.type]}</div>
            <button
              onClick={() => setShowModal(true)}
              className="text-[var(--accent-primary)] text-sm"
            >
              Edit →
            </button>
          </div>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center gap-3">
          <Flame size={24} className="text-[var(--accent-primary)]" />
          <div>
            <div className="text-[var(--text-primary)] font-bold text-xl">{streak}</div>
            <div className="text-[var(--text-tertiary)] text-xs">day streak</div>
          </div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center gap-3">
          <UtensilsCrossed size={20} className="text-[var(--accent-primary)]" />
          <div>
            <div className="text-[var(--text-primary)] font-bold text-xl">{makeupOwed}</div>
            <div className="text-[var(--text-tertiary)] text-xs">makeup owed</div>
          </div>
        </div>
      </div>

      {/* Makeup info */}
      {makeupOwed > 0 && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="text-xl">📋</div>
            <div>
              <div className="text-[var(--text-primary)] font-medium text-sm">
                {makeupOwed} makeup {makeupOwed === 1 ? 'fast' : 'fasts'} owed
              </div>
              <div className="text-[var(--text-tertiary)] text-xs mt-1">
                These are qada fasts. Log a fast with type "Makeup" when you make them up.
                {womenMode && ' (Women in haid owe qada, not fidya — fidya is for the elderly/chronically ill.)'}
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="text-[var(--accent-primary)] text-xs mt-2"
              >
                Log makeup fast →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sunnah fast reference */}
      <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
        <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-3">
          Recommended fast days
        </div>
        <div className="space-y-2">
          {[
            ['Mon & Thursday', 'Weekly Sunnah'],
            ['White Days (13–15 Hijri)', 'Monthly Sunnah'],
            ['Day of Arafah (9 Dhul Hijjah)', 'Expiates 2 years'],
            ["Ashura (10 Muharram)", 'Expiates 1 year'],
            ['6 days of Shawwal', 'Like fasting all year'],
          ].map(([name, desc]) => (
            <div key={name} className="flex justify-between text-sm">
              <span className="text-[var(--text-primary)]">{name}</span>
              <span className="text-[var(--text-tertiary)] text-xs self-center">{desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Log modal */}
      <AnimatePresence>
        {showModal && (
          <FastLogSheet
            date={today}
            existing={todayLog}
            onClose={() => setShowModal(false)}
            onSave={async (log) => {
              await logFast(log);
              await load();
              setShowModal(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function FastLogSheet({
  date, existing, onClose, onSave,
}: {
  date: string;
  existing: FastingLog | null;
  onClose: () => void;
  onSave: (log: Omit<FastingLog, 'id'>) => void;
}) {
  const [type,   setType]   = useState<FastType>(existing?.type ?? 'voluntary');
  const [status, setStatus] = useState<FastStatus>(existing?.status ?? 'completed');
  const [reason, setReason] = useState(existing?.reason ?? '');

  const TYPES: FastType[] = ['ramadan', 'sunnah', 'makeup', 'voluntary', 'nadhr'];
  const STATUSES: FastStatus[] = ['completed', 'partial', 'broken', 'excused'];

  return (
    <BottomSheet onClose={onClose} title={`Log fast — ${date}`}>
      <div className="space-y-4">
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Type</label>
          <div className="flex flex-wrap gap-2">
            {TYPES.map(t => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-sm transition-all',
                  type === t
                    ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
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
                    : 'border-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                )}
              >
                {FAST_STATUS_CONFIG[s].icon} {FAST_STATUS_CONFIG[s].label}
              </button>
            ))}
          </div>
        </div>

        {(status === 'broken' || status === 'excused') && (
          <div>
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
              Reason (optional)
            </label>
            <input
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Illness, travel, menstruation…"
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
      </div>
    </BottomSheet>
  );
}

// ─── Dhikr helpers ────────────────────────────────────────────────────────────

function vibrate(pattern: number | number[]) {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try { navigator.vibrate(pattern); } catch {}
  }
}

// Dot grid for ≤34 targets, progress bar otherwise
function ProgressVisual({ count, target, done }: { count: number; target: number; done: boolean }) {
  if (target <= 34) {
    return (
      <div className="flex flex-wrap justify-center gap-1.5 py-1 max-w-xs">
        {Array.from({ length: target }, (_, i) => (
          <div
            key={i}
            className={cn(
              'w-3.5 h-3.5 rounded-full transition-all duration-100',
              i < count
                ? done ? 'bg-emerald-400' : 'bg-[var(--accent-primary)]'
                : 'bg-[var(--bg-tertiary)]',
            )}
          />
        ))}
      </div>
    );
  }
  const pct = Math.min(1, count / target);
  return (
    <div className="w-full space-y-1">
      <div className="h-2 bg-[var(--bg-tertiary)] rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-200', done ? 'bg-emerald-400' : 'bg-[var(--accent-primary)]')}
          style={{ width: `${pct * 100}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-[var(--text-tertiary)]">
        <span>{count} / {target}</span>
        {done && <span className="text-emerald-400">✓ Complete</span>}
      </div>
    </div>
  );
}

// Custom target picker sheet
function TargetPickerSheet({
  current, dhikrLabel, onSelect, onClose,
}: { current: number; dhikrLabel: string; onSelect: (n: number) => void; onClose: () => void }) {
  const [custom, setCustom] = useState('');
  const customVal = parseInt(custom, 10);
  const customOk  = !isNaN(customVal) && customVal >= 1 && customVal <= 9999;

  return (
    <BottomSheet title={`Target for ${dhikrLabel}`} emoji="🎯" onClose={onClose}>
      <div className="grid grid-cols-4 gap-2">
        {TARGET_PRESETS.map(n => (
          <button
            key={n}
            onClick={() => { onSelect(n); onClose(); }}
            className={cn(
              'py-3 rounded-xl font-semibold text-sm transition-all',
              current === n
                ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                : 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
            )}
          >
            {n}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">Custom</label>
        <div className="flex gap-2">
          <input
            type="number"
            min={1}
            max={9999}
            value={custom}
            onChange={e => setCustom(e.target.value)}
            placeholder="Enter number…"
            className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] text-sm focus:outline-none"
          />
          <button
            disabled={!customOk}
            onClick={() => { if (customOk) { onSelect(customVal); onClose(); } }}
            className="px-4 py-2.5 rounded-xl bg-[var(--accent-primary)] text-[#0D1421] font-semibold text-sm disabled:opacity-40"
          >
            Set
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}

// Post-prayer tasbih (33+33+34) guided mode
function PrayerTasbihMode({ today, onExit }: { today: string; onExit: () => void }) {
  const [step,     setStep]     = useState(0);
  const [count,    setCount]    = useState(0);
  const [stepping, setStepping] = useState(false);
  const [allDone,  setAllDone]  = useState(false);

  const current = PRAYER_SEQUENCE[step];
  const done    = count >= current.target;

  async function tap() {
    if (stepping || allDone) return;
    const next = count + 1;
    vibrate(10);
    const habitId = `__dhikr_${current.id}__`;
    const existing = await db.habitLogs.where('[habitId+date]').equals([habitId, today]).first();
    await logHabitValue(habitId, today, (existing?.value ?? 0) + 1);
    setCount(next);

    if (next >= current.target) {
      vibrate([50, 30, 50, 30, 50]);
      if (step < PRAYER_SEQUENCE.length - 1) {
        setStepping(true);
        setTimeout(() => {
          setStep(s => s + 1);
          setCount(0);
          setStepping(false);
        }, 900);
      } else {
        setAllDone(true);
      }
    }
  }

  if (allDone) {
    return (
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-8 flex flex-col items-center gap-5 text-center">
        <div className="text-6xl">✨</div>
        <div>
          <div className="text-[var(--text-primary)] font-semibold text-lg">Tasbih Complete</div>
          <div className="text-[var(--text-tertiary)] text-sm mt-1">
            SubhānAllāh × 33 · Alḥamdulillāh × 33 · Allāhu Akbar × 34
          </div>
        </div>
        <div className="bg-[var(--bg-tertiary)] rounded-xl px-4 py-3 text-[var(--text-tertiary)] text-xs italic leading-relaxed text-left">
          "Whoever says SubḥānAllāh 33 times, Alḥamdulillāh 33 times and Allāhu Akbar 34 times
          after every prayer — his sins will be forgiven even if they are as much as the foam of the sea."
          <span className="block mt-1 not-italic text-[var(--text-tertiary)]/70">— Sahih Muslim 597</span>
        </div>
        <button
          onClick={onExit}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
        >
          Done
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 flex flex-col items-center gap-4">
      {/* Header row */}
      <div className="flex items-center justify-between w-full">
        <span className="text-[var(--text-tertiary)] text-xs">Post-prayer tasbih</span>
        <button onClick={onExit} className="text-[var(--text-tertiary)]"><X size={16} /></button>
      </div>

      {/* Step bar */}
      <div className="flex gap-2 w-full">
        {PRAYER_SEQUENCE.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              'flex-1 h-1.5 rounded-full transition-all duration-300',
              i < step  ? 'bg-emerald-400'
              : i === step ? 'bg-[var(--accent-primary)]'
              : 'bg-[var(--bg-tertiary)]',
            )}
          />
        ))}
      </div>

      {/* Current dhikr */}
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          className="text-center space-y-1"
        >
          <div className="font-arabic text-2xl text-[var(--accent-primary)]">{current.arabic}</div>
          <div className="text-[var(--text-tertiary)] text-xs italic">{current.transliteration}</div>
          <div className="text-[var(--text-secondary)] text-sm font-medium">{current.label}</div>
        </motion.div>
      </AnimatePresence>

      {/* Count display */}
      <motion.div
        key={`${step}-${count}`}
        initial={{ scale: 1.15 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.08 }}
        className="text-7xl font-bold tabular-nums"
        style={{ color: stepping ? 'var(--accent-primary)' : 'var(--text-primary)' }}
      >
        {stepping ? '✓' : count}
      </motion.div>

      {/* Dot progress */}
      <ProgressVisual count={stepping ? current.target : count} target={current.target} done={done} />

      {/* Tap button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={tap}
        disabled={stepping}
        className={cn(
          'w-36 h-36 rounded-full flex items-center justify-center text-5xl font-light select-none transition-colors duration-200',
          stepping ? 'bg-emerald-500 text-white' : 'bg-[var(--accent-primary)] text-[#0D1421]',
        )}
      >
        {stepping ? '✓' : '+'}
      </motion.button>

      <div className="text-[var(--text-tertiary)] text-xs">
        Step {step + 1} of {PRAYER_SEQUENCE.length} · {count} / {current.target}
      </div>
    </div>
  );
}

// ─── Dhikr Tab ────────────────────────────────────────────────────────────────

function DhikrTab() {
  const [selected,         setSelected]         = useState(DHIKR_OPTIONS[0]);
  const [count,            setCount]            = useState(0);
  const [allCounts,        setAllCounts]        = useState<Record<string, number>>({});
  const [customTargets,    setCustomTargets]    = useState<Record<string, number>>({});
  const [showTargetPicker, setShowTargetPicker] = useState(false);
  const [prayerMode,       setPrayerMode]       = useState(false);
  const [showCelebration,  setShowCelebration]  = useState(false);
  const today = todayString();

  const habitId        = `__dhikr_${selected.id}__`;
  const effectiveTarget = customTargets[selected.id] ?? selected.target;
  const rounds         = Math.floor(count / effectiveTarget);
  const remInRound     = count % effectiveTarget;
  const progressCount  = rounds > 0 && remInRound === 0 ? effectiveTarget : remInRound;
  const done           = count >= effectiveTarget;

  const loadAll = useCallback(async () => {
    const counts: Record<string, number> = {};
    await Promise.all(
      DHIKR_OPTIONS.map(async d => {
        const log = await db.habitLogs
          .where('[habitId+date]').equals([`__dhikr_${d.id}__`, today])
          .first();
        counts[d.id] = log?.value ?? 0;
      }),
    );
    setAllCounts(counts);
    setCount(counts[selected.id] ?? 0);
  }, [today, selected.id]);

  useEffect(() => { loadAll(); }, [loadAll]);

  async function increment() {
    const next = count + 1;
    setCount(next);
    setAllCounts(prev => ({ ...prev, [selected.id]: next }));
    vibrate(10);
    await logHabitValue(habitId, today, next);
    if (next % effectiveTarget === 0) {
      vibrate([50, 30, 50, 30, 50]);
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 1600);
    }
  }

  async function reset() {
    setCount(0);
    setAllCounts(prev => ({ ...prev, [selected.id]: 0 }));
    await logHabitValue(habitId, today, 0);
  }

  function share() {
    const text = `I completed ${count}× ${selected.label} today 🤲\n${selected.arabic}\n(${selected.transliteration})\n— tracked with Hayya Falah`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  if (prayerMode) {
    return (
      <div className="space-y-4">
        <PrayerTasbihMode today={today} onExit={() => { setPrayerMode(false); loadAll(); }} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Post-prayer tasbih shortcut */}
      <button
        onClick={() => setPrayerMode(true)}
        className="w-full py-3 px-4 bg-[var(--bg-secondary)] rounded-2xl flex items-center justify-center gap-2 text-sm text-[var(--text-secondary)] border border-[var(--bg-tertiary)] active:scale-[0.98] transition-transform"
      >
        <span className="text-base">🕌</span>
        <span className="font-medium">Post-prayer tasbih</span>
        <span className="text-[var(--text-tertiary)] text-xs ml-1">33 + 33 + 34</span>
      </button>

      {/* Dhikr selector — 2-column grid */}
      <div className="grid grid-cols-2 gap-2">
        {DHIKR_OPTIONS.map(d => {
          const c   = allCounts[d.id] ?? 0;
          const tgt = customTargets[d.id] ?? d.target;
          const pct = Math.min(1, c / tgt);
          const isSelected = selected.id === d.id;
          const isDone     = c >= tgt;
          return (
            <button
              key={d.id}
              onClick={() => { setSelected(d); setCount(allCounts[d.id] ?? 0); }}
              className={cn(
                'relative rounded-xl p-3 text-left transition-all overflow-hidden',
                isSelected
                  ? 'bg-[var(--accent-primary)]/10 ring-1 ring-[var(--accent-primary)]'
                  : 'bg-[var(--bg-secondary)]',
              )}
            >
              {/* Progress fill layer */}
              {pct > 0 && (
                <div
                  className="absolute inset-0 rounded-xl pointer-events-none"
                  style={{
                    background: `linear-gradient(to right, ${isDone ? 'rgb(52 211 153)' : 'var(--accent-primary)'} ${pct * 100}%, transparent ${pct * 100}%)`,
                    opacity: 0.08,
                  }}
                />
              )}
              <div className="relative">
                <div className={cn(
                  'text-xs font-semibold leading-snug',
                  isSelected ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]',
                )}>
                  {d.label}
                </div>
                <div className="font-arabic text-xs text-[var(--text-tertiary)] mt-0.5 truncate text-right">
                  {d.arabic.length > 12 ? d.arabic.slice(0, 12) + '…' : d.arabic}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[var(--text-tertiary)] text-xs tabular-nums">
                    {c > 0 ? `${c}×` : `–`}
                  </span>
                  {isDone
                    ? <span className="text-emerald-400 text-xs font-bold">✓</span>
                    : c > 0 && <span className="text-[var(--text-tertiary)] text-xs">/{tgt}</span>
                  }
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main counter card */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-6 flex flex-col items-center gap-4 relative overflow-hidden">
        {/* Celebration overlay */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-2xl bg-[var(--bg-secondary)]/90"
            >
              <motion.div
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-center"
              >
                <div className="text-5xl mb-2">{rounds > 1 ? '🌟' : '🌙'}</div>
                <div className="text-[var(--accent-primary)] font-semibold">
                  {rounds > 1 ? `Round ${rounds} complete!` : 'Target reached!'}
                </div>
                <div className="text-[var(--text-tertiary)] text-sm mt-0.5">
                  {effectiveTarget}× {selected.label}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Arabic + transliteration */}
        <div className="text-center space-y-0.5">
          <div className="font-arabic text-2xl text-[var(--accent-primary)] leading-relaxed">
            {selected.arabic}
          </div>
          <div className="text-[var(--text-tertiary)] text-xs italic">
            {selected.transliteration}
          </div>
        </div>

        {/* Rounds badge */}
        {rounds > 0 && (
          <div className="flex items-center gap-1.5 bg-[var(--bg-tertiary)] px-3 py-1 rounded-full">
            <Flame size={12} className="text-amber-400" />
            <span className="text-[var(--text-secondary)] text-xs font-semibold">
              {rounds} round{rounds > 1 ? 's' : ''} complete
            </span>
          </div>
        )}

        {/* Count (total) */}
        <motion.div
          key={count}
          initial={{ scale: 1.12 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.08 }}
          className="text-7xl font-bold text-[var(--text-primary)] tabular-nums"
        >
          {count}
        </motion.div>

        {/* Progress visual */}
        <ProgressVisual count={progressCount} target={effectiveTarget} done={done} />

        {/* Target picker trigger */}
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)] text-xs">Target:</span>
          <button
            onClick={() => setShowTargetPicker(true)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-xs font-semibold"
          >
            {effectiveTarget}
            <ChevronDown size={11} />
          </button>
        </div>

        {/* Big tap button */}
        <motion.button
          whileTap={{ scale: 0.92 }}
          onClick={increment}
          className={cn(
            'w-36 h-36 rounded-full flex items-center justify-center text-5xl font-light select-none transition-colors duration-150',
            done
              ? 'bg-emerald-500 text-white'
              : 'bg-[var(--accent-primary)] text-[#0D1421]',
          )}
          aria-label="Count dhikr"
        >
          +
        </motion.button>

        {/* Action row */}
        <div className="flex gap-3 w-full">
          <button
            onClick={share}
            className="flex-1 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm flex items-center justify-center gap-1.5"
          >
            <Share2 size={14} /> Share
          </button>
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm flex items-center justify-center gap-1.5"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </div>

      {/* Today's session overview */}
      {Object.values(allCounts).some(v => v > 0) && (
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-3">
            Today's dhikr
          </div>
          <div className="space-y-2.5">
            {DHIKR_OPTIONS.filter(d => (allCounts[d.id] ?? 0) > 0).map(d => {
              const c   = allCounts[d.id] ?? 0;
              const tgt = customTargets[d.id] ?? d.target;
              const isDone = c >= tgt;
              return (
                <div key={d.id} className="flex items-center justify-between text-sm gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {isDone && <span className="text-emerald-400 text-xs shrink-0">✓</span>}
                    <span className="text-[var(--text-primary)] truncate">{d.label}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div
                      className={cn('h-1.5 rounded-full', isDone ? 'bg-emerald-400' : 'bg-[var(--accent-primary)]')}
                      style={{ width: `${Math.min(72, (c / tgt) * 72)}px` }}
                    />
                    <span className="text-[var(--text-tertiary)] tabular-nums text-xs w-10 text-right">
                      {c}×
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Hadith nudge */}
      <div className="text-center py-2">
        <p className="text-[var(--text-tertiary)] text-xs italic leading-relaxed">
          "Two words are light on the tongue, heavy on the Scale, and beloved to the Most Merciful:
          SubhānAllāhi wa biḥamdihī, SubhānAllāhi l-ʿAẓīm."
        </p>
        <p className="text-[var(--text-tertiary)] text-xs mt-0.5">— Sahih al-Bukhari 6682 · Sahih Muslim 2694</p>
      </div>

      {/* Target picker sheet */}
      <AnimatePresence>
        {showTargetPicker && (
          <TargetPickerSheet
            current={effectiveTarget}
            dhikrLabel={selected.label}
            onSelect={n => setCustomTargets(prev => ({ ...prev, [selected.id]: n }))}
            onClose={() => setShowTargetPicker(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Dua Tab ─────────────────────────────────────────────────────────────────

function DuaCard({ dua }: { dua: Dua }) {
  const [expanded, setExpanded] = useState(false);

  function share() {
    const text = `${dua.title}\n\n${dua.arabic}\n\n${dua.transliteration}\n\n${dua.translation}\n\nSource: ${dua.source}\n\n— Hayya Falah`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({ text }).catch(() => {});
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  }

  return (
    <motion.div
      layout
      className="bg-[var(--bg-secondary)] rounded-2xl overflow-hidden"
    >
      <button
        onClick={() => setExpanded(e => !e)}
        className="w-full px-4 py-4 text-left flex items-start justify-between gap-3"
      >
        <div className="flex-1 min-w-0">
          <div className="text-[var(--text-primary)] font-medium text-sm">{dua.title}</div>
          <div className="font-arabic text-base text-[var(--accent-primary)] mt-1 leading-relaxed text-right">
            {expanded ? dua.arabic : dua.arabic.length > 60 ? dua.arabic.slice(0, 60) + '…' : dua.arabic}
          </div>
        </div>
        <div className="shrink-0 mt-1 text-[var(--text-tertiary)]">
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </div>
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
            <div className="px-4 pb-4 space-y-3 border-t border-[var(--bg-tertiary)] pt-3">
              {/* Full Arabic */}
              <div className="font-arabic text-lg text-[var(--accent-primary)] text-right leading-relaxed">
                {dua.arabic}
              </div>
              {/* Transliteration */}
              <div className="text-[var(--text-secondary)] text-sm italic leading-relaxed">
                {dua.transliteration}
              </div>
              {/* Translation */}
              <div className="text-[var(--text-primary)] text-sm leading-relaxed">
                {dua.translation}
              </div>
              {/* Source */}
              <div className="text-[var(--text-tertiary)] text-xs leading-relaxed bg-[var(--bg-tertiary)] rounded-xl px-3 py-2">
                📖 {dua.source}
              </div>
              {/* Share button */}
              <button
                onClick={share}
                className="flex items-center gap-1.5 text-[var(--accent-primary)] text-xs py-1"
              >
                <Share2 size={12} /> Share this dua
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DuaTab() {
  const [query,    setQuery]    = useState('');
  const [category, setCategory] = useState<DuaCategory | 'all'>('all');

  const filtered = query
    ? searchDuas(query)
    : category === 'all'
    ? DUAS
    : getDuasByCategory(category);

  const categoryKeys = Object.keys(DUA_CATEGORIES) as DuaCategory[];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 text-center">
        <div className="font-arabic text-2xl text-[var(--accent-primary)]">ادْعُونِي أَسْتَجِبْ لَكُمْ</div>
        <div className="text-[var(--text-tertiary)] text-xs mt-1">"Call upon Me; I will respond to you." — Quran 40:60</div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); if (e.target.value) setCategory('all'); }}
          placeholder="Search duas…"
          className="w-full pl-9 pr-4 py-2.5 bg-[var(--bg-secondary)] rounded-xl text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-1 focus:ring-[var(--accent-primary)]/40"
        />
      </div>

      {/* Category pills */}
      {!query && (
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setCategory('all')}
            className={cn(
              'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all',
              category === 'all'
                ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
            )}
          >
            All ({DUAS.length})
          </button>
          {categoryKeys.map(k => {
            const cat = DUA_CATEGORIES[k];
            const count = getDuasByCategory(k).length;
            return (
              <button
                key={k}
                onClick={() => setCategory(k)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 transition-all flex items-center gap-1',
                  category === k
                    ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                    : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
                )}
              >
                {cat.emoji} {cat.label} ({count})
              </button>
            );
          })}
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-[var(--text-tertiary)] text-sm">
            No duas found for "{query}"
          </div>
        ) : (
          filtered.map(dua => <DuaCard key={dua.id} dua={dua} />)
        )}
      </div>

      {/* Footer note */}
      <div className="text-center py-2 text-[var(--text-tertiary)] text-xs">
        All duas sourced from Quran and authenticated hadith collections.
      </div>
    </div>
  );
}

// ─── Shared: Empty state ──────────────────────────────────────────────────────

function EmptyHabitsState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-10 space-y-4">
      <div className="text-5xl">🌱</div>
      <div>
        <div className="text-[var(--text-primary)] font-medium">Start your habit journey</div>
        <div className="text-[var(--text-tertiary)] text-sm mt-1">
          Small, consistent deeds are most beloved to Allah ﷻ
        </div>
      </div>
      <button
        onClick={onAdd}
        className="mx-auto flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-[#0D1421] rounded-xl font-semibold text-sm"
      >
        <Plus size={16} /> Choose your habits
      </button>
    </div>
  );
}

// ─── Shared: Bottom sheet wrapper ─────────────────────────────────────────────

function BottomSheet({
  children, title, emoji, onClose,
}: {
  children: ReactNode;
  title: string;
  emoji?: string;
  onClose: () => void;
}) {
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
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] rounded-t-3xl p-6 space-y-5 max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-8 h-1 bg-[var(--bg-tertiary)] rounded-full mx-auto -mt-1" />
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-[var(--text-primary)]">
            {emoji && <span className="mr-2">{emoji}</span>}{title}
          </h3>
          <button onClick={onClose} className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] text-xl w-8 h-8 flex items-center justify-center">
            <X size={18} />
          </button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}
