"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Language } from "@/lib/i18n";

interface NavbarProps {
  lang?: Language;
  setLang?: (lang: Language) => void;
}

export default function Navbar({ lang = "th", setLang }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const [isVip, setIsVip] = useState(false);

  // 🌟 อัปเดตเงื่อนไขเช็ค path ให้ตรงกับโฟลเดอร์ live-stock-news
  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/live-stock-news") ||
    pathname.startsWith("/vip") ||
    pathname.startsWith("/affiliate-program") ||
    pathname.startsWith("/settings");

  useEffect(() => {
    async function checkUserVip() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from("profiles")
        .select("is_vip")
        .eq("id", user.id)
        .single();

      if (data && data.is_vip) {
        setIsVip(true);
      } else {
        setIsVip(false);
      }
    }
    checkUserVip();
  }, [pathname]);

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-8">

        {/* โลโก้และชื่อเว็บ (แทนที่ข้อความ TARO เดิม) */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <img
            src="https://dqnrixhptlgceimxdvwo.supabase.co/storage/v1/object/public/slips/S__113950723.jpg"
            alt="TARO Portfolio Logo"
            className="w-10 h-10 rounded-xl object-cover border border-indigo-500/30 shadow-md group-hover:scale-105 transition"
          />
          <div className="flex flex-col">
            <span className="text-lg font-extrabold tracking-wider text-white leading-tight">
              TARO
            </span>
            <span className="text-[10px] font-semibold text-slate-400 tracking-widest uppercase">
              Portfolio
            </span>
          </div>
        </Link>

        {!isDashboard ? (
          <>
            <div className="hidden gap-8 text-slate-300 md:flex">
              <a href="#features" className="hover:text-white">
                {lang === "th" ? "ฟีเจอร์" : "Features"}
              </a>

              <a href="#pricing" className="hover:text-white">
                {lang === "th" ? "ราคา" : "Pricing"}
              </a>

              <Link href="/vip" className="hover:text-white">
                VIP
              </Link>

              <a href="#contact" className="hover:text-white">
                {lang === "th" ? "ติดต่อ" : "Contact"}
              </a>
            </div>

            <div className="flex items-center gap-3">
              {setLang && (
                <div className="flex overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-xs">
                  <button
                    onClick={() => setLang("th")}
                    className={`px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                      lang === "th" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇹🇭 TH
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={`px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                      lang === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              )}

              <Link
                href="/login"
                className="rounded-lg border border-slate-600 px-5 py-2 text-white hover:bg-slate-800"
              >
                Login
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-5 py-2 font-semibold text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          </>
        ) : (
          <>
            <div className="hidden gap-6 text-slate-300 md:flex items-center">
              <Link href="/dashboard" className="hover:text-white">
                {lang === "th" ? "แดชบอร์ด" : "Dashboard"}
              </Link>

              <Link href="/portfolio" className="hover:text-white">
                {lang === "th" ? "พอร์ตฟิลิปส์" : "Portfolio"}
              </Link>

              {/* 🌟 ปรับลิงก์ให้ตรงกับโฟลเดอร์ /live-stock-news */}
              <Link href="/live-stock-news" className="hover:text-white flex items-center gap-1.5">
                <span>📰</span> {lang === "th" ? "วิเคราะห์ข่าวหุ้นเรียลไทม์" : "Live Stock News"}
              </Link>

              {/* เมนู VIP หลัก พาไปหน้าสมัคร/ดูข้อมูล VIP */}
              <Link href="/vip" className="hover:text-white">
                VIP
              </Link>

              {/* ปุ่มเข้าสู่ระบบ VIP */}
              <Link 
                href="/vip/dashboard" 
                className="rounded-lg bg-purple-600/20 border border-purple-500/40 px-3 py-1.5 text-xs font-bold text-purple-300 hover:bg-purple-600 hover:text-white transition"
              >
                {lang === "th" ? "เข้าสู่ระบบVIP" : "VIP Login"}
              </Link>

              {/* เมนูสร้างรายได้ Affiliate */}
              <Link 
                href="/affiliate-program" 
                className="hover:text-purple-400 font-semibold text-purple-300 text-sm"
              >
                {lang === "th" ? "สร้างรายได้ (Affiliate)" : "Affiliate"}
              </Link>

              <Link href="/settings" className="hover:text-white">
                {lang === "th" ? "ตั้งค่า" : "Settings"}
              </Link>
            </div>

            <div className="flex items-center gap-3">
              {setLang && (
                <div className="flex overflow-hidden rounded-lg border border-slate-800 bg-slate-900 shadow-xs">
                  <button
                    onClick={() => setLang("th")}
                    className={`px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                      lang === "th" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇹🇭 TH
                  </button>
                  <button
                    onClick={() => setLang("en")}
                    className={`px-2.5 py-1.5 text-xs font-medium transition cursor-pointer ${
                      lang === "en" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    🇺🇸 EN
                  </button>
                </div>
              )}

              <button
                onClick={handleLogout}
                className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700 cursor-pointer"
              >
                {lang === "th" ? "ออกจากระบบ" : "Logout"}
              </button>
            </div>
          </>
        )}

      </div>
    </nav>
  );
}