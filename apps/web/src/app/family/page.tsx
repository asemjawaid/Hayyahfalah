'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Trash2, ChevronRight, Users } from 'lucide-react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/family-store';
import { BottomNav } from '@/components/ui/nav';
import { todayString } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { MemberRelationship, Gender, PrayerName, PrayerStatus } from '@/lib/db';

const PRAYERS: PrayerName[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

const RELATIONSHIP_LABELS: Record<MemberRelationship, { label: string; emoji: string }> = {
  child:   { label: 'Child',   emoji: '🧒' },
  student: { label: 'Student', emoji: '📚' },
  spouse:  { label: 'Spouse',  emoji: '💑' },
  sibling: { label: 'Sibling', emoji: '👫' },
  parent:  { label: 'Parent',  emoji: '👴' },
  other:   { label: 'Other',   emoji: '👤' },
};

const STATUS_COLOR: Record<PrayerStatus, string> = {
  on_time:    'bg-emerald-400',
  late:       'bg-amber-400',
  jamaah:     'bg-sky-400',
  jamaah_home:'bg-sky-300',
  qaza:       'bg-purple-400',
  missed:     'bg-red-500',
  excused:    'bg-zinc-500',
};

const AVATARS = ['😊','🌙','⭐','🌸','🌿','🦋','🌺','🕊️','🌟','🦁','🌈','🍃'];

export default function FamilyPage() {
  const { profiles, memberLogs, loadProfiles, loadLogsForDate, removeProfile } = useFamilyStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const today = todayString();

  useEffect(() => {
    loadProfiles();
  }, []);

  useEffect(() => {
    for (const p of profiles) {
      loadLogsForDate(p.id, today);
    }
  }, [profiles.length]);

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
            <Plus size={14} />
            Add
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-3">
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
                Add family members or students to track their prayers alongside yours.
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
          profiles.map((profile, i) => {
            const logs = memberLogs[profile.id] ?? {};
            const completed = PRAYERS.filter(p => logs[p]).length;
            const rel = RELATIONSHIP_LABELS[profile.relationship];
            return (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--bg-secondary)] rounded-2xl p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl flex-shrink-0">
                    {profile.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text-primary)] truncate">{profile.name}</span>
                      <span className="text-[10px] text-[var(--text-tertiary)] bg-[var(--bg-tertiary)] px-2 py-0.5 rounded-full whitespace-nowrap">
                        {rel.emoji} {rel.label}
                      </span>
                    </div>
                    {/* Prayer dots */}
                    <div className="flex items-center gap-1.5 mt-1.5">
                      {PRAYERS.map(prayer => {
                        const log = logs[prayer];
                        return (
                          <div
                            key={prayer}
                            className={cn(
                              'w-4 h-4 rounded-full',
                              log ? STATUS_COLOR[log.status] : 'bg-[var(--bg-tertiary)]'
                            )}
                            title={prayer}
                          />
                        );
                      })}
                      <span className="text-[var(--text-tertiary)] text-xs ml-1">
                        {completed}/5 today
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        if (confirm(`Remove ${profile.name}? Their prayer history will be deleted.`)) {
                          removeProfile(profile.id);
                        }
                      }}
                      className="p-2 text-[var(--text-tertiary)] hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={15} />
                    </button>
                    <Link
                      href={`/family/${profile.id}`}
                      className="p-2 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
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
            onDone={() => setShowAddModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function AddMemberModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { addProfile } = useFamilyStore();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<MemberRelationship>('child');
  const [gender, setGender] = useState<Gender>('male');
  const [emoji, setEmoji] = useState('😊');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    await addProfile({ name: name.trim(), emoji, relationship, gender });
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
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Choose an avatar</label>
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

        {/* Relationship */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">Relationship</label>
          <div className="grid grid-cols-3 gap-2">
            {(Object.entries(RELATIONSHIP_LABELS) as [MemberRelationship, { label: string; emoji: string }][]).map(([key, { label, emoji: re }]) => (
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
            ))}
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
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50"
        >
          {saving ? 'Adding…' : 'Add Member'}
        </button>
      </motion.div>
    </motion.div>
  );
}
