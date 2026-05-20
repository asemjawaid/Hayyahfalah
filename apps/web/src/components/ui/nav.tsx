'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, CalendarDays, Compass, Settings, UtensilsCrossed } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { href: '/home', label: 'Home', icon: Home },
  { href: '/fasting', label: 'Fasting', icon: UtensilsCrossed },
  { href: '/calendar', label: 'Calendar', icon: CalendarDays },
  { href: '/qibla', label: 'Qibla', icon: Compass },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

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
