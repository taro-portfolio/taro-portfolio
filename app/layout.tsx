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
        {/* 🌟 ล็อคขนาด Viewport ให้กว้าง 1200px แบบหน้าจอคอม */}
        <meta name="viewport" content="width=1200, user-scalable=yes" />
      </head>
      <body className={inter.className}>
        {children}
        {/* 🌟 สคริปต์เสริมช่วยปรับหน้าจอมือถือให้แสดงผลแบบเดสก์ท็อปอัตโนมัติ */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if (window.innerWidth < 1024) {
                var mv = document.querySelector('meta[name="viewport"]');
                if (mv) {
                  mv.content = 'width=1200, initial-scale=' + (window.innerWidth / 1200) + ', user-scalable=yes';
                }
              }
            `,
          }}
        />
      </body>
    </html>
  );
}