import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Support Hayya Falah',
  description: 'Voluntary contributions to keep Hayya Falah free for everyone, forever.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
