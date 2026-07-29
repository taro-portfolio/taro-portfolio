"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { translations, Language } from "@/lib/i18n";

export default function InvitePage() {
  const router = useRouter();
  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string>("");
  const [inviteCount, setInviteCount] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadUserData() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);

      // ดึงจำนวนคนที่เชิญสำเร็จจากตาราง profiles จริง (เริ่มต้นที่ 0 ถ้าไม่มีข้อมูล)
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("invite_count")
        .eq("id", user.id)
        .single();

      if (profile && !error) {
        setInviteCount(profile.invite_count || 0);
      } else {
        setInviteCount(0);
      }

      setLoading(false);
    }
    loadUserData();
  }, [router]);

  // สร้างลิงก์เชิญเพื่อนจาก URL ปัจจุบัน + ID ผู้ใช้ (ชี้ไปที่หน้าสมัครสมาชิก register)
  const inviteLink = typeof window !== "undefined" 
    ? `${window.location.origin}/register?ref=${userId}` 
    : ``;

  const handleCopy = () => {
    if (!inviteLink) return;
    navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">{t.loading}</h1>
        </div>
      </main>
    );
  }

  const currentCycleCount = inviteCount % 10;
  const progressPercent = Math.min(100, (currentCycleCount / 10) * 100);
  const vipMonthsEarned = Math.floor(inviteCount / 10);

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
        <div className="mx-auto max-w-4xl">
          
          {/* Header Banner */}
          <div className="rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 p-8 border border-purple-500/30 shadow-2xl text-center relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
            
            <span className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-bold mb-4">
              🎁 {lang === "th" ? "โปรแกรมแนะนำเพื่อนรับ VIP ฟรี" : "VIP Referral Program"}
            </span>

            <h1 className="text-3xl md:text-4xl font-extrabold text-white">
              {lang === "th" ? "ชวนเพื่อนใช้งาน รับสิทธิ์ VIP 1 เดือนฟรี! 🚀" : "Invite Friends, Get Free VIP! 🚀"}
            </h1>
            <p className="mt-3 text-sm md:text-base text-slate-300 max-w-2xl mx-auto">
              {lang === "th" 
                ? "เพียงคัดลอกลิงก์ส่วนตัวของคุณส่งให้เพื่อน ครบทุกๆ 10 คนที่สมัครใช้งาน ระบบจะอัปเกรดสถานะ VIP ให้คุณอัตโนมัติทันที 1 เดือนเต็มแบบเรียลไทม์!" 
                : "Share your referral link. For every 10 friends who join, you automatically get 1 month of VIP membership free!"}
            </p>
          </div>

          {/* Stats & Progress Box */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
            
            <div className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "th" ? "เพื่อนที่คุณแนะนำสำเร็จทั้งหมด" : "Total Successful Invites"}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-white">{inviteCount}</span>
                  <span className="text-slate-400 text-sm">{lang === "th" ? "คน" : "people"}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-6">
                <div className="flex justify-between text-xs text-slate-400 mb-1.5">
                  <span>{lang === "th" ? "ความคืบหน้ารอบถัดไป (สะสมครบ 10 คน)" : "Progress to next reward"}</span>
                  <span className="font-bold text-indigo-400">{currentCycleCount} / 10</span>
                </div>
                <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden p-0.5 border border-slate-700">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500" 
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 shadow-xl flex flex-col justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  {lang === "th" ? "สิทธิ์ VIP ฟรีที่คุณได้รับสะสม" : "Total Free VIP Earned"}
                </p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-amber-400">👑 {vipMonthsEarned}</span>
                  <span className="text-slate-300 text-base font-semibold">{lang === "th" ? "เดือน" : "Months"}</span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2.5">
                <span>✨</span>
                <span>{lang === "th" ? "ระบบคำนวณและต่ออายุ VIP ให้คุณอัตโนมัติทันทีเมื่อเพื่อนสมัครครบ" : "Auto-applied to your account instantly when target reached."}</span>
              </div>
            </div>

          </div>

          {/* Share Link Box */}
          <div className="mt-8 rounded-2xl bg-slate-950 p-6 md:p-8 border border-slate-800 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-2">
              {lang === "th" ? "🔗 ลิงก์เชิญส่วนตัวของคุณ" : "🔗 Your Unique Referral Link"}
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {lang === "th" ? "ส่งลิงก์นี้ให้เพื่อนผ่าน Line, Facebook หรือกลุ่มลงทุนได้ทันที" : "Share this link with your friends."}
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input 
                type="text" 
                readOnly 
                value={inviteLink} 
                className="w-full rounded-xl bg-slate-900 border border-slate-700 px-4 py-3 text-xs md:text-sm text-indigo-300 font-mono focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className={`w-full sm:w-auto shrink-0 rounded-xl px-6 py-3 font-bold text-xs md:text-sm transition flex items-center justify-center gap-2 cursor-pointer shadow-lg ${
                  copied ? "bg-emerald-600 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
                }`}
              >
                <span>{copied ? "✅" : "📋"}</span>
                {copied ? (lang === "th" ? "คัดลอกลิงก์แล้ว!" : "Copied!") : (lang === "th" ? "คัดลอกลิงก์" : "Copy Link")}
              </button>
            </div>

            {/* Quick Share Buttons */}
            <div className="mt-6 pt-6 border-t border-slate-900 flex flex-wrap items-center gap-3">
              <span className="text-xs text-slate-400 mr-2">{lang === "th" ? "แชร์ด่วนผ่าน:" : "Share via:"}</span>
              
              <a 
                href={`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(inviteLink)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-xl bg-[#06C755]/20 border border-[#06C755]/30 px-4 py-2 text-xs font-bold text-[#06C755] hover:bg-[#06C755]/30 transition flex items-center gap-1.5"
              >
                💚 Line
              </a>

              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(inviteLink)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="rounded-xl bg-blue-600/20 border border-blue-600/30 px-4 py-2 text-xs font-bold text-blue-400 hover:bg-blue-600/30 transition flex items-center gap-1.5"
              >
                💙 Facebook
              </a>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}