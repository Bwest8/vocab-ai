import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Vocab AI",
  description: "AI-powered vocabulary learning with flashcards, games, and progress tracking.",
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-icon.png',
    other: [
      { rel: 'icon', type: 'image/svg+xml', url: '/icon0.svg' },
      { rel: 'icon', type: 'image/png', url: '/icon1.png' },
    ]
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4f46e5" />
        <meta name="apple-mobile-web-app-title" content="Vocab AI" />
      </head>
        <body className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-slate-50`}>
        {children}
      </body>
    </html>
  );
}
