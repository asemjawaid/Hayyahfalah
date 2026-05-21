'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useUserStore } from '@/store/user-store';
import { cn } from '@/lib/utils';

type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading, error, signIn, signUp, signInWithGoogle } = useAuthStore();
  const { profile } = useUserStore();

  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');

  // Already signed in → go home
  useEffect(() => {
    if (!isLoading && user) {
      router.replace(profile?.onboardingComplete ? '/home' : '/onboarding');
    }
  }, [isLoading, user, profile, router]);

  function handleSkip() {
    if (typeof window !== 'undefined') localStorage.setItem('auth_skipped', '1');
    router.replace(profile?.onboardingComplete ? '/home' : '/onboarding');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLocalError('');
    const trimEmail = email.trim();
    if (!trimEmail || !password) { setLocalError('Please enter your email and password.'); return; }
    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.'); return;
    }
    if (mode === 'signin') await signIn(trimEmail, password);
    else await signUp(trimEmail, password);
  }

  async function handleGoogle() {
    setLocalError('');
    await signInWithGoogle();
  }

  const displayError = localError || error;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="font-arabic text-4xl text-[var(--accent-primary)] animate-pulse-gentle">حَيَّ عَلَى الْفَلَاح</div>
          <Loader2 className="animate-spin text-[var(--accent-primary)] mx-auto" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-5">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="font-arabic text-5xl text-[var(--accent-primary)] leading-tight">حَيَّ عَلَى الْفَلَاح</div>
        <div className="text-[var(--text-tertiary)] text-xs tracking-widest uppercase mt-2">Come to Success</div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="w-full max-w-sm bg-[var(--bg-secondary)] rounded-3xl p-6 space-y-5"
      >
        {/* Tab switcher */}
        <div className="flex bg-[var(--bg-tertiary)] rounded-xl p-1 gap-1">
          {(['signin', 'signup'] as Mode[]).map(m => (
            <button
              key={m}
              onClick={() => { setMode(m); setLocalError(''); }}
              className={cn(
                'flex-1 py-2 text-sm font-medium rounded-lg transition-all',
                mode === m
                  ? 'bg-[var(--accent-primary)] text-[#0D1421]'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              )}
            >
              {m === 'signin' ? 'Sign In' : 'Create Account'}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.form
            key={mode}
            initial={{ opacity: 0, x: mode === 'signup' ? 10 : -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: mode === 'signup' ? -10 : 10 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleSubmit}
            className="space-y-3"
          >
            {/* Email */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" size={15} />
              <input
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
              />
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" size={15} />
              <input
                type={showPassword ? 'text' : 'password'}
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signin' ? 'Password' : 'Create a password (min. 6 chars)'}
                className="w-full pl-10 pr-11 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {/* Error */}
            {displayError && (
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-red-400 text-xs px-1">
                {displayError}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={!email.trim() || !password || isLoading}
              className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-opacity"
            >
              {isLoading
                ? <Loader2 size={16} className="animate-spin" />
                : mode === 'signin' ? 'Sign In' : 'Create Account'
              }
            </button>
          </motion.form>
        </AnimatePresence>

        {/* Divider */}
        <div className="relative flex items-center gap-3">
          <div className="flex-1 border-t border-[var(--bg-tertiary)]" />
          <span className="text-[var(--text-tertiary)] text-xs">or</span>
          <div className="flex-1 border-t border-[var(--bg-tertiary)]" />
        </div>

        {/* Google */}
        <button
          onClick={handleGoogle}
          className="w-full py-3 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-primary)] text-[var(--text-primary)] text-sm font-medium rounded-xl flex items-center justify-center gap-2.5 transition-colors border border-[var(--bg-primary)]"
        >
          {/* Google SVG */}
          <svg width="18" height="18" viewBox="0 0 18 18">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>

        {/* Skip */}
        <button
          onClick={handleSkip}
          className="w-full py-2.5 text-[var(--text-tertiary)] text-sm rounded-xl hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1.5"
        >
          <LogIn size={13} />
          Continue without account
        </button>
      </motion.div>

      <p className="text-[var(--text-tertiary)] text-[11px] text-center mt-5 max-w-xs leading-relaxed">
        No ads. No tracking. Your data is stored privately and syncs across your devices.
      </p>
    </div>
  );
}
