'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Trash2, ChevronRight, Copy, Check,
  Info, Search, Loader2, Bell, Mail, UserPlus, X, UserCheck,
} from 'lucide-react';
import Link from 'next/link';
import { useFamilyStore } from '@/store/family-store';
import { useAuthStore } from '@/store/auth-store';
import { BottomNav } from '@/components/ui/nav';
import { todayString } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { getMemberLogsForDateRange, db } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import type { MemberRelationship, Gender, PrayerStatus } from '@/lib/db';

// ─── Constants ────────────────────────────────────────────────────────────────

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
  local:   { label: 'Local only',     color: 'text-[var(--text-tertiary)] bg-[var(--bg-tertiary)]' },
  pending: { label: '⏳ Request sent', color: 'text-amber-400 bg-amber-400/10' },
  linked:  { label: '✓ Linked',        color: 'text-emerald-400 bg-emerald-400/10' },
};

const POSITIVE_STATUSES: PrayerStatus[] = ['on_time', 'late', 'jamaah', 'jamaah_home'];

// ─── Types ────────────────────────────────────────────────────────────────────

interface CircleRequest {
  id: string;
  requester_id: string;
  requester_name: string;
  requester_code: string;
  relationship: string;
  created_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function relLabel(rel: string): string {
  return RELATIONSHIP_LABELS[rel as MemberRelationship]?.label ?? rel;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function FamilyPage() {
  const { profiles, memberLogs, loadProfiles, loadLogsForDate, removeProfile } = useFamilyStore();
  const { user } = useAuthStore();
  const [showAddModal, setShowAddModal]     = useState(false);
  const [codeCopied, setCodeCopied]         = useState(false);
  const [showCodeInfo, setShowCodeInfo]     = useState(false);
  const [weekStats, setWeekStats]           = useState<Record<string, Record<string, number>>>({});
  const [incomingRequests, setIncomingRequests] = useState<CircleRequest[]>([]);
  const [requestsChecked, setRequestsChecked]   = useState(false);
  const today = todayString();
  const days7 = getLast7Days();

  const profileCode = user?.id
    ? user.id.replace(/-/g, '').slice(0, 8).toUpperCase()
    : null;

  const formattedCode = profileCode
    ? profileCode.slice(0, 4) + '-' + profileCode.slice(4)
    : null;

  useEffect(() => { loadProfiles(); }, []);

  useEffect(() => {
    if (profiles.length === 0) return;
    for (const p of profiles) loadLogsForDate(p.id, today);
    loadWeekStats(profiles);
  }, [profiles.length]);

  // Check Supabase circle requests whenever the user is available
  const checkCircleRequests = useCallback(async () => {
    if (!user) return;
    try {
      // ① Update local members whose outgoing requests were approved
      const { data: approved } = await supabase
        .from('circle_requests')
        .select('local_member_id')
        .eq('requester_id', user.id)
        .eq('status', 'approved');

      let anyUpdated = false;
      for (const r of (approved ?? [])) {
        if (r.local_member_id) {
          const member = await db.memberProfiles.get(r.local_member_id);
          if (member && member.linkStatus !== 'linked') {
            await db.memberProfiles.put({ ...member, linkStatus: 'linked' });
            anyUpdated = true;
          }
        }
      }
      if (anyUpdated) loadProfiles();

      // ② Load incoming pending requests
      const { data: incoming } = await supabase
        .from('circle_requests')
        .select('id, requester_id, requester_name, requester_code, relationship, created_at')
        .eq('target_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      setIncomingRequests(incoming ?? []);
    } catch {
      // Non-critical
    }
    setRequestsChecked(true);
  }, [user]);

  useEffect(() => {
    checkCircleRequests();
  }, [checkCircleRequests]);

  // Real-time subscription for new incoming requests
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`circle_req_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'circle_requests',
          filter: `target_user_id=eq.${user.id}`,
        },
        (payload) => {
          const r = payload.new as CircleRequest;
          setIncomingRequests(prev => {
            if (prev.some(x => x.id === r.id)) return prev;
            return [r, ...prev];
          });
        },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  async function loadWeekStats(profs: typeof profiles) {
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

  async function handleApprove(requestId: string) {
    await supabase
      .from('circle_requests')
      .update({ status: 'approved', responded_at: new Date().toISOString() })
      .eq('id', requestId);
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
  }

  async function handleDeny(requestId: string) {
    await supabase
      .from('circle_requests')
      .update({ status: 'denied', responded_at: new Date().toISOString() })
      .eq('id', requestId);
    setIncomingRequests(prev => prev.filter(r => r.id !== requestId));
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
          {/* Bell badge for incoming requests */}
          {requestsChecked && incomingRequests.length > 0 && (
            <div className="relative">
              <Bell size={18} className="text-amber-400" />
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-[#0D1421] text-[9px] font-bold rounded-full flex items-center justify-center">
                {incomingRequests.length}
              </span>
            </div>
          )}
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-primary)] text-[#0D1421] text-sm font-medium rounded-xl"
          >
            <Plus size={14} /> Add
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-4 space-y-3">

        {/* Incoming join requests */}
        <AnimatePresence>
          {requestsChecked && incomingRequests.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5 text-amber-400">
                <Bell size={12} />
                <span className="text-xs font-semibold uppercase tracking-wide">
                  Join requests ({incomingRequests.length})
                </span>
              </div>
              {incomingRequests.map(req => (
                <JoinRequestCard
                  key={req.id}
                  request={req}
                  onApprove={() => handleApprove(req.id)}
                  onDeny={() => handleDeny(req.id)}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

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
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
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
                  Share your code or email with family. When someone adds you by email, you'll get a notification here to approve or deny.
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
                Sign in to link with family and receive join requests.
              </p>
            </div>
            <Link href="/auth" className="text-[var(--accent-primary)] text-xs font-medium whitespace-nowrap">
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
            const todayLogs  = memberLogs[p.id] ?? {};
            const completedToday = PRAYERS.filter(pr => todayLogs[pr]).length;
            const rel        = RELATIONSHIP_LABELS[p.relationship];
            const memberWeek = weekStats[p.id] ?? {};
            const badge      = p.linkStatus ? LINK_STATUS_BADGE[p.linkStatus] : null;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-[var(--bg-secondary)] rounded-2xl p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-[var(--bg-tertiary)] flex items-center justify-center text-2xl flex-shrink-0">
                    {p.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
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
                              log.status === 'late'   ? 'bg-amber-400' :
                              log.status === 'qaza'   ? 'bg-purple-400' :
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
                          className={cn('w-3 h-3 rounded-sm transition-colors', dotColorClass(memberWeek[date] ?? 0, date, today))}
                          title={`${new Date(date + 'T12:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}: ${memberWeek[date] ?? 0}/5`}
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
            onDone={() => { setShowAddModal(false); checkCircleRequests(); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Join Request Card ────────────────────────────────────────────────────────

function JoinRequestCard({
  request,
  onApprove,
  onDeny,
}: {
  request: CircleRequest;
  onApprove: () => void;
  onDeny: () => void;
}) {
  const [acting, setActing] = useState<'approve' | 'deny' | null>(null);
  const reqName = request.requester_name || 'Someone';
  const relText = relLabel(request.relationship);
  const code    = request.requester_code
    ? request.requester_code.slice(0, 4) + '-' + request.requester_code.slice(4)
    : null;

  async function approve() {
    setActing('approve');
    await onApprove();
  }
  async function deny() {
    setActing('deny');
    await onDeny();
  }

  return (
    <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-amber-400/15 flex items-center justify-center flex-shrink-0">
          <UserPlus size={16} className="text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[var(--text-primary)] text-sm font-medium leading-snug">
            {reqName} wants to add you as <span className="text-[var(--accent-primary)]">{relText}</span>
          </p>
          {code && (
            <p className="text-[var(--text-tertiary)] text-xs mt-0.5 font-mono">{code}</p>
          )}
          <p className="text-[var(--text-tertiary)] text-xs mt-0.5">
            {new Date(request.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={approve}
          disabled={!!acting}
          className="flex-1 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {acting === 'approve'
            ? <Loader2 size={14} className="animate-spin" />
            : <UserCheck size={14} />
          }
          Approve
        </button>
        <button
          onClick={deny}
          disabled={!!acting}
          className="flex-1 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-secondary)] text-sm font-medium flex items-center justify-center gap-1.5 disabled:opacity-60"
        >
          {acting === 'deny'
            ? <Loader2 size={14} className="animate-spin" />
            : <X size={14} />
          }
          Decline
        </button>
      </div>
    </div>
  );
}

// ─── Add Member Modal ─────────────────────────────────────────────────────────

type AddMode   = 'account' | 'local';
type EmailStatus = 'idle' | 'checking' | 'found' | 'notfound';

interface FoundProfile {
  id: string;
  email: string;
  display_name: string | null;
  profile_code: string;
}

function AddMemberModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const { addProfile } = useFamilyStore();
  const { user }       = useAuthStore();

  // Mode
  const [mode, setMode] = useState<AddMode>(user ? 'account' : 'local');

  // Common fields
  const [name,         setName]         = useState('');
  const [relationship, setRelationship] = useState<MemberRelationship>('child');
  const [gender,       setGender]       = useState<Gender>('male');
  const [emoji,        setEmoji]        = useState('😊');

  // Account mode — email search
  const [email,        setEmail]        = useState('');
  const [emailStatus,  setEmailStatus]  = useState<EmailStatus>('idle');
  const [foundProfile, setFoundProfile] = useState<FoundProfile | null>(null);

  const [saving, setSaving] = useState(false);

  async function searchByEmail(val: string) {
    setEmail(val);
    setFoundProfile(null);
    const trimmed = val.trim().toLowerCase();
    if (!trimmed.includes('@') || trimmed.length < 5) {
      setEmailStatus('idle');
      return;
    }
    setEmailStatus('checking');
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, display_name, profile_code')
        .eq('email', trimmed)
        .single();
      if (error || !data) {
        setEmailStatus('notfound');
      } else {
        setEmailStatus('found');
        setFoundProfile(data as FoundProfile);
        // Auto-fill name from display_name if blank
        if (data.display_name && !name) setName(data.display_name);
      }
    } catch {
      setEmailStatus('notfound');
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (mode === 'account' && foundProfile && user) {
        // Create local member first to get its ID
        const localId = await addProfile({
          name:         name.trim(),
          emoji,
          relationship,
          gender,
          linkStatus:   'pending',
          linkedUserId: foundProfile.id,
          linkedEmail:  foundProfile.email,
        });

        // Send circle request
        const myCode = user.id.replace(/-/g, '').slice(0, 8).toUpperCase();
        await supabase.from('circle_requests').upsert(
          {
            requester_id:    user.id,
            requester_name:  user.email ?? '',
            requester_code:  myCode,
            target_user_id:  foundProfile.id,
            relationship,
            local_member_id: localId,
            status:          'pending',
          },
          { onConflict: 'requester_id,target_user_id' },
        );
      } else {
        // Local-only member
        await addProfile({ name: name.trim(), emoji, relationship, gender, linkStatus: 'local' });
      }
    } finally {
      setSaving(false);
    }
    onDone();
  }

  const canSave = name.trim().length > 0 &&
    (mode === 'local' || (mode === 'account' && emailStatus === 'found'));

  const fmtCode = foundProfile?.profile_code
    ? foundProfile.profile_code.slice(0, 4) + '-' + foundProfile.profile_code.slice(4)
    : null;

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
        className="w-full max-w-lg mx-auto bg-[var(--bg-secondary)] rounded-t-3xl p-6 space-y-5 max-h-[92vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-8 h-1 bg-[var(--bg-tertiary)] rounded-full mx-auto" />
        <h3 className="font-display text-xl text-[var(--text-primary)]">Add Member</h3>

        {/* Mode selector — only when signed in */}
        {user && (
          <div className="flex gap-2 p-1 bg-[var(--bg-tertiary)] rounded-xl">
            <button
              onClick={() => setMode('account')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mode === 'account'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)]',
              )}
            >
              <Mail size={13} /> By email
            </button>
            <button
              onClick={() => setMode('local')}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5',
                mode === 'local'
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm'
                  : 'text-[var(--text-tertiary)]',
              )}
            >
              <UserPlus size={13} /> Manually
            </button>
          </div>
        )}

        {/* Account mode — email search */}
        {mode === 'account' && user && (
          <div>
            <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1.5 block">
              Their email address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]" />
              <input
                type="email"
                inputMode="email"
                value={email}
                onChange={e => searchByEmail(e.target.value)}
                placeholder="name@example.com"
                className={cn(
                  'w-full pl-9 pr-10 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none transition-all',
                  emailStatus === 'found'    && 'ring-1 ring-emerald-400',
                  emailStatus === 'notfound' && 'ring-1 ring-rose-400',
                )}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                {emailStatus === 'checking' && <Loader2 size={16} className="animate-spin text-[var(--text-tertiary)]" />}
                {emailStatus === 'found'    && <Check   size={16} className="text-emerald-400" />}
                {emailStatus === 'notfound' && <Search  size={16} className="text-rose-400" />}
              </div>
            </div>

            {/* Found profile confirmation */}
            <AnimatePresence>
              {emailStatus === 'found' && foundProfile && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-2 p-3 bg-emerald-400/10 border border-emerald-400/30 rounded-xl flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-emerald-400/20 flex items-center justify-center text-lg flex-shrink-0">
                    {foundProfile.display_name
                      ? foundProfile.display_name[0].toUpperCase()
                      : '👤'}
                  </div>
                  <div className="min-w-0">
                    {foundProfile.display_name && (
                      <p className="text-[var(--text-primary)] text-sm font-medium">{foundProfile.display_name}</p>
                    )}
                    <p className="text-[var(--text-tertiary)] text-xs">{foundProfile.email}</p>
                    {fmtCode && (
                      <p className="text-emerald-400 text-xs font-mono">{fmtCode}</p>
                    )}
                  </div>
                  <span className="ml-auto text-emerald-400 text-xs font-semibold shrink-0">✓ Found</span>
                </motion.div>
              )}
              {emailStatus === 'notfound' && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-1.5 text-[var(--text-tertiary)] text-[11px]"
                >
                  No account found with that email — they may not have signed up yet.
                </motion.p>
              )}
              {emailStatus === 'idle' && (
                <p className="mt-1.5 text-[var(--text-tertiary)] text-[11px]">
                  They'll receive a notification to approve before being added to your circle.
                </p>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Avatar picker */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-2 block">
            Avatar
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
                    : 'bg-[var(--bg-tertiary)]',
                )}
              >
                {av}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wide mb-1 block">
            Name <span className="text-[var(--text-tertiary)] normal-case">(how you know them)</span>
          </label>
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
            {(Object.entries(RELATIONSHIP_LABELS) as [MemberRelationship, { label: string; emoji: string }][]).map(
              ([key, { label, emoji: re }]) => (
                <button
                  key={key}
                  onClick={() => setRelationship(key)}
                  className={cn(
                    'py-2.5 px-2 rounded-xl text-sm text-center transition-all',
                    relationship === key
                      ? 'bg-[var(--accent-primary)] text-[#0D1421] font-medium'
                      : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                  )}
                >
                  <div className="text-base">{re}</div>
                  <div className="text-xs mt-0.5">{label}</div>
                </button>
              ),
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
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)]',
                )}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          disabled={!canSave || saving}
          onClick={handleSave}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 transition-opacity flex items-center justify-center gap-2"
        >
          {saving && <Loader2 size={15} className="animate-spin" />}
          {mode === 'account' && emailStatus === 'found'
            ? saving ? 'Sending request…' : `Send join request to ${foundProfile?.display_name ?? foundProfile?.email?.split('@')[0] ?? 'them'}`
            : saving ? 'Adding…' : `Add ${name.trim() || 'Member'} locally`
          }
        </button>

        {mode === 'account' && emailStatus === 'found' && (
          <p className="text-center text-[var(--text-tertiary)] text-xs -mt-3">
            They'll see a notification and can approve or decline.
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}
