import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Taro Portfolio Tracker",
  description: "แอปติดตามพอร์ตหุ้นและการลงทุน Taro Portfolio",
  manifest: "/manifest.json",
  themeColor: "#020617",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Taro Portfolio",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/* 🌟 บังคับความกว้างหน้าจอให้แสดงผลแบบคอมพิวเตอร์ (Desktop View) บนมือถือ */}
        <meta name="viewport" content="width=1200, initial-scale=0.3, maximum-scale=5.0, user-scalable=yes" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}