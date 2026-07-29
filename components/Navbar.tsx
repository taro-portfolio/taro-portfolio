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

  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/portfolio") ||
    pathname.startsWith("/live-stock-news") ||
    pathname.startsWith("/vip") ||
    pathname.startsWith("/invite") ||
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

  // ฟังก์ชันป้องกันและตรวจสอบสิทธิ์ VIP (บังคับเปลี่ยนหน้าด้วย window.location.href เพื่อความชัวร์)
  const handleVipProtectedClick = async (e: React.MouseEvent<HTMLAnchorElement>, targetPath: string) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data } = await supabase
      .from("profiles")
      .select("is_vip")
      .eq("id", user.id)
      .single();

    if (data && data.is_vip) {
      window.location.href = targetPath; // 🌟 พุ่งตรงไปหน้าปลายทางทันที
    } else {
      window.location.href = "/vip/pay";
    }
  };

  return (
    <nav className="w-full border-b border-slate-800 bg-slate-950 sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        
        {/* แถวบน: โลโก้, ภาษา และปุ่มออกจากระบบ/ล็อกอิน */}
        <div className="flex h-20 items-center justify-between">
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
                className="rounded-lg border border-slate-600 px-4 py-2 text-xs md:text-sm text-white hover:bg-slate-800"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-blue-600 px-4 py-2 text-xs md:text-sm font-semibold text-white hover:bg-blue-700"
              >
                Get Started
              </Link>
            </div>
          ) : (
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
                className="rounded-lg bg-red-600 px-4 py-2 text-xs md:text-sm text-white hover:bg-red-700 cursor-pointer font-medium"
              >
                {lang === "th" ? "ออกจากระบบ" : "Logout"}
              </button>
            </div>
          )}
        </div>

        {/* แถวล่าง: เมนูนำทางทั้งหมด */}
        {isDashboard && (
          <div className="flex items-center gap-5 overflow-x-auto border-t border-slate-800/80 py-3 text-sm text-slate-300 no-scrollbar">
            <Link href="/dashboard" className="whitespace-nowrap hover:text-white transition">
              {lang === "th" ? "แดชบอร์ด" : "Dashboard"}
            </Link>

            <Link href="/portfolio" className="whitespace-nowrap hover:text-white transition">
              {lang === "th" ? "พอร์ตฟิลิปส์" : "Portfolio"}
            </Link>

            {/* 🌟 ปุ่มพิเศษ VIP Free เด่นสะดุดตา */}
            <Link
              href="/invite"
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 via-purple-600 to-indigo-600 px-3.5 py-1.5 text-xs font-black text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] border border-amber-400/50 hover:scale-105 active:scale-95 transition animate-pulse whitespace-nowrap"
            >
              <span>🎁👑</span>
              <span>{lang === "th" ? "VIP Free (ชวนเพื่อน)" : "🎁 VIP Free"}</span>
            </Link>

            {/* วิเคราะห์ข่าวหุ้นเรียลไทม์ */}
            <a 
              href="/live-stock-news" 
              onClick={(e) => handleVipProtectedClick(e, "/live-stock-news")}
              className="whitespace-nowrap hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <span>📰</span> {lang === "th" ? "วิเคราะห์ข่าวหุ้นเรียลไทม์" : "Live Stock News"}
            </a>

            {/* วิเคราะห์หุ้นเชิงลึก VIP */}
            <a 
              href="/vip" 
              onClick={(e) => handleVipProtectedClick(e, "/vip")}
              className="whitespace-nowrap hover:text-white transition cursor-pointer"
            >
              {lang === "th" ? "วิเคราะห์หุ้นเชิงลึกVIP" : "VIP Deep Analysis"}
            </a>

            {/* สิทธิประโยชน์สมาชิก VIP */}
            <a 
              href="/vip/dashboard" 
              onClick={(e) => handleVipProtectedClick(e, "/vip/dashboard")}
              className="whitespace-nowrap rounded-lg bg-purple-600/20 border border-purple-500/40 px-3 py-1 text-xs font-bold text-purple-300 hover:bg-purple-600 hover:text-white transition cursor-pointer"
            >
              {lang === "th" ? "สิทธิประโยชน์สมาชิกVIP" : "VIP Benefits"}
            </a>

            {/* สร้างรายได้ (Affiliate) */}
            <a 
              href="/affiliate-program" 
              onClick={(e) => handleVipProtectedClick(e, "/affiliate-program")}
              className="whitespace-nowrap hover:text-purple-400 font-semibold text-purple-300 text-sm transition cursor-pointer"
            >
              {lang === "th" ? "สร้างรายได้ (Affiliate)" : "Affiliate"}
            </a>

            <Link href="/settings" className="whitespace-nowrap hover:text-white transition">
              {lang === "th" ? "ตั้งค่า" : "Settings"}
            </Link>
          </div>
        )}

      </div>
    </nav>
  );
}