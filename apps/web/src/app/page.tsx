'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '@/store/user-store';

export default function RootPage() {
  const router = useRouter();
  const { profile, isLoaded } = useUserStore();

  useEffect(() => {
    if (!isLoaded) return;
    if (profile?.onboardingComplete) {
      router.replace('/home');
    } else {
      router.replace('/onboarding');
    }
  }, [isLoaded, profile, router]);

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
