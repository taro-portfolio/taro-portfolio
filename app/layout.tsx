import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TARO PORTFOLIO",
  description: "แอพติดตามพอร์ตหุ้นและการลงทุน TARO PORTFOLIO",
  manifest: "/manifest.json",
  themeColor: "#020617",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TARO PORTFOLIO",
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
        {/* 🌟 บังคับให้มือถือแสดงผลเต็มจอแบบเดสก์ท็อป */}
        <meta name="viewport" content="width=1200" />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}