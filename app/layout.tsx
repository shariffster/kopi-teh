import type { Metadata, Viewport } from 'next';
import './globals.css';
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#ccbaa3',
};
export const metadata: Metadata = {
  title: 'Kopi / Teh — Pour lab',
  icons: { icon: '/favicon.svg' },
  description:
    'Pour, stir and serve. A tactile exploration of familiar kopi and teh, made your way.',
  robots: { index: false, follow: false },
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
