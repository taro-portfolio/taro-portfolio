"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { translations, Language } from "@/lib/i18n";

export default function VipDashboardPage() {
  const router = useRouter();
  
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  const [stats, setStats] = useState({
    totalEarnings: 0,
    totalClicks: 0,
    totalSignups: 0,
    vipReferrals: 0
  });

  const checkVipAccess = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    setUserEmail(user.email || "");

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, is_vip, referral_code, affiliate_clicks")
      .eq("id", user.id)
      .single();

    // 🌟 เอาเงื่อนไขดีดกลับออกแล้ว! เปิดให้เข้าชมได้อิสระ
    setUserName(profile?.first_name || user.email?.split("@")[0] || "VIP Member");

    const refCode = profile?.referral_code || user.id.substring(0, 8);
    const { data: referrals } = await supabase
      .from("profiles")
      .select("is_vip")
      .eq("referred_by", refCode);

    const signupsCount = referrals ? referrals.length : 0;
    const vipsCount = referrals ? referrals.filter((item) => item.is_vip).length : 0;
    const clicksCount = profile?.affiliate_clicks || 0;
    const earnings = vipsCount * 300;

    setStats({
      totalEarnings: earnings,
      totalClicks: clicksCount,
      totalSignups: signupsCount,
      vipReferrals: vipsCount
    });

    setLoading(false);
  }, [router]);

  useEffect(() => {
    checkVipAccess();
  }, [checkVipAccess]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">กำลังโหลดข้อมูล...</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
        <div className="mx-auto max-w-7xl">
          
          <header className="mb-10 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-950 to-purple-950/40 border border-purple-500/30 p-8 md:p-12 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500 to-amber-300 px-4 py-1 text-xs font-bold text-slate-950 uppercase tracking-widest mb-3 shadow-md">
                ⭐ VIP EXCLUSIVE LOUNGE
              </div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                {lang === "th" ? `ยินดีต้อนรับกลับ, คุณ ${userName}` : `Welcome back, ${userName}`}
              </h1>
              <p className="mt-2 text-xs text-purple-300 font-mono">
                Logged in as: {userEmail}
              </p>
              <p className="mt-3 text-slate-300 max-w-2xl text-sm md:text-base">
                {lang === "th" 
                  ? "นี่คือศูนย์กลางควบคุมระดับพรีเมียมของคุณ เข้าถึงพอร์ตการลงทุนขั้นสูงและระบบสร้างรายได้ Affiliate ได้ทันทีจากที่นี่" 
                  : "Your VIP command center. Access advanced portfolio tracking and affiliate earnings right away."}
              </p>
            </div>
          </header>

          <section className="mb-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-3xl">💸</div>
                  <div>
                    <p className="text-sm text-slate-400">{lang === "th" ? "คอมมิชชันที่ทำได้" : "Total Commission Earned"}</p>
                    <h2 className="text-2xl font-black text-white mt-1">฿{stats.totalEarnings.toLocaleString()}</h2>
                    <Link href="/affiliate-program" className="text-xs text-purple-400 font-semibold hover:text-purple-300 mt-1 inline-block">
                        {lang === "th" ? "ดูรายละเอียดการจ่ายเงิน →" : "View Payout Details →"}
                    </Link>
                  </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-sky-600/20 border border-sky-500/30 flex items-center justify-center text-3xl">🔗</div>
                  <div>
                    <p className="text-sm text-slate-400">{lang === "th" ? "จำนวนคลิก Affiliate ทั้งหมด" : "Total Affiliate Clicks"}</p>
                    <h2 className="text-2xl font-black text-sky-400 mt-1">{stats.totalClicks}</h2>
                    <Link href="/affiliate-program" className="text-xs text-sky-400 font-semibold hover:text-sky-300 mt-1 inline-block">
                        {lang === "th" ? "ดูสถิติเชิงลึก →" : "View Deep Analytics →"}
                    </Link>
                  </div>
              </div>

              <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-3xl">👥</div>
                  <div>
                    <p className="text-sm text-slate-400">{lang === "th" ? "สมัครสมาชิกสำเร็จ" : "Total Signups"}</p>
                    <h2 className="text-2xl font-black text-indigo-400 mt-1">{stats.totalSignups}</h2>
                    <Link href="/affiliate-program" className="text-xs text-indigo-400 font-semibold hover:text-indigo-300 mt-1 inline-block">
                        {lang === "th" ? "ดูรายชื่อผู้สมัคร →" : "View Signups List →"}
                    </Link>
                  </div>
              </div>

               <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-3xl">⭐</div>
                  <div>
                    <p className="text-sm text-slate-400">{lang === "th" ? "สมาชิก VIP ที่แนะนำสำเร็จ" : "Total VIP Referrals"}</p>
                    <h2 className="text-2xl font-black text-emerald-400 mt-1">{stats.vipReferrals}</h2>
                    <Link href="/affiliate-program" className="text-xs text-emerald-400 font-semibold hover:text-emerald-300 mt-1 inline-block">
                        {lang === "th" ? "ดูรายชื่อผู้สมัคร →" : "View Referral List →"}
                    </Link>
                  </div>
              </div>

          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <span className="text-3xl">🛠️</span> {lang === "th" ? "เครื่องมือการลงทุนระดับพรีเมียม" : "Premium Investment Tools"}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              
              <Link
                href="/portfolio"
                className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 hover:border-indigo-600 transition-all duration-300 shadow-xl"
              >
                <div className="text-4xl mb-6">📊</div>
                <h3 className="text-xl font-bold text-white group-hover:text-indigo-300">{lang === "th" ? "พอร์ตฟิลิปส์ขั้นสูง (แยกไม้)" : "Advanced Portfolio"}</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{lang === "th" ? "ติดตามพอร์ตหุ้นแยกรายไม้ คำนวณต้นทุนและกำไรขาดทุนแบบละเอียด" : "Track individual stock lots and analyze detailed P&L."}</p>
                <div className="mt-6 text-sm font-semibold text-indigo-400 flex items-center gap-1">
                    {lang === "th" ? "เข้าใช้งาน →" : "Access Tool →"}
                </div>
              </Link>

              <Link
                href="/affiliate-program"
                className="group relative overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 p-8 hover:border-purple-600 transition-all duration-300 shadow-xl"
              >
                <div className="text-4xl mb-6">💸</div>
                <h3 className="text-xl font-bold text-white group-hover:text-purple-300">{lang === "th" ? "สร้างรายได้ (Affiliate)" : "Affiliate Program"}</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{lang === "th" ? "จัดการลิงก์แนะนำ ตรวจสอบสถิติการคลิก และติดตามรายได้คอมมิชชันของคุณ" : "Manage referral links and track commissions."}</p>
                 <div className="mt-6 text-sm font-semibold text-purple-400 flex items-center gap-1">
                    {lang === "th" ? "จัดการโปรแกรม →" : "Manage Program →"}
                </div>
              </Link>

              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 opacity-70">
                <div className="text-4xl mb-6">🔎</div>
                <h3 className="text-xl font-bold text-white">{lang === "th" ? "VIP Stock Screener (เร็วๆ นี้)" : "VIP Stock Screener"}</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{lang === "th" ? "ค้นหาหุ้นที่มีศักยภาพด้วยฟิลเตอร์ขั้นสูงเฉพาะสมาชิก VIP" : "Filter high-potential stocks using advanced criteria."}</p>
                 <div className="mt-6 text-sm font-semibold text-amber-400">{lang === "th" ? "กำลังพัฒนา" : "In Development"}</div>
              </div>

              <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 opacity-70">
                 <div className="text-4xl mb-6">📰</div>
                <h3 className="text-xl font-bold text-white">{lang === "th" ? "รายงานตลาดเชิงลึก (เร็วๆ นี้)" : "Market Reports"}</h3>
                <p className="text-sm text-slate-400 mt-3 leading-relaxed">{lang === "th" ? "รับบทวิเคราะห์ตลาดหุ้นสหรัฐฯ รายสัปดาห์จากผู้เชี่ยวชาญ" : "Weekly U.S. market analysis."}</p>
                 <div className="mt-6 text-sm font-semibold text-amber-400">{lang === "th" ? "กำลังพัฒนา" : "In Development"}</div>
              </div>

            </div>
          </section>

          <section className="mt-10 rounded-2xl bg-slate-900 border border-slate-800 p-8 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h4 className="text-lg font-bold text-white">{lang === "th" ? "ต้องการความช่วยเหลือระดับ VIP?" : "Need VIP Priority Support?"}</h4>
                <p className="text-sm text-slate-400 mt-1">{lang === "th" ? "ทีมงานพร้อมดูแลคุณเป็นพิเศษ ติดต่อเราได้ทันที" : "Our team is ready to provide priority assistance."}</p>
            </div>
            <div>
                <button className="rounded-xl bg-amber-500 px-6 py-3 font-bold text-slate-950 hover:bg-amber-400 cursor-pointer text-sm">
                    {lang === "th" ? "ติดต่อทีมสนับสนุน VIP" : "Contact VIP Support"}
                </button>
            </div>
          </section>

        </div>
      </main>
    </>
  );
}