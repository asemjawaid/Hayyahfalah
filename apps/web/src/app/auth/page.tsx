'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Loader2, CheckCircle, ArrowRight, LogIn } from 'lucide-react';
import { useAuthStore } from '@/store/auth-store';
import { useUserStore } from '@/store/user-store';

export default function AuthPage() {
  const router = useRouter();
  const { user, isLoading, emailSent, error, sendMagicLink, resetEmailSent } = useAuthStore();
  const { profile } = useUserStore();
  const [email, setEmail] = useState('');

  // If already signed in, send to the right page
  useEffect(() => {
    if (!isLoading && user) {
      if (profile?.onboardingComplete) {
        router.replace('/home');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [isLoading, user, profile, router]);

  function handleSkip() {
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth_skipped', '1');
    }
    if (profile?.onboardingComplete) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    await sendMagicLink(trimmed);
  }

  // Show spinner while initializing
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
        <div className="text-center space-y-4">
          <div className="font-arabic text-4xl text-[var(--accent-primary)] animate-pulse-gentle">
            حَيَّ عَلَى الْفَلَاح
          </div>
          <Loader2 className="animate-spin text-[var(--accent-primary)] mx-auto" size={24} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex flex-col items-center justify-center px-6">
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="text-center mb-10"
      >
        <div className="font-arabic text-5xl text-[var(--accent-primary)] leading-tight mb-2">
          حَيَّ عَلَى الْفَلَاح
        </div>
        <div className="font-display text-xl text-[var(--text-secondary)] tracking-widest uppercase text-xs mt-2">
          Hayya Falah · Come to Success
        </div>
      </motion.div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.4 }}
        className="w-full max-w-sm bg-[var(--bg-secondary)] rounded-3xl p-6"
      >
        <AnimatePresence mode="wait">
          {emailSent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center space-y-4 py-4"
            >
              <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="text-emerald-400" size={32} />
              </div>
              <div>
                <p className="font-semibold text-[var(--text-primary)] text-lg">Check your email</p>
                <p className="text-[var(--text-tertiary)] text-sm mt-1">
                  We sent a sign-in link to
                </p>
                <p className="text-[var(--accent-primary)] text-sm font-medium mt-0.5">{email}</p>
              </div>
              <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">
                Tap the link in your email — it will open the app and sign you in automatically.
              </p>
              <button
                onClick={() => { resetEmailSent(); setEmail(''); }}
                className="text-[var(--text-secondary)] text-sm underline underline-offset-2"
              >
                Try a different email
              </button>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="space-y-5"
            >
              <div>
                <h2 className="font-display text-xl text-[var(--text-primary)]">Sign in</h2>
                <p className="text-[var(--text-tertiary)] text-sm mt-1 leading-relaxed">
                  Back up your prayers and sync across all your devices. No password — just a magic link.
                </p>
              </div>

              <form onSubmit={handleSend} className="space-y-3">
                <div className="relative">
                  <Mail
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)] pointer-events-none"
                    size={15}
                  />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    autoComplete="email"
                    inputMode="email"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-[var(--bg-tertiary)] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)]/40 transition-all"
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs px-1"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={!email.trim() || isLoading}
                  className="w-full py-3 bg-[var(--accent-primary)] text-[#0D1421] font-semibold rounded-xl disabled:opacity-50 flex items-center justify-center gap-2 text-sm transition-opacity"
                >
                  {isLoading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <ArrowRight size={16} />
                  )}
                  Send magic link
                </button>
              </form>

              {/* Divider */}
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-[var(--bg-tertiary)]" />
                <span className="text-[var(--text-tertiary)] text-xs">or</span>
                <div className="flex-1 border-t border-[var(--bg-tertiary)]" />
              </div>

              {/* Skip */}
              <button
                onClick={handleSkip}
                className="w-full py-3 text-[var(--text-secondary)] text-sm rounded-xl border border-[var(--bg-tertiary)] hover:bg-[var(--bg-tertiary)] transition-colors flex items-center justify-center gap-2"
              >
                <LogIn size={15} />
                Continue without account
              </button>

              <p className="text-[var(--text-tertiary)] text-[11px] text-center leading-relaxed">
                You can sign in later from Settings at any time.
                Your data is stored privately — no ads, no tracking.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
