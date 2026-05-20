'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';
import { useAuthStore } from '@/store/auth-store';

export default function RootPage() {
  const router = useRouter();
  const { profile, isLoaded } = useUserStore();
  const { user, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    // Wait for both stores to finish initialising
    if (!isLoaded || authLoading) return;

    const skipped = typeof window !== 'undefined' && localStorage.getItem('auth_skipped') === '1';

    // Not signed in and hasn't explicitly skipped → show sign-in screen
    if (!user && !skipped) {
      router.replace('/auth');
      return;
    }

    // Signed in (or skipped) — go to the right place
    if (profile?.onboardingComplete) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }, [isLoaded, authLoading, user, profile, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center space-y-4">
        <div className="font-arabic text-4xl text-[var(--accent-primary)] animate-pulse-gentle">
          حَيَّ عَلَى الْفَلَاح
        </div>
        <div className="font-display text-lg text-[var(--text-secondary)]">
          Come to success
        </div>
      </div>
    </div>
  );
}
