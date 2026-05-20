'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

/**
 * Silently initializes Supabase auth on app load.
 * Renders nothing — just bootstraps the auth session.
 */
export function AuthInitializer() {
  const { initialize } = useAuthStore();
  useEffect(() => {
    initialize();
  }, []);
  return null;
}
