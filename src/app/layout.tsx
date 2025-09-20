import type { Metadata } from "next";
import { Inter, Inconsolata } from "next/font/google";
import "./globals.css";

// Import Shippori Mincho font
import { Shippori_Mincho } from "next/font/google";

const inter = Inter({
  variable: "--font-geist-sans", // CSS variable name is kept for simplicity
  subsets: ["latin"],
});

const inconsolata = Inconsolata({
  variable: "--font-geist-mono", // CSS variable name is kept for simplicity
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
      <head />
      <body className={`${inter.variable} ${inconsolata.variable} ${shipporiMincho.variable} antialiased`}>{children}</body>
    </html>
  );
}