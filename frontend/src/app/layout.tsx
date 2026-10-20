import React from 'react';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Quicksand, IBM_Plex_Mono } from 'next/font/google';
import FloatingCalculator from '@/components/ui/FloatingCalculator';

const quicksand = Quicksand({
  weight: ['300', '400', '500', '600', '700'],
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-quicksand',
});

const plexMono = IBM_Plex_Mono({
  weight: ['400', '500', '600'],
  subsets: ['latin'],
  variable: '--font-plex-mono',
});

export const metadata: Metadata = {
  title: 'RF Electro — PCB Manufacturing ERP',
  description: 'Production-traceability-first PCB Manufacturing ERP system',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${quicksand.variable} ${plexMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={`min-h-screen bg-slate-100 text-slate-900 ${quicksand.className} font-quicksand antialiased`}>
        {children}
        <FloatingCalculator />
      </body>
    </html>
  );
}
