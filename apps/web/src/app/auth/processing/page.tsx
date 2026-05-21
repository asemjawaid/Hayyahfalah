'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

/**
 * Client-side OAuth / PKCE code exchange.
 * The PKCE verifier is in localStorage (set by signInWithOAuth), so this
 * MUST run in the browser — the server route just forwards here.
 */
export default function AuthProcessingPage() {
  const router = useRouter();

  useEffect(() => {
    const process = async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');
      const next = params.get('next') ?? '/';

      if (code) {
        // Exchange auth code for session — works because PKCE verifier is in localStorage
        await supabase.auth.exchangeCodeForSession(code).catch(() => {});
      }
      // onAuthStateChange in auth-store will handle the SIGNED_IN event
      router.replace(next);
    };
    process();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
      <div className="text-center space-y-4">
        <div className="font-arabic text-4xl text-[var(--accent-primary)] animate-pulse-gentle">
          حَيَّ عَلَى الْفَلَاح
        </div>
        <Loader2 className="animate-spin text-[var(--accent-primary)] mx-auto" size={28} />
        <p className="text-[var(--text-secondary)] text-sm">Signing you in…</p>
      </div>
    </div>
  );
}
