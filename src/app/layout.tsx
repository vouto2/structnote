import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Import Shippori Mincho font
import { Shippori_Mincho } from "next/font/google";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const shipporiMincho = Shippori_Mincho({
  weight: "700", // Use the bold weight as in the wireframe
  subsets: ["latin"],
  variable: "--font-shippori-mincho",
});

export const metadata: Metadata = {
  title: {
    default: 'ストラクトノート',
    template: '%s | ストラクトノート',
  },
  description: '複雑な事象を構造的に整理し、本質を深く理解するための思考ツール',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <head><link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" /><link href="https://fonts.googleapis.com/css2?family=Shippori+Mincho:wght@700&display=swap" rel="stylesheet" /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} ${shipporiMincho.variable} antialiased`}>{children}</body>
    </html>
  );
}
