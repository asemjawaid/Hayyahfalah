'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, ChevronRight, Copy, Check, Info, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/family-store';
import { useAuthStore } from '@/store/auth-store';
import { BottomNav } from '@/components/ui/nav';
import { todayString } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getMemberLogsForDateRange } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { MemberRelationship, Gender, PrayerStatus } from '@/lib/db';

const PRAYERS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

const RELATIONSHIP_LABELS: Record<MemberRelationship, { label: string; emoji: string }> = {
  child:   { label: 'Child',   emoji: '🧒' },
  student: { label: 'Student', emoji: '📚' },
  spouse:  { label: 'Spouse',  emoji: '💑' },
  sibling: { label: 'Sibling', emoji: '👫' },
  parent:  { label: 'Parent',  emoji: '👴' },
  other:   { label: 'Other',   emoji: '👤' },
};

const AVATARS = ['😊', '🌙', '⭐', '🌸', '🌿', '🦋', '🌺', '🕊️', '🌟', '🦁', '🌈', '🍃'];

const LINK_STATUS_BADGE = {
  local:   { label: 'Local only',  color: 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]' },
  pending: { label: '📨 Code saved', color: 'text-amber-400 bg-amber-400/10' },
  linked:  { label: '✓ Linked',     color: 'text-emerald-400 bg-emerald-400/10' },
};

const POSITIVE_STATUSES: PrayerStatus[] = ['on_time', 'late', 'jamaah', 'jamaah_home'];

function getLast7Days(): string[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
}

function dotColorClass(count: number, date: string, today: string): string {
  if (date > today) return 'bg-[var(--bg-primary)]';
  if (count === 0) return 'bg-[var(--bg-tertiary)]';
  if (count <= 2) return 'bg-rose-400/80';
  if (count <= 4) return 'bg-amber-400/80';
  return 'bg-emerald-400';
}

export default function FamilyPage() {
  const { profiles, memberLogs, loadProfiles, loadLogsForDate, removeProfile } = useFamilyStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showCodeInfo, setShowCodeInfo] = useState(false);
  const [weekStats, setWeekStats] = useState<Record<string, Record<string, number>>>({});
  const today = todayString();
  const days7 = getLast7Days();

  const profileCode = user?.id
    ? user.id.replace(/-/g, '').slice(0, 8).toUpperCase()
    : null;

  const formattedCode = profileCode
    ? profileCode.slice(0, 4) + '-' + profileCode.slice(4)
    : null;

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    if (profiles.length === 0) return;
    for (const p of profiles) {
      loadLogsForDate(p.id, today);
    }
    loadWeekStats(profiles);
  }, [profiles.length]);

  async function loadWeekStats(profs: typeof profiles) {
    if (profs.length === 0) return;
    const results: Record<string, Record<string, number>> = {};
    await Promise.all(profs.map(async (p) => {
      const logs = await getMemberLogsForDateRange(p.id, days7[0], days7[6]);
      const byDate: Record<string, number> = {};
      for (const date of days7) {
        byDate[date] = logs.filter(l => l.date === date && POSITIVE_STATUSES.includes(l.status)).length;
      }
      results[p.id] = byDate;
    }));
    setWeekStats(results);
  }

  function copyCode() {
    if (profileCode) {
      navigator.clipboard.writeText(profileCode).catch(() => {});
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/home" className="p-1.5 rounded-lg hover:bg-[var(--bg-secondary)] transition-colors">
            <ArrowLeft size={20} className="text-[var(--text-secondary)]" />
          </Link>
          <div className="flex-1">
            <h1 className="font-display text-lg text-[var(--text-primary)]">Family & Students</h1>
            <p className="text-[var(--text-tertiary)] text-xs">Track prayers for those in your care</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] text-[#0D1421] text-sm font-medium rounded-xl"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* Your Profile Code — only visible when signed in */}
        {profileCode && (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[var(--text-secondary)] text-xs uppercase tracking-wide">Your Profile Code</span>
                <button
                  onClick={() => setShowCodeInfo(v => !v)}
                  className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  <Info size={13} />
                </button>
              </div>
              <button
                onClick={copyCode}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all',
                  codeCopied
                    ? 'bg-emerald-400/20 text-emerald-400'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                )}
              >
                {codeCopied ? <Check size={11} /> : <Copy size={11} />}
                {codeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>

            <div className="font-mono text-2xl font-bold text-[var(--accent-primary)] tracking-[0.2em]">
              {formattedCode}
            </div>

            <AnimatePresence>
              {showCodeInfo && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden text-[var(--text-tertiary)] text-[11px] leading-relaxed"
                >
                  Share this code with your family members. When they add you on their device, they enter this code to link to your account — their prayer activity will show as confirmed.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* No-account nudge */}
        {!profileCode && (
          <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[var(--accent-primary)]/15 flex items-center justify-center flex-shrink-0">
              <span className="text-sm">🔗</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[var(--text-primary)] text-sm font-medium">Get a Profile Code</p>
              <p className="text-[var(--text-tertiary)] text-xs mt-0.5">
                Sign in to get your shareable code so family can link to your account.
              </p>
            </div>
            <Link
              href="/auth"
              className="text-[var(--accent-primary)] text-xs font-medium whitespace-nowrap"
            >
              Sign in →
            </Link>
          </div>
        )}

        {/* Member list */}
        {profiles.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16 space-y-4"
          >
            <div className="text-5xl">👨‍👩‍👧‍👦</div>
            <div className="space-y-1">
              <p className="text-[var(--text-primary)] font-medium">No members yet</p>
              <p className="text-[var(--text-tertiary)] text-sm max-w-xs mx-auto">
                Add family members or students to track their daily prayers alongside yours.
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--accent-primary)] text-[#0D1421] font-medium rounded-xl text-sm"
            >
              <Plus size={16} /> Add first member
            </button>
          </motion.div>
        ) : (
          profiles.map((p, i) => {
            const todayLogs = memberLogs[p.id] ?? {};
            const completedToday = PRAYERS.filter(pr => todayLogs[pr]).length;
            const rel = RELATIONSHIP_LABELS[p.relationship];
            const memberWeek = weekStats[p.id] ?? {};
            const badge = p.linkStatus ? LINK_STATUS_BADGE[p.linkStatus] : null;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--bg-secondary)] rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl flex-shrink-0">
                    {p.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* Name + badges */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-[var(--text-primary)]">{p.name}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {rel.emoji} {rel.label}
                      </span>
                      {badge && p.linkStatus !== 'local' && (
                        <span className={cn('text-[10px] px-2 py-0.5 rounded-full whitespace-nowrap', badge.color)}>
                          {badge.label}
                        </span>
                      )}
                    </div>

                    {/* Today's prayer dots */}
                    <div className="flex items-center gap-1.5 mt-2">
                      {PRAYERS.map(prayer => {
                        const log = todayLogs[prayer];
                        return (
                          <div
                            key={prayer}
                            className={cn(
                              'w-4 h-4 rounded-full',
                              !log ? 'bg-[var(--bg-tertiary)]' :
                              ['on_time', 'jamaah', 'jamaah_home'].includes(log.status) ? 'bg-emerald-400' :
                              log.status === 'late' ? 'bg-amber-400' :
                              log.status === 'qaza' ? 'bg-purple-400' :
                              log.status === 'missed' ? 'bg-rose-500' :
                              'bg-zinc-500'
                            )}
                            title={prayer}
                          />
                        );
                      })}
                      <span className="text-[var(--text-tertiary)] text-xs ml-1">
                        {completedToday}/5 today
                      </span>
                    </div>

                    {/* 7-day trend */}
                    <div className="flex items-center gap-1 mt-2">
                      <span className="text-[var(--text-tertiary)] text-[10px] mr-0.5 w-4">7d</span>
                      {days7.map(date => (
                        <div
                          key={date}
                          className={cn(
                            'w-3 h-3 rounded-sm transition-colors',
                            dotColorClass(memberWeek[date] ?? 0, date, today)
                          )}
                          title={`${new Date(date + 'T12:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}: ${memberWeek[date] ?? 0}/5 prayers`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0 flex-shrink-0 -mr-1">
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${p.name}? Their prayer history will be deleted.`)) {
                          removeProfile(p.id);
                        }
                      }}
                      className="p-2 text-[var(--text-tertiary)] hover:text-rose-400 transition-colors rounded-lg"
                    >
                      <Trash2 size={14} />
                    </button>
                    <Link
                      href={`/family/${p.id}`}
                      className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors rounded-lg"
                    >
                      <ChevronRight size={18} />
                    </Link>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      <BottomNav />

      <AnimatePresence>
        {showAddModal && (
          <AddMemberModal
            onClose={() => setShowAddModal(false)}
            onDone={() => {
              setShowAddModal(false);
              // profiles.length will change → useEffect reloads week stats
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Add Member Modal ──────────────────────────────────────────────────────────

type CodeStatus = 'idle' | 'checking' | 'found' | 'notfound';

function AddMemberModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { addProfile } = useFamilyStore();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<MemberRelationship>('child');
  const [gender, setGender] = useState<Gender>('male');
  const [emoji, setEmoji] = useState('😊');
  const [profileCode, setProfileCode] = useState('');
  const [codeStatus, setCodeStatus] = useState<CodeStatus>('idle');
  const [foundUserId, setFoundUserId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Validate the profile code against Supabase when input is complete (8 chars)
  async function checkProfileCode(raw: string) {
    const code = raw.replace(/-/g, '').toUpperCase();
    if (code.length < 8) {
      setCodeStatus('idle');
      setFoundUserId(null);
      return;
    }
    setCodeStatus('checking');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('profile_code', code)
        .single();
      if (error || !data) {
        setCodeStatus('notfound');
        setFoundUserId(null);
      } else {
        setCodeStatus('found');
        setFoundUserId(data.id);
      }
    } catch {
      setCodeStatus('notfound');
      setFoundUserId(null);
    }
  }

  function handleCodeChange(raw: string) {
    // Allow digits + letters + dash, max 9 chars (XXXX-XXXX)
    const cleaned = raw.replace(/[^A-Za-z0-9-]/g, '').toUpperCase().slice(0, 9);
    setProfileCode(cleaned);
    const stripped = cleaned.replace(/-/g, '');
    if (stripped.length === 8) {
      checkProfileCode(stripped);
    } else {
      setCodeStatus('idle');
      setFoundUserId(null);
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    const stripped = profileCode.replace(/-/g, '').toUpperCase();
    await addProfile({
      name: name.trim(),
      emoji,
      relationship,
      gender,
      linkedUserId: foundUserId || undefined,
      linkedEmail: stripped || undefined,
      linkStatus: codeStatus === 'found' ? 'linked' : stripped ? 'pending' : 'local',
    });
    setSaving(false);
    onDone();
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/60 flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 300 }}
        className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] rounded-t-3xl p-6 space-y-5 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-8 h-1 bg-[var(--bg-tertiary)] rounded-full mx-auto" />
        <h3 className="font-display text-xl text-[var(--text-primary)]">Add Member</h3>

        {/* Avatar picker */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">
            Choose an avatar
          </label>
          <div className="flex flex-wrap gap-2">
            {AVATARS.map(av => (
              <button
                key={av}
                onClick={() => setEmoji(av)}
                className={cn(
                  'w-10 h-10 rounded-xl text-xl transition-all',
                  emoji === av
                    ? 'bg-[var(--accent-primary)] scale-110'
                    : 'bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)]'
                )}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Aisha, Ahmad, Student 1"
            className="w-full px-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none"
          />
        </div>

        {/* Profile Code */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
            Their Profile Code <span className="text-[var(--text-tertiary)] normal-case">(optional)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              inputMode="text"
              value={profileCode}
              onChange={e => handleCodeChange(e.target.value)}
              placeholder="XXXX-XXXX"
              maxLength={9}
              className={cn(
                'w-full px-4 py-3 pr-10 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none font-mono tracking-widest uppercase transition-all',
                codeStatus === 'found' && 'ring-1 ring-emerald-400',
                codeStatus === 'notfound' && 'ring-1 ring-rose-400',
              )}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              {codeStatus === 'checking' && (
                <Loader2 size={16} className="animate-spin text-[var(--text-tertiary)]" />
              )}
              {codeStatus === 'found' && (
                <Check size={16} className="text-emerald-400" />
              )}
              {codeStatus === 'notfound' && (
                <Search size={16} className="text-rose-400" />
              )}
            </div>
          </div>

          {/* Code status feedback */}
          <div className="mt-1.5 min-h-[16px]">
            {codeStatus === 'found' && (
              <p className="text-emerald-400 text-[11px]">✓ Account found — member will be marked as Linked</p>
            )}
            {codeStatus === 'notfound' && (
              <p className="text-[var(--text-tertiary)] text-[11px]">Code not found — it will be saved and checked when they sign in</p>
            )}
            {codeStatus === 'idle' && profileCode.length === 0 && (
              <p className="text-[var(--text-tertiary)] text-[11px]">
                Ask them to open Settings → Profile to find their 8-character code
              </p>
            )}
          </div>
        </div>

        {/* Relationship */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Relationship</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(RELATIONSHIP_LABELS) as [MemberRelationship, { label: string; emoji: string }][]).map(
              ([key, { label, emoji: re }]) => (
                <button
                  key={key}
                  onClick={() => setRelationship(key)}
                  className={cn(
                    'py-2.5 px-2 rounded-xl text-sm text-center transition-all',
                    relationship === key
                      ? 'bg-[var(--accent-primary)] text-[#0D1421] font-medium'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                  )}
                >
                  <div className="text-base">{re}</div>
                  <div className="text-xs mt-0.5">{label}</div>
                </button>
              )
            )}
          </div>
        </div>

        {/* Gender */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Gender</label>
          <div className="flex gap-2">
            {(['male', 'female'] as Gender[]).map(g => (
              <button
                key={g}
                onClick={() => setGender(g)}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium capitalize transition-all',
                  gender === g
                    ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]'
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={!name.trim() || saving}
          onClick={handleSave}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 transition-opacity"
        >
          {saving ? 'Adding…' : `Add ${name.trim() || 'Member'}`}
        </button>
      </motion.div>
    </motion.div>
  );
}
