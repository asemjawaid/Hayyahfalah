'use client';

import { useState } from 'react';
import {
  ChevronRight, User, Palette, Globe, Clock, Bell, Shield, Info, Download,
  Moon, Heart, MapPin, Compass, Users
} from 'lucide-react';
import { BottomNav } from '@/components/ui/nav';
import { useUserStore } from '@/store/user-store';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { useAuthStore } from '@/store/auth-store';
import { saveProfile } from '@/lib/db';
import { CALCULATION_METHOD_LABELS, type CalculationMethodKey } from '@/lib/prayer-engine';
import { cn } from '@/lib/utils';
import type { Theme, Madhab, Terminology, Gender } from '@/lib/db';
import { db } from '@/lib/db';
import Link from 'next/link';

type Section =
  | null | 'profile' | 'appearance' | 'language' | 'calculation'
  | 'notifications' | 'privacy' | 'about' | 'womens' | 'zakat';

const THEMES: { id: Theme; name: string; mode: string }[] = [
  { id: 'fajr_dark', name: 'Fajr', mode: 'Dark' },
  { id: 'fajr_light', name: 'Fajr', mode: 'Light' },
  { id: 'midnight_dark', name: 'Midnight Ink', mode: 'Dark' },
  { id: 'midnight_light', name: 'Midnight Ink', mode: 'Light' },
  { id: 'verdant_dark', name: 'Verdant', mode: 'Dark' },
  { id: 'verdant_light', name: 'Verdant', mode: 'Light' },
  { id: 'clay_dark', name: 'Warm Clay', mode: 'Dark' },
  { id: 'clay_light', name: 'Warm Clay', mode: 'Light' },
];

const TERMINOLOGIES: { id: Terminology; label: string; example: string }[] = [
  { id: 'arabic', label: 'Arabic', example: 'Salah · Sawm · Wudu' },
  { id: 'urdu', label: 'Urdu / Persian', example: 'Namaz · Roza · Wuzu' },
  { id: 'indonesian', label: 'Indonesian', example: 'Shalat · Puasa · Wudhu' },
  { id: 'malay', label: 'Malay', example: 'Solat · Puasa · Wuduk' },
  { id: 'turkish', label: 'Turkish', example: 'Namaz · Oruç · Abdest' },
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'ar', label: 'العربية' },
  { code: 'ur', label: 'اُردُو' },
  { code: 'id', label: 'Bahasa Indonesia' },
  { code: 'tr', label: 'Türkçe' },
  { code: 'fr', label: 'Français' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'ms', label: 'Bahasa Melayu' },
];

export default function SettingsPage() {
  const [section, setSection] = useState<Section>(null);
  const { profile, updateProfile } = useUserStore();
  const { setCalculationSettings } = usePrayerTimesStore();

  async function handleUpdateProfile(updates: Parameters<typeof updateProfile>[0]) {
    updateProfile(updates);
    await saveProfile(updates);
    if (updates.theme) {
      document.documentElement.setAttribute('data-theme', updates.theme);
    }
    // Immediately recalculate prayer times when calculation settings change
    if (updates.calculationMethod !== undefined || updates.madhab !== undefined) {
      const currentProfile = { ...profile, ...updates };
      setCalculationSettings(
        (currentProfile.calculationMethod as CalculationMethodKey) ?? 'MuslimWorldLeague',
        currentProfile.madhab === 'hanafi' ? 'hanafi' : 'shafi'
      );
    }
  }

  if (section === 'profile') return <ProfileSection profile={profile} onBack={() => setSection(null)} onSave={handleUpdateProfile} />;
  if (section === 'appearance') return <AppearanceSection profile={profile} onBack={() => setSection(null)} onSave={handleUpdateProfile} />;
  if (section === 'language') return <LanguageSection profile={profile} onBack={() => setSection(null)} onSave={handleUpdateProfile} />;
  if (section === 'calculation') return <CalculationSection profile={profile} onBack={() => setSection(null)} onSave={handleUpdateProfile} />;
  if (section === 'notifications') return <NotificationsSection onBack={() => setSection(null)} />;
  if (section === 'privacy') return <PrivacySection onBack={() => setSection(null)} />;
  if (section === 'womens') return <WomensModeSection profile={profile} onBack={() => setSection(null)} onSave={handleUpdateProfile} />;
  if (section === 'about') return <AboutSection onBack={() => setSection(null)} />;

  const sections = [
    { id: 'profile', icon: User, label: 'Account & Profile', desc: profile?.name || 'Optional' },
    { id: 'appearance', icon: Palette, label: 'Appearance', desc: profile?.theme?.replace('_', ' ') ?? 'Fajr Dark' },
    { id: 'language', icon: Globe, label: 'Language & Terminology', desc: (profile?.language?.toUpperCase() ?? 'EN') + ' · ' + (profile?.terminology ?? 'arabic') },
    { id: 'calculation', icon: Clock, label: 'Prayer Calculation', desc: CALCULATION_METHOD_LABELS[profile?.calculationMethod as CalculationMethodKey] ?? 'Muslim World League' },
    { id: 'notifications', icon: Bell, label: 'Notifications', desc: 'Configure reminders' },
    { id: 'privacy', icon: Shield, label: 'Privacy', desc: 'Your data, your control' },
    ...(profile?.gender === 'female' ? [{ id: 'womens', icon: Moon, label: "Women's Mode", desc: profile?.womensModeEnabled ? 'Enabled' : 'Disabled' }] : []),
    { id: 'about', icon: Info, label: 'About', desc: 'Version 0.2.0' },
  ] as const;

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="font-display text-2xl text-[var(--text-primary)]">Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-4 space-y-2">
        {sections.map(({ id, icon: Icon, label, desc }) => (
          <button
            key={id}
            onClick={() => setSection(id as Section)}
            className="w-full flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Icon size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[var(--text-primary)] font-medium">{label}</div>
              <div className="text-[var(--text-tertiary)] text-xs">{desc}</div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </button>
        ))}

        {/* Extra links */}
        <div className="pt-2 space-y-2">
          <Link
            href="/family"
            className="w-full flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Users size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[var(--text-primary)] font-medium">Family & Students</div>
              <div className="text-[var(--text-tertiary)] text-xs">Track prayers for family members and students</div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </Link>

          <Link
            href="/qibla"
            className="w-full flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Compass size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[var(--text-primary)] font-medium">Qibla Compass</div>
              <div className="text-[var(--text-tertiary)] text-xs">Find the direction of Makkah</div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </Link>

          <Link
            href="/mosques"
            className="w-full flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <MapPin size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[var(--text-primary)] font-medium">Mosque Finder</div>
              <div className="text-[var(--text-tertiary)] text-xs">Find nearby mosques via OpenStreetMap</div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </Link>

          <Link
            href="/zakat"
            className="w-full flex items-center gap-4 p-4 bg-[var(--bg-secondary)] rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--bg-tertiary)] flex items-center justify-center">
              <Heart size={20} className="text-[var(--accent-primary)]" />
            </div>
            <div className="flex-1 text-left">
              <div className="text-[var(--text-primary)] font-medium">Zakat Calculator</div>
              <div className="text-[var(--text-tertiary)] text-xs">Track assets, nisab & payments</div>
            </div>
            <ChevronRight size={16} className="text-[var(--text-tertiary)]" />
          </Link>
        </div>

        {/* Quick actions */}
        <div className="pt-2">
          <button
            onClick={async () => {
              const [prayerLogs, fastingLogs, qazaLedger, nightPrayers] = await Promise.all([
                db.prayerLog.toArray(),
                db.fastingLog.toArray(),
                db.qazaLedger.toArray(),
                db.nightPrayerLog.toArray(),
              ]);
              const data = { prayerLogs, fastingLogs, qazaLedger, nightPrayers, exportedAt: new Date().toISOString() };
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url; a.download = 'hayya-falah-export.json'; a.click();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl border border-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:border-[var(--accent-secondary)] transition-colors"
          >
            <Download size={16} /> Export all my data (JSON)
          </button>
        </div>

        {/* Mission */}
        <div className="pt-4 text-center space-y-1">
          <div className="font-arabic text-lg text-[var(--accent-primary)]">حَيَّ عَلَى الْفَلَاح</div>
          <div className="text-[var(--text-tertiary)] text-xs">No ads. No tracking. Pay what you want.</div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}

function SettingsHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="sticky top-0 z-30 bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--bg-secondary)]">
      <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
        <button onClick={onBack} className="text-[var(--accent-primary)] hover:opacity-70 transition-opacity">
          ← Back
        </button>
        <h2 className="font-display text-xl text-[var(--text-primary)]">{title}</h2>
      </div>
    </div>
  );
}

function ProfileSection({ profile, onBack, onSave }: any) {
  const [name, setName] = useState(profile?.name ?? '');
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'not_specified');
  const [dob, setDob] = useState(profile?.dateOfBirth ?? '');
  const { user, isLoading, isSyncing, error, signIn, signUp, logout } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Account & Profile" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">

        {/* ── Cloud sync / auth ── */}
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[var(--accent-primary)]" />
            <span className="text-[var(--text-primary)] font-medium text-sm">Cloud Sync</span>
            {isSyncing && <span className="text-[var(--text-tertiary)] text-xs">Syncing…</span>}
          </div>

          {user ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <div className="text-[var(--text-secondary)] text-sm truncate">{user.email}</div>
                  <div className="text-[var(--accent-primary)] text-xs mt-0.5">✓ Signed in — data syncs automatically</div>
                </div>
              </div>

              {/* Profile Code — share this to let family members link to you */}
              <div className="bg-[var(--bg-tertiary)] rounded-xl px-4 py-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-[var(--text-tertiary)] text-[10px] uppercase tracking-wide">Your Profile Code</div>
                  <div className="font-mono text-[var(--accent-primary)] text-lg tracking-widest mt-0.5">
                    {user.id.replace(/-/g, '').slice(0, 8).toUpperCase()}
                  </div>
                </div>
                <button
                  onClick={() => {
                    const code = user.id.replace(/-/g, '').slice(0, 8).toUpperCase();
                    navigator.clipboard.writeText(code).catch(() => {});
                  }}
                  className="text-[var(--text-tertiary)] text-xs border border-[var(--bg-secondary)] px-2.5 py-1.5 rounded-lg hover:text-[var(--text-secondary)] transition-colors"
                >
                  Copy
                </button>
              </div>
              <p className="text-[var(--text-tertiary)] text-[11px] leading-relaxed">
                Share this code with family members so they can identify your account when adding you.
              </p>

              <button
                onClick={async () => { await logout(); }}
                className="w-full py-2.5 border border-[var(--bg-tertiary)] text-[var(--text-tertiary)] rounded-xl text-sm hover:border-red-400 hover:text-red-400 transition-colors"
              >
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Mode tabs */}
              <div className="flex bg-[var(--bg-tertiary)] rounded-xl p-1 gap-1">
                {(['signin', 'signup'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => setAuthMode(m)}
                    className={cn(
                      'flex-1 py-1.5 text-xs font-medium rounded-lg transition-all',
                      authMode === m
                        ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                        : 'text-[var(--text-secondary)]'
                    )}
                  >
                    {m === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                ))}
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none text-sm"
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={authMode === 'signin' ? 'Password' : 'Create password (min. 6 chars)'}
                className="w-full px-4 py-2.5 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none text-sm"
              />
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button
                disabled={!email || !password || isLoading}
                onClick={() => authMode === 'signin' ? signIn(email, password) : signUp(email, password)}
                className="w-full py-2.5 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 text-sm"
              >
                {isLoading ? 'Please wait…' : authMode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </div>
          )}
        </div>

        {/* ── Display name / gender ── */}
        <div className="space-y-5">
          <div>
            <label className="text-[var(--text-secondary)] text-sm">Name (optional)</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              className="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
            />
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-sm block mb-2">Gender (optional)</label>
            <div className="flex gap-2">
              {([['male', 'Male'], ['female', 'Female'], ['not_specified', 'Prefer not to say']] as [Gender, string][]).map(([g, l]) => (
                <button key={g} onClick={() => setGender(g)} className={cn('flex-1 py-2.5 rounded-xl text-xs font-medium transition-all', gender === g ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]')}>
                  {l}
                </button>
              ))}
            </div>
            {gender === 'female' && (
              <p className="text-[var(--text-tertiary)] text-xs mt-2">Enables Women's Mode for cycle tracking.</p>
            )}
          </div>
          <div>
            <label className="text-[var(--text-secondary)] text-sm">Date of birth (optional)</label>
            <input
              type="date"
              value={dob}
              onChange={e => setDob(e.target.value)}
              className="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-[var(--text-primary)] focus:outline-none"
            />
            <p className="text-[var(--text-tertiary)] text-xs mt-1">Used for Qaza estimation only.</p>
          </div>
          <button
            onClick={() => { onSave({ name: name || undefined, gender, dateOfBirth: dob || undefined }); onBack(); }}
            className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl"
          >
            Save profile
          </button>
        </div>
      </div>
    </div>
  );
}

function AppearanceSection({ profile, onBack, onSave }: any) {
  const [selected, setSelected] = useState<Theme>(profile?.theme ?? 'fajr_dark');

  function applyTheme(t: Theme) {
    setSelected(t);
    document.documentElement.setAttribute('data-theme', t);
    onSave({ theme: t });
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Appearance" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        {THEMES.map(t => (
          <button
            key={t.id}
            onClick={() => applyTheme(t.id)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-xl border transition-all',
              selected === t.id ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)]' : 'border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-secondary)]'
            )}
          >
            <div className="text-left flex-1">
              <span className="text-[var(--text-primary)] font-medium">{t.name}</span>
              <span className="text-[var(--text-tertiary)] text-sm ml-2">{t.mode}</span>
            </div>
            {selected === t.id && <span className="text-[var(--accent-primary)]">✓</span>}
          </button>
        ))}
      </div>
    </div>
  );
}

function LanguageSection({ profile, onBack, onSave }: any) {
  const [lang, setLang] = useState(profile?.language ?? 'en');
  const [terminology, setTerminology] = useState<Terminology>(profile?.terminology ?? 'arabic');

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Language & Terminology" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h3 className="text-[var(--text-secondary)] text-sm mb-3">Display Language</h3>
          <div className="space-y-1">
            {LANGUAGES.map(({ code, label }) => (
              <button
                key={code}
                onClick={() => { setLang(code); onSave({ language: code }); }}
                className={cn(
                  'w-full flex items-center justify-between px-4 py-3 rounded-xl text-left transition-all',
                  lang === code ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                )}
              >
                <span>{label}</span>
                {lang === code && <span className="text-[var(--accent-primary)]">✓</span>}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-[var(--text-secondary)] text-sm mb-1">Religious Terminology</h3>
          <p className="text-[var(--text-tertiary)] text-xs mb-3">Independent of UI language — choose how you refer to prayer and fasting.</p>
          <div className="space-y-2">
            {TERMINOLOGIES.map(({ id, label, example }) => (
              <button
                key={id}
                onClick={() => { setTerminology(id); onSave({ terminology: id }); }}
                className={cn(
                  'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
                  terminology === id ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)]' : 'border-[var(--bg-tertiary)] bg-[var(--bg-secondary)]'
                )}
              >
                <div className="text-left">
                  <div className="text-[var(--text-primary)] font-medium text-sm">{label}</div>
                  <div className="text-[var(--text-tertiary)] text-xs">{example}</div>
                </div>
                {terminology === id && <span className="text-[var(--accent-primary)]">✓</span>}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CalculationSection({ profile, onBack, onSave }: any) {
  const [method, setMethod] = useState<CalculationMethodKey>(profile?.calculationMethod ?? 'MuslimWorldLeague');
  const [madhab, setMadhab] = useState<Madhab>(profile?.madhab ?? 'shafii');

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Prayer Calculation" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h3 className="text-[var(--text-secondary)] text-sm mb-2">Calculation Method</h3>
          <div className="space-y-1 max-h-72 overflow-y-auto">
            {Object.entries(CALCULATION_METHOD_LABELS)
              .filter(([k]) => k !== 'Custom')
              .map(([id, label]) => (
                <button
                  key={id}
                  onClick={() => { setMethod(id as CalculationMethodKey); onSave({ calculationMethod: id }); }}
                  className={cn(
                    'w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-left',
                    method === id ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]' : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
                  )}
                >
                  <span>{label}</span>
                  {method === id && <span className="text-[var(--accent-primary)]">✓</span>}
                </button>
              ))}
          </div>
        </div>
        <div>
          <h3 className="text-[var(--text-secondary)] text-sm mb-2">Asr Calculation (Madhab)</h3>
          <div className="flex gap-2">
            {([['shafii', "Shafi'i/Maliki/Hanbali"], ['hanafi', 'Hanafi']] as [Madhab, string][]).map(([id, label]) => (
              <button
                key={id}
                onClick={() => { setMadhab(id); onSave({ madhab: id }); }}
                className={cn(
                  'flex-1 py-2.5 rounded-xl text-sm font-medium transition-all',
                  madhab === id ? 'bg-[var(--accent-primary)] text-[#0D1421]' : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="text-[var(--text-tertiary)] text-xs mt-2">Affects the time of Asr prayer. Hanafi Asr is later than other madhabs.</p>
        </div>
      </div>
    </div>
  );
}

function NotificationsSection({ onBack }: { onBack: () => void }) {
  const [permission, setPermission] = useState<NotificationPermission>(
    typeof Notification !== 'undefined' ? Notification.permission : 'default'
  );
  const [masterOn, setMasterOn] = useState(permission === 'granted');
  const [permError, setPermError] = useState('');

  async function handleMasterToggle(val: boolean) {
    if (val) {
      if (typeof Notification === 'undefined') {
        setPermError('Notifications are not supported in this browser.');
        return;
      }
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setMasterOn(true);
        setPermError('');
        new Notification('Hayya Falah', {
          body: 'Prayer reminders are now enabled. May Allah ﷻ keep you consistent. 🌙',
          icon: '/icon-192.png',
        });
      } else {
        setMasterOn(false);
        setPermError(
          result === 'denied'
            ? 'Notifications blocked. Enable them in your browser/phone settings.'
            : 'Permission not granted.'
        );
      }
    } else {
      setMasterOn(false);
    }
  }

  const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Notifications" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">

        {/* Main toggle */}
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[var(--text-primary)] font-medium">Prayer reminders</div>
              <div className="text-[var(--text-tertiary)] text-xs mt-0.5">
                {permission === 'granted' ? 'Permission granted ✓' : 'Requires browser permission'}
              </div>
            </div>
            <Toggle value={masterOn} onChange={handleMasterToggle} />
          </div>
          {permError && (
            <p className="text-red-400 text-xs mt-2">{permError}</p>
          )}
        </div>

        {/* How it works info */}
        <div className="bg-[var(--bg-tertiary)] rounded-xl p-4 space-y-2">
          <p className="text-[var(--text-secondary)] text-sm font-medium">How prayer notifications work</p>
          <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">
            Notifications are scheduled each time you open the app. For reliable alerts throughout the day, install Hayya Falah to your home screen (Add to Home Screen in Safari/Chrome) so it runs as a proper app.
          </p>
        </div>

        {masterOn && (
          <div className="space-y-2">
            <p className="text-[var(--text-secondary)] text-sm font-medium">Reminder timing</p>
            {PRAYERS.map(prayer => (
              <div key={prayer} className="bg-[var(--bg-secondary)] rounded-xl p-4 flex items-center justify-between">
                <div className="text-[var(--text-primary)] text-sm font-medium">{prayer}</div>
                <div className="text-[var(--text-tertiary)] text-xs">At adhan time</div>
              </div>
            ))}
          </div>
        )}

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3">
          <p className="text-[var(--text-primary)] font-medium text-sm">Hijri reminders</p>
          <p className="text-[var(--text-tertiary)] text-xs">Coming soon — Ashura, Arafah, White Days, Sunnah fasts.</p>
        </div>
      </div>
    </div>
  );
}

function PrivacySection({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Privacy" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <div className="bg-[var(--bg-secondary)] rounded-2xl p-5 space-y-4">
          <div className="font-display text-lg text-[var(--text-primary)]">Your data, your control</div>
          {[
            ['All prayer data stored locally', 'IndexedDB on your device. Never sent to any server.'],
            ['No account required', 'The app works fully without signing in or creating an account.'],
            ['No ads, no tracking', 'No analytics SDKs, no ad networks, no cookies that follow you.'],
            ['Cycle data stays local', "Women's cycle data is never synced or shared. Ever."],
            ['Zakat data stays local', 'Your financial information never leaves your device.'],
          ].map(([title, desc]) => (
            <div key={title as string} className="flex items-start gap-3">
              <span className="text-[var(--accent-primary)] mt-0.5">✓</span>
              <div>
                <div className="text-[var(--text-secondary)] text-sm font-medium">{title}</div>
                <div className="text-[var(--text-tertiary)] text-xs">{desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-3">
          <div className="text-[var(--text-primary)] font-medium text-sm">Anonymous usage data</div>
          <p className="text-[var(--text-tertiary)] text-xs">Help us improve Hayya Falah by sharing anonymous, aggregated usage statistics. No personal data, no prayer logs, no identifiers.</p>
          <div className="flex items-center justify-between">
            <span className="text-[var(--text-secondary)] text-sm">Share anonymous data</span>
            <Toggle value={false} onChange={() => {}} />
          </div>
        </div>

        <div className="text-center text-[var(--text-tertiary)] text-xs space-y-1">
          <p>Hayya Falah is committed to dignity and privacy.</p>
          <p>Source code for privacy-critical modules will be open-sourced.</p>
        </div>
      </div>
    </div>
  );
}

function WomensModeSection({ profile, onBack, onSave }: any) {
  const [enabled, setEnabled] = useState(profile?.womensModeEnabled ?? false);
  const [pregnancy, setPregnancy] = useState(profile?.pregnancyMode ?? false);
  const [breastfeeding, setBreastfeeding] = useState(profile?.breastfeedingMode ?? false);

  function toggle(key: string, value: boolean) {
    onSave({ [key]: value });
    if (key === 'womensModeEnabled') setEnabled(value);
    if (key === 'pregnancyMode') setPregnancy(value);
    if (key === 'breastfeedingMode') setBreastfeeding(value);
  }

  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="Women's Mode" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
        <p className="text-[var(--text-secondary)] text-sm">
          Hayya Falah respects that menstruation and certain conditions excuse women from prayer and fasting per Islamic rulings.
        </p>

        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[var(--text-primary)] font-medium">Cycle tracking</div>
              <div className="text-[var(--text-tertiary)] text-xs mt-0.5">Auto-excuses prayers during menstruation. Data stays on your device.</div>
            </div>
            <Toggle value={enabled} onChange={v => toggle('womensModeEnabled', v)} />
          </div>

          {enabled && (
            <>
              <div className="border-t border-[var(--bg-tertiary)] pt-4">
                <p className="text-[var(--text-tertiary)] text-xs mb-3">Use the "Start cycle" button on the home screen to begin tracking. Prayers will be automatically marked as excused.</p>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[var(--text-secondary)] text-sm">Pregnancy mode</div>
                  <div className="text-[var(--text-tertiary)] text-xs">Tracks modified fasting reminders and nifas (postpartum)</div>
                </div>
                <Toggle value={pregnancy} onChange={v => toggle('pregnancyMode', v)} />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[var(--text-secondary)] text-sm">Breastfeeding mode</div>
                  <div className="text-[var(--text-tertiary)] text-xs">Fasting exemption reminders per your madhab</div>
                </div>
                <Toggle value={breastfeeding} onChange={v => toggle('breastfeedingMode', v)} />
              </div>
            </>
          )}
        </div>

        <div className="bg-[var(--bg-tertiary)] rounded-xl p-3">
          <p className="text-[var(--text-tertiary)] text-xs">
            All cycle and pregnancy data is stored locally only and never synced. Consult a qualified scholar for specific fiqh rulings related to your madhab.
          </p>
        </div>
      </div>
    </div>
  );
}

function AboutSection({ onBack }: { onBack: () => void }) {
  return (
    <div className="min-h-screen pb-24 bg-[var(--bg-primary)]">
      <SettingsHeader title="About" onBack={onBack} />
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6 text-center">
        <div className="space-y-3">
          <div className="font-arabic text-4xl text-[var(--accent-primary)]">حَيَّ عَلَى الْفَلَاح</div>
          <div className="font-display text-xl text-[var(--text-primary)]">Hayya Falah</div>
          <div className="text-[var(--text-secondary)] italic">Come to success</div>
        </div>
        <div className="text-[var(--text-tertiary)] text-sm space-y-1">
          <div>Version 0.2.0</div>
          <div>Privacy-first Muslim worship companion</div>
        </div>
        <div className="bg-[var(--bg-secondary)] rounded-xl p-4 text-left space-y-2">
          {[
            'No ads, ever',
            'No data sold or tracked',
            'Offline-first — works without internet',
            'Pay what you want',
            'Dignified — no shame, no streaks',
          ].map(p => (
            <div key={p} className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
              <span className="text-[var(--accent-primary)]">✓</span> {p}
            </div>
          ))}
        </div>
        <div className="text-[var(--text-tertiary)] text-xs space-y-1">
          <p>Prayer times calculated using the Adhan algorithm.</p>
          <p>Verify times with your local masjid.</p>
          <p>Mosque data courtesy of OpenStreetMap contributors.</p>
        </div>
        <div className="text-[var(--accent-primary)] font-arabic text-xl">آمين</div>
      </div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={cn(
        'relative w-11 h-6 rounded-full transition-all duration-200',
        value ? 'bg-[var(--accent-primary)]' : 'bg-[var(--bg-tertiary)]'
      )}
    >
      <span
        className={cn(
          'absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200',
          value ? 'left-[22px]' : 'left-0.5'
        )}
      />
    </button>
  );
}
