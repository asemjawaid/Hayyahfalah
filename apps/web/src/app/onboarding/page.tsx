'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore, defaultProfile } from '@/store/user-store';
import { usePrayerTimesStore } from '@/store/prayer-times-store';
import { saveProfile } from '@/lib/db';
import type { Madhab, Theme, Terminology } from '@/lib/db';
import { CALCULATION_METHOD_LABELS, type CalculationMethodKey } from '@/lib/prayer-engine';
import { cn } from '@/lib/utils';
import { MapPin, Settings, Moon, Sun, ChevronRight, Check } from 'lucide-react';

type Step = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

const THEMES: { id: Theme; name: string; mode: string; colors: string[] }[] = [
  { id: 'fajr_dark', name: 'Fajr', mode: 'Dark', colors: ['#0D1421', '#1A2238', '#D4A574', '#F4EDE4'] },
  { id: 'fajr_light', name: 'Fajr', mode: 'Light', colors: ['#FDF6EC', '#F5E7D0', '#B8854A', '#1A2238'] },
  { id: 'midnight_dark', name: 'Midnight Ink', mode: 'Dark', colors: ['#080C14', '#0F1520', '#7B8FD4', '#E8ECF8'] },
  { id: 'midnight_light', name: 'Midnight Ink', mode: 'Light', colors: ['#E8ECF8', '#D0D8F0', '#5A6DBF', '#0F1520'] },
  { id: 'verdant_dark', name: 'Verdant', mode: 'Dark', colors: ['#0A1510', '#122018', '#5FB87A', '#E8F4EC'] },
  { id: 'verdant_light', name: 'Verdant', mode: 'Light', colors: ['#E8F4EC', '#D0ECD8', '#3A9456', '#0A1510'] },
  { id: 'clay_dark', name: 'Warm Clay', mode: 'Dark', colors: ['#1A0E08', '#2A1A10', '#E8995A', '#F8EEE6'] },
  { id: 'clay_light', name: 'Warm Clay', mode: 'Light', colors: ['#F8EEE6', '#ECD8C8', '#C8743A', '#1A0E08'] },
];

const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'ur', name: 'Urdu', native: 'اُردُو' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa Indonesia' },
  { code: 'tr', name: 'Turkish', native: 'Türkçe' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ms', name: 'Malay', native: 'Bahasa Melayu' },
];

const TERMINOLOGIES: { id: Terminology; label: string; example: string }[] = [
  { id: 'arabic', label: 'Arabic', example: 'Salah / Sawm / Wudu' },
  { id: 'urdu', label: 'Urdu/Persian', example: 'Namaz / Roza / Wuzu' },
  { id: 'indonesian', label: 'Indonesian', example: 'Shalat / Puasa / Wudhu' },
  { id: 'malay', label: 'Malay', example: 'Solat / Puasa / Wuduk' },
  { id: 'turkish', label: 'Turkish', example: 'Namaz / Oruç / Abdest' },
];

const METHODS = Object.entries(CALCULATION_METHOD_LABELS)
  .filter(([k]) => k !== 'Custom')
  .map(([id, label]) => ({ id: id as CalculationMethodKey, label }));

const MADHABS: { id: Madhab; label: string; desc: string }[] = [
  { id: 'shafii', label: "Shafi'i / Maliki / Hanbali", desc: 'Earlier Asr (shadow = 1× object)' },
  { id: 'hanafi', label: 'Hanafi', desc: 'Later Asr (shadow = 2× object)' },
  { id: 'jafari', label: "Ja'fari (Shia)", desc: 'Shia tradition' },
  { id: 'maliki', label: 'Maliki', desc: "Same as Shafi'i for Asr" },
  { id: 'hanbali', label: 'Hanbali', desc: "Same as Shafi'i for Asr" },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { setProfile, updateProfile } = useUserStore();
  const { locate, setManualLocation } = usePrayerTimesStore();

  const [step, setStep] = useState<Step>(1);
  const [data, setData] = useState<Partial<{
    language: string;
    theme: Theme;
    locationGranted: boolean;
    calculationMethod: CalculationMethodKey;
    madhab: Madhab;
    terminology: Terminology;
    name: string;
    gender: 'female' | 'male' | 'not_specified';
    womensModeEnabled: boolean;
  }>>({ theme: 'fajr_dark', language: 'en', calculationMethod: 'MuslimWorldLeague', madhab: 'shafii', terminology: 'arabic' });

  const total = 8;

  function next() {
    if (step < total) setStep((s) => (s + 1) as Step);
    else finish();
  }

  function back() {
    if (step > 1) setStep((s) => (s - 1) as Step);
  }

  async function finish() {
    const profile = {
      ...defaultProfile,
      language: data.language ?? 'en',
      theme: data.theme ?? 'fajr_dark',
      calculationMethod: data.calculationMethod ?? 'MuslimWorldLeague',
      madhab: data.madhab ?? 'shafii',
      terminology: data.terminology ?? 'arabic',
      name: data.name,
      gender: data.gender,
      womensModeEnabled: data.womensModeEnabled,
      onboardingComplete: true,
    };
    setProfile(profile);
    await saveProfile(profile);
    router.push('/home');
  }

  async function handleLocation() {
    await locate();
    setData(d => ({ ...d, locationGranted: true }));
    next();
  }

  function handleManualLocation() {
    setManualLocation(21.3891, 39.8579, 'Makkah');
    setData(d => ({ ...d, locationGranted: false }));
    next();
  }

  const applyTheme = (theme: Theme) => {
    document.documentElement.setAttribute('data-theme', theme);
    setData(d => ({ ...d, theme }));
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Progress bar */}
      <div className="h-1 bg-[var(--bg-tertiary)]">
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-500"
          style={{ width: `${(step / total) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col max-w-lg mx-auto w-full px-6 py-8">
        {/* Step content */}
        <div className="flex-1 animate-fade-in">
          {step === 1 && <StepWelcome onBegin={next} />}
          {step === 2 && <StepLanguage value={data.language ?? 'en'} onChange={l => setData(d => ({ ...d, language: l }))} onNext={next} />}
          {step === 3 && <StepTheme value={data.theme ?? 'fajr_dark'} onChange={applyTheme} onNext={next} />}
          {step === 4 && <StepLocation onAllow={handleLocation} onManual={handleManualLocation} />}
          {step === 5 && <StepMethod value={data.calculationMethod ?? 'MuslimWorldLeague'} madhab={data.madhab ?? 'shafii'} onChange={(m, md) => setData(d => ({ ...d, calculationMethod: m, madhab: md }))} onNext={next} />}
          {step === 6 && <StepTerminology value={data.terminology ?? 'arabic'} onChange={t => setData(d => ({ ...d, terminology: t }))} onNext={next} />}
          {step === 7 && <StepProfile name={data.name} gender={data.gender} onChange={(n, g) => setData(d => ({ ...d, name: n, gender: g }))} onNext={next} onSkip={next} />}
          {step === 8 && <StepReady onFinish={finish} />}
        </div>

        {/* Back button */}
        {step > 1 && step < 8 && (
          <button onClick={back} className="mt-6 text-[var(--text-tertiary)] text-sm hover:text-[var(--text-secondary)] transition-colors">
            ← Back
          </button>
        )}
      </div>
    </div>
  );
}

function StepWelcome({ onBegin }: { onBegin: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-16">
      <div className="space-y-4">
        <div className="font-arabic text-5xl text-[var(--accent-primary)] leading-relaxed">
          حَيَّ عَلَى الْفَلَاح
        </div>
        <div className="font-display text-3xl text-[var(--text-primary)]">Hayya Falah</div>
        <div className="text-[var(--text-secondary)] text-lg font-light italic">Come to success</div>
      </div>

      <div className="space-y-2 text-sm text-[var(--text-tertiary)]">
        <div>No ads. No tracking. Your data stays yours.</div>
      </div>

      <button
        onClick={onBegin}
        className="w-full max-w-xs py-4 px-8 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-2xl text-lg hover:bg-[var(--accent-secondary)] transition-colors"
      >
        Begin
      </button>
    </div>
  );
}

function StepLanguage({ value, onChange, onNext }: { value: string; onChange: (l: string) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Select Language</h2>
        <p className="text-[var(--text-secondary)] mt-1">Choose your preferred display language</p>
      </div>
      <div className="space-y-2">
        {LANGUAGES.map(lang => (
          <button
            key={lang.code}
            onClick={() => { onChange(lang.code); onNext(); }}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
              value === lang.code
                ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)]'
                : 'border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-secondary)]'
            )}
          >
            <div className="flex items-center gap-3">
              <span className="text-[var(--text-primary)] font-medium">{lang.name}</span>
              <span className="text-[var(--text-secondary)]">{lang.native}</span>
            </div>
            {value === lang.code && <Check size={18} className="text-[var(--accent-primary)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepTheme({ value, onChange, onNext }: { value: Theme; onChange: (t: Theme) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Choose Your Theme</h2>
        <p className="text-[var(--text-secondary)] mt-1">Select a visual style that feels right</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {THEMES.map(theme => (
          <button
            key={theme.id}
            onClick={() => { onChange(theme.id); }}
            className={cn(
              'p-3 rounded-xl border-2 text-left transition-all',
              value === theme.id ? 'border-[var(--accent-primary)]' : 'border-transparent hover:border-[var(--bg-tertiary)]'
            )}
          >
            <div className="flex gap-1 mb-2">
              {theme.colors.map((c, i) => (
                <div key={i} className="w-6 h-6 rounded-full" style={{ background: c }} />
              ))}
            </div>
            <div className="text-[var(--text-primary)] text-sm font-medium">{theme.name}</div>
            <div className="text-[var(--text-tertiary)] text-xs">{theme.mode}</div>
          </button>
        ))}
      </div>
      <button
        onClick={onNext}
        className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl hover:bg-[var(--accent-secondary)] transition-colors"
      >
        Continue
      </button>
    </div>
  );
}

function StepLocation({ onAllow, onManual }: { onAllow: () => void; onManual: () => void }) {
  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-[var(--bg-secondary)] flex items-center justify-center">
          <MapPin size={32} className="text-[var(--accent-primary)]" />
        </div>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Your Location</h2>
        <p className="text-[var(--text-secondary)] leading-relaxed">
          Hayya Falah calculates prayer times for your location — on your device.
          We never send your location anywhere.
        </p>
      </div>
      <div className="space-y-3">
        <button
          onClick={onAllow}
          className="w-full py-4 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl hover:bg-[var(--accent-secondary)] transition-colors flex items-center justify-center gap-2"
        >
          <MapPin size={18} />
          Allow location access
        </button>
        <button
          onClick={onManual}
          className="w-full py-4 border border-[var(--bg-tertiary)] text-[var(--text-secondary)] rounded-xl hover:border-[var(--accent-secondary)] transition-colors"
        >
          Enter city manually
        </button>
      </div>
    </div>
  );
}

function StepMethod({ value, madhab, onChange, onNext }: {
  value: CalculationMethodKey;
  madhab: Madhab;
  onChange: (method: CalculationMethodKey, madhab: Madhab) => void;
  onNext: () => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Calculation Method</h2>
        <p className="text-[var(--text-secondary)] mt-1">Select your regional authority</p>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {METHODS.map(m => (
          <button
            key={m.id}
            onClick={() => onChange(m.id, madhab)}
            className={cn(
              'w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm text-left transition-all',
              value === m.id
                ? 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]'
            )}
          >
            <span>{m.label}</span>
            {value === m.id && <Check size={14} className="text-[var(--accent-primary)] shrink-0" />}
          </button>
        ))}
      </div>
      <div className="border-t border-[var(--bg-tertiary)] pt-4">
        <p className="text-[var(--text-secondary)] text-sm mb-2">Asr calculation (madhab)</p>
        <div className="flex gap-2">
          {(['shafii', 'hanafi'] as Madhab[]).map(m => (
            <button
              key={m}
              onClick={() => onChange(value, m)}
              className={cn(
                'flex-1 py-2 rounded-lg text-sm font-medium transition-all',
                madhab === m
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              )}
            >
              {m === 'hanafi' ? 'Hanafi' : "Shafi'i"}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onNext} className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl hover:bg-[var(--accent-secondary)] transition-colors">
        Continue
      </button>
    </div>
  );
}

function StepTerminology({ value, onChange, onNext }: { value: Terminology; onChange: (t: Terminology) => void; onNext: () => void }) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Prayer Terminology</h2>
        <p className="text-[var(--text-secondary)] mt-1">How do you refer to prayer in your tradition?</p>
      </div>
      <div className="space-y-2">
        {TERMINOLOGIES.map(t => (
          <button
            key={t.id}
            onClick={() => { onChange(t.id); onNext(); }}
            className={cn(
              'w-full flex items-center justify-between p-4 rounded-xl border transition-all',
              value === t.id
                ? 'border-[var(--accent-primary)] bg-[var(--bg-secondary)]'
                : 'border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] hover:border-[var(--accent-secondary)]'
            )}
          >
            <div>
              <div className="text-[var(--text-primary)] font-medium">{t.label}</div>
              <div className="text-[var(--text-tertiary)] text-sm">{t.example}</div>
            </div>
            {value === t.id && <Check size={16} className="text-[var(--accent-primary)]" />}
          </button>
        ))}
      </div>
    </div>
  );
}

function StepProfile({ name, gender, onChange, onNext, onSkip }: {
  name?: string;
  gender?: 'female' | 'male' | 'not_specified';
  onChange: (name: string | undefined, gender: 'female' | 'male' | 'not_specified' | undefined) => void;
  onNext: () => void;
  onSkip: () => void;
}) {
  const [localName, setLocalName] = useState(name ?? '');
  const [localGender, setLocalGender] = useState(gender);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-2xl text-[var(--text-primary)]">Your Profile</h2>
        <p className="text-[var(--text-secondary)] mt-1">Optional — stored only on your device</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="text-[var(--text-secondary)] text-sm">Your name (for greeting)</label>
          <input
            value={localName}
            onChange={e => setLocalName(e.target.value)}
            placeholder="Optional"
            className="mt-1 w-full px-4 py-3 rounded-xl bg-[var(--bg-secondary)] border border-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
          />
        </div>
        <div>
          <label className="text-[var(--text-secondary)] text-sm">Gender (enables women's mode)</label>
          <div className="flex gap-2 mt-1">
            {(['male', 'female', 'not_specified'] as const).map(g => (
              <button
                key={g}
                onClick={() => setLocalGender(g)}
                className={cn(
                  'flex-1 py-2 rounded-xl text-sm font-medium border transition-all',
                  localGender === g
                    ? 'border-[var(--accent-primary)] bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
                    : 'border-[var(--bg-tertiary)] bg-[var(--bg-secondary)] text-[var(--text-secondary)]'
                )}
              >
                {g === 'not_specified' ? 'Prefer not to say' : g.charAt(0).toUpperCase() + g.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="space-y-2 pt-2">
        <button
          onClick={() => { onChange(localName || undefined, localGender); onNext(); }}
          className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl hover:bg-[var(--accent-secondary)] transition-colors"
        >
          Continue
        </button>
        <button onClick={onSkip} className="w-full py-2 text-[var(--text-tertiary)] text-sm hover:text-[var(--text-secondary)] transition-colors">
          Skip for now
        </button>
      </div>
    </div>
  );
}

function StepReady({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center space-y-8 pt-12">
      <div className="space-y-4">
        <div className="text-5xl">🌙</div>
        <h2 className="font-display text-3xl text-[var(--text-primary)]">You're all set</h2>
        <p className="text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
          May Allah ﷻ accept your worship and make your path to success easy.
        </p>
        <p className="font-arabic text-2xl text-[var(--accent-primary)]">آمين</p>
      </div>
      <button
        onClick={onFinish}
        className="w-full max-w-xs py-4 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-2xl text-lg hover:bg-[var(--accent-secondary)] transition-colors"
      >
        Enter Hayya Falah
      </button>
      <p className="text-[var(--text-tertiary)] text-xs">
        No ads. No tracking. Pay what you want.
      </p>
    </div>
  );
}
