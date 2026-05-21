'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, Loader2, LogIn, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useUserStore } from '@/store/user-store';
import { sendPasswordReset, signInWithApple } from '@/lib/supabase';
import { cn } from '@/lib/utils';

type Screen = 'main' | 'forgot';
type Mode = 'signin' | 'signup';

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading, error, signIn, signUp, signInWithGoogle } = useAuthStore();
  const { profile } = useUserStore();

  const [screen, setScreen] = useState<Screen>('main');
  const [mode, setMode] = useState<Mode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  // Already signed in → go to the right place
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
    if (!trimEmail || !password) { setLocalError('Please fill in both fields.'); return; }
    if (mode === 'signup' && password.length < 6) {
      setLocalError('Password must be at least 6 characters.'); return;
    }
    if (mode === 'signin') {
      await signIn(trimEmail, password);
    } else {
      await signUp(trimEmail, password);
    }
  }

  async function handleGoogle() {
    setLocalError('');
    await signInWithGoogle();
  }

  async function handleApple() {
    setLocalError('');
    const { error } = await signInWithApple();
    if (error) setLocalError(error);
  }

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetEmail.trim()) return;
    setResetLoading(true);
    const { error } = await sendPasswordReset(resetEmail.trim());
    setResetLoading(false);
    if (error) setLocalError(error);
    else setResetSent(true);
  }

  const displayError = localError || error;

  // Spinner during auth init
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
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-5 py-8">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="font-arabic text-5xl text-[var(--accent-primary)] leading-tight">حَيَّ عَلَى الْفَلَاح</div>
        <div className="text-[var(--text-tertiary)] text-xs tracking-widest uppercase mt-2">Come to Success</div>
      </motion.div>

      <AnimatePresence mode="wait">

        {/* ── Forgot password screen ── */}
        {screen === 'forgot' && (
          <motion.div
            key="forgot"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="w-full max-w-sm bg-[var(--bg-secondary)] rounded-3xl p-6 space-y-4"
          >
            <button
              onClick={() => { setScreen('main'); setResetSent(false); setLocalError(''); }}
              className="flex items-center gap-1.5 text-[var(--text-tertiary)] text-sm hover:text-[var(--text-secondary)] transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>

            {resetSent ? (
              <div className="text-center space-y-3 py-4">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="text-emerald-400" size={28} />
                </div>
                <p className="font-semibold text-[var(--text-primary)]">Check your email</p>
                <p className="text-[var(--text-tertiary)] text-sm">
                  We sent a password reset link to <span className="text-[var(--accent-primary)]">{resetEmail}</span>.
                  Click it to set a new password.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <h2 className="font-display text-lg text-[var(--text-primary)]">Reset password</h2>
                  <p className="text-[var(--text-tertiary)] text-sm mt-1">
                    Enter your email and we'll send a link to set a new password.
                  </p>
                </div>
                <form onSubmit={handleForgotPassword} className="space-y-3">
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none" size={15} />
                    <input
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={resetEmail}
                      onChange={e => setResetEmail(e.target.value)}
                      placeholder="your@email.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40"
                    />
                  </div>
                  {localError && <p className="text-red-400 text-xs px-1">{localError}</p>}
                  <button
                    type="submit"
                    disabled={!resetEmail.trim() || resetLoading}
                    className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                  >
                    {resetLoading ? <Loader2 size={16} className="animate-spin" /> : 'Send reset link'}
                  </button>
                </form>
              </>
            )}
          </motion.div>
        )}

        {/* ── Main sign-in screen ── */}
        {screen === 'main' && (
          <motion.div
            key="main"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ delay: 0.06 }}
            className="w-full max-w-sm space-y-3"
          >
            {/* Social buttons */}
            <div className="space-y-2">
              <button
                onClick={handleGoogle}
                className="w-full py-3.5 bg-white text-gray-800 text-sm font-semibold rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:bg-gray-50 transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 18 18">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              <button
                onClick={handleApple}
                className="w-full py-3.5 bg-[#0D1421] text-white text-sm font-semibold rounded-2xl flex items-center justify-center gap-3 border border-white/10 hover:bg-[#1a2433] transition-colors"
              >
                {/* Apple logo */}
                <svg width="16" height="18" viewBox="0 0 814 1000" fill="currentColor">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.5-150.9-119.3C74.7 726.8 40 599.7 40 481.3c0-181.4 118.1-277.5 233.8-277.5 75.3 0 137.8 40.8 183.3 40.8 44.5 0 114.6-43.9 201.4-43.9 32.3 0 114.6 3.2 173.4 81.8zm-255.9-174.8c31.1-39.9 54.9-95.5 54.9-151.1 0-7.7-.6-15.4-1.9-21.8-52.5 1.9-114.6 34.8-152.8 78.5-28.5 32.9-55.2 88.5-55.2 145.8 0 8.3 1.3 16.6 1.9 19.2 3.2.6 8.3 1.3 13.5 1.3 47.4 0 106.3-31.7 139.6-71.9z"/>
                </svg>
                Continue with Apple
              </button>
            </div>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 border-t border-[var(--bg-tertiary)]" />
              <span className="text-[var(--text-tertiary)] text-xs">or</span>
              <div className="flex-1 border-t border-[var(--bg-tertiary)]" />
            </div>

            {/* Email + password card */}
            <div className="bg-[var(--bg-secondary)] rounded-3xl p-5 space-y-4">
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
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.12 }}
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
                      placeholder={mode === 'signin' ? 'Password' : 'Password (min. 6 characters)'}
                      className="w-full pl-10 pr-11 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
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
                    className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                  >
                    {isLoading ? <Loader2 size={16} className="animate-spin" /> : null}
                    {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                </motion.form>
              </AnimatePresence>

              {/* Forgot password */}
              {mode === 'signin' && (
                <button
                  onClick={() => { setScreen('forgot'); setResetEmail(email); setLocalError(''); }}
                  className="w-full text-center text-[var(--text-tertiary)] text-xs hover:text-[var(--text-secondary)] transition-colors"
                >
                  Forgot password?
                </button>
              )}
            </div>

            {/* Skip */}
            <button
              onClick={handleSkip}
              className="w-full py-3 text-[var(--text-tertiary)] text-sm hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-1.5"
            >
              <LogIn size={13} />
              Continue without account
            </button>

            <p className="text-[var(--text-tertiary)] text-[11px] text-center leading-relaxed max-w-xs mx-auto">
              No ads. No tracking. Your prayers stay private.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
