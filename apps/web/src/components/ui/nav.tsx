'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Heart, Settings, Sprout } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';

export function BottomNav() {
  const pathname = usePathname();
  const t = useT();

  const NAV_ITEMS = [
    { href: '/home',     label: t('nav_home'),     icon: Home },
    { href: '/habits',   label: t('nav_habits'),   icon: Sprout },
    { href: '/calendar', label: t('nav_calendar'), icon: CalendarDays },
    { href: '/giving',   label: t('nav_giving'),   icon: Heart },
    { href: '/settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--bg-tertiary)] z-50 safe-area-bottom">
      <div className="flex items-center max-w-lg mx-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex-1 flex flex-col items-center gap-1 py-3 px-1 transition-colors',
                isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
              )}
            >
              <Icon size={20} strokeWidth={isActive ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
