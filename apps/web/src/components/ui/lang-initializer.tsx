'use client';

import { useEffect } from 'react';
import { useUserStore } from '@/store/user-store';
import { isRTL } from '@/lib/i18n';

/**
 * Sets the <html> element's `lang` and `dir` attributes based on the
 * user's selected language. Must be a client component (layout.tsx is server).
 */
export function LangInitializer() {
  const lang = useUserStore(s => s.profile?.language ?? 'en');

  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute('lang', lang);
    html.setAttribute('dir', isRTL(lang) ? 'rtl' : 'ltr');
  }, [lang]);

  return null;
}
