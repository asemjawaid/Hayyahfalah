import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthInitializer } from '@/components/auth/auth-initializer';

export const metadata: Metadata = {
  title: 'Hayya Falah — حَيَّ عَلَى الْفَلَاح',
  description: 'Come to success. A privacy-first Muslim worship companion. No ads, no tracking, your data stays yours.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Hayya Falah',
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#0D1421',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="fajr_dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body suppressHydrationWarning className="bg-[var(--bg-primary)] text-[var(--text-primary)] min-h-screen antialiased">
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
