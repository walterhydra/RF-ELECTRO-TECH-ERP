import React from 'react';
import '@/styles/globals.css';
import type { Metadata } from 'next';
import { Inter, IBM_Plex_Sans_Condensed, IBM_Plex_Mono } from 'next/font/google';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const plexCondensed = IBM_Plex_Sans_Condensed({ weight: ['400', '500', '600', '700'], subsets: ['latin'], variable: '--font-plex-condensed' });
const plexMono = IBM_Plex_Mono({ weight: ['400', '500', '600'], subsets: ['latin'], variable: '--font-plex-mono' });

export const metadata: Metadata = {
  title: 'RF Electro — PCB Manufacturing ERP',
  description: 'Production-traceability-first PCB Manufacturing ERP system',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${plexCondensed.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
