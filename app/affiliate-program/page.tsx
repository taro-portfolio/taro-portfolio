"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { translations, Language } from "@/lib/i18n";

export default function AffiliatePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  const [totalEarnings, setTotalEarnings] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralLink, setReferralLink] = useState("");
  const [copied, setCopied] = useState(false);

  // ข้อมูลสำหรับฟอร์มถอนเงิน
  const [bankName, setBankName] = useState("กสิกรไทย (KBANK)");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [remark, setRemark] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // ระบบตรวจสอบสิทธิ์และเงื่อนไขการถอน
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [withdrawalMessage, setWithdrawalMessage] = useState("");
  const [hasWithdrawnThisMonth, setHasWithdrawnThisMonth] = useState(false);

  const checkWithdrawalRules = async (userId: string) => {
    const today = new Date();
    const currentDate = today.getDate();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const isDateAllowed = currentDate >= 25 && currentDate <= lastDayOfMonth;

    const startOfMonthIso = new Date(currentYear, currentMonth, 1).toISOString();
    const { data: pastWithdrawals } = await supabase
      .from("withdrawals")
      .select("id, created_at")
      .eq("user_id", userId)
      .gte("created_at", startOfMonthIso);

    const alreadyWithdrawn = pastWithdrawals && pastWithdrawals.length > 0;
    setHasWithdrawnThisMonth(Boolean(alreadyWithdrawn));

    if (alreadyWithdrawn) {
      setIsWithdrawOpen(false);
      setWithdrawalMessage(
        lang === "th"
          ? "🔒 คุณได้ทำรายการถอนเงินของเดือนนี้ไปแล้ว (จำกัดการถอน 1 ครั้งต่อเดือน)"
          : "🔒 You have already withdrawn for this month (Limit: 1 time per month)."
      );
    } else if (!isDateAllowed) {
      setIsWithdrawOpen(false);
      setWithdrawalMessage(
        lang === "th"
          ? "🔒 ระบบถอนเงินจะเปิดให้ใช้งานเฉพาะช่วงสิ้นเดือน (วันที่ 25 - สิ้นเดือน)"
          : "🔒 Withdrawals are only available from the 25th to the end of the month."
      );
    } else {
      setIsWithdrawOpen(true);
      setWithdrawalMessage(
        lang === "th"
          ? "🟢 เปิดระบบถอนเงินรอบสิ้นเดือนแล้ว! (จำกัด 1 ครั้ง/เดือน | เงินเข้า 1-3 วันทำการ)"
          : "🟢 Withdrawal open! (1 time/month | Funds arrive in 1-3 business days)"
      );
    }
  };

  const fetchAffiliateData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, is_vip, referral_code")
      .eq("id", user.id)
      .single();

    if (profile) {
      if (!profile.is_vip) {
        router.replace("/vip/pay");
        return;
      }
      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      setAccountName(fullName || user.email || "");
      
      const code = profile.referral_code || "";
      setReferralCode(code);

      const baseUrl = window.location.origin;
      if (code) {
        setReferralLink(`${baseUrl}/register?ref=${code}`);
      } else {
        setReferralLink(`${baseUrl}/register?ref=${user.id}`);
      }
    }

    await checkWithdrawalRules(user.id);
    setLoading(false);
  }, [router, lang]);

  useEffect(() => {
    fetchAffiliateData();
  }, [fetchAffiliateData]);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isWithdrawOpen) {
      alert(lang === "th" ? "ไม่สามารถทำรายการถอนได้ในขณะนี้ (ตรวจสอบเงื่อนไขช่วงเวลาหรือการถอนครบ 1 ครั้งแล้ว)" : "Withdrawal is currently unavailable.");
      return;
    }

    if (!withdrawAmount || Number(withdrawAmount) <= 0) {
      alert(lang === "th" ? "กรุณากรอกจำนวนเงินที่ต้องการถอนให้ถูกต้อง" : "Please enter a valid withdrawal amount.");
      return;
    }

    if (Number(withdrawAmount) > totalEarnings) {
      alert(lang === "th" ? "ยอดเงินสะสมของคุณไม่เพียงพอสำหรับการถอน" : "Insufficient balance for withdrawal.");
      return;
    }

    if (!accountNumber) {
      alert(lang === "th" ? "กรุณากรอกเลขที่บัญชีธนาคาร" : "Please enter your bank account number.");
      return;
    }

    setWithdrawing(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setWithdrawing(false);
      return;
    }

    const { error } = await supabase.from("withdrawals").insert({
      user_id: user.id,
      amount: Number(withdrawAmount),
      bank_name: bankName,
      account_number: accountNumber,
      account_name: accountName,
      remark: remark,
      status: "pending",
      created_at: new Date().toISOString()
    });

    if (error) {
      console.error(error);
    }

    setTimeout(() => {
      alert(lang === "th" ? "🎉 ส่งคำขอถอนเงินเรียบร้อยแล้ว เงินจะเข้าบัญชีภายใน 1-3 วันทำการ" : "Withdrawal request submitted! Funds will arrive within 1-3 business days.");
      setWithdrawAmount("");
      setAccountNumber("");
      setRemark("");
      setWithdrawing(false);
      setIsWithdrawOpen(false);
      setHasWithdrawnThisMonth(true);
      setWithdrawalMessage(
        lang === "th"
          ? "🔒 คุณได้ทำรายการถอนเงินของเดือนนี้ไปแล้ว (จำกัดการถอน 1 ครั้งต่อเดือน)"
          : "🔒 You have already withdrawn for this month."
      );
    }, 1000);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">{t.loading}</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
        <div className="mx-auto max-w-5xl">
          
          {/* ส่วนหัว */}
          <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900 border border-slate-800 p-8 rounded-3xl shadow-xl">
            <div>
              <span className="inline-block rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-400 border border-purple-500/20 uppercase tracking-widest mb-2">
                VIP AFFILIATE PROGRAM
              </span>
              <h1 className="text-3xl font-extrabold text-white">
                {lang === "th" ? "ระบบสร้างรายได้แนะนำเพื่อน" : "Affiliate Program"}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                {lang === "th" ? "แชร์ลิงก์แนะนำของคุณเพื่อรับคอมมิชชันค่าบริการ VIP ทันที" : "Share your referral link to earn VIP commissions."}
              </p>
            </div>

            <div className="bg-purple-950/40 border border-purple-500/30 px-6 py-4 rounded-2xl text-center">
              <p className="text-xs text-purple-300 uppercase tracking-wider font-semibold">
                {lang === "th" ? "รายได้สะสมทั้งหมด" : "Total Earnings"}
              </p>
              <h2 className="text-3xl font-black text-white mt-1">฿{totalEarnings.toLocaleString()}</h2>
            </div>
          </div>

          {/* 🌟 กล่องแสดงเงื่อนไขและอัตราค่าคอมมิชชันใหม่ */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900 border border-purple-500/30 p-6 shadow-xl">
            <h3 className="text-sm font-extrabold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📊</span> {lang === "th" ? "อัตราผลตอบแทนค่าคอมมิชชัน Affiliate" : "Commission Structure"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold text-sm">✨ คอมมิชชันการสมัครครั้งแรก (8%)</span>
                <p className="text-slate-400">
                  {lang === "th" 
                    ? "รับทันที 8% จากยอดชำระค่าบริการแพ็กเกจ VIP ในครั้งแรกที่เพื่อนสมัครสมาชิกผ่านลิงก์ของคุณ" 
                    : "Receive 8% from the first VIP package payment made by your referral."}
                </p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-indigo-400 font-bold text-sm">🔄 คอมมิชชันการต่ออายุ (4% ตลอดชีพ)</span>
                <p className="text-slate-400">
                  {lang === "th" 
                    ? "รับต่อเนื่อง 4% ตลอดไปทุกครั้งที่สมาชิกทำการต่ออายุแพ็กเกจ (ระบบจะตัดสิทธิ์ VIP อัตโนมัติหากสมาชิกไม่ต่ออายุ)" 
                    : "Earn 4% continuously on every renewal (VIP status is automatically revoked if not renewed)."}
                </p>
              </div>
            </div>
          </div>

          {/* รหัสแนะนำ และ ลิงก์แนะนำเพื่อน */}
          <div className="mb-8 rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <span>🔑</span> {lang === "th" ? `รหัสแนะนำประจำตัว: ${referralCode || "กำลังสร้างรหัส..."}` : `Referral Code: ${referralCode || "Generating..."}`}
              </h3>
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                {lang === "th" ? "ลิงก์แนะนำเพื่อนของคุณ (Referral Link)" : "Your Referral Link"}
              </label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  readOnly
                  value={referralLink}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-300 font-mono select-all focus:outline-none"
                />
                <button
                  onClick={handleCopy}
                  className="rounded-xl bg-purple-600 px-6 py-3 font-bold text-white hover:bg-purple-500 transition cursor-pointer text-sm whitespace-nowrap shadow-lg"
                >
                  {copied ? (lang === "th" ? "✅ คัดลอกแล้ว" : "✅ Copied") : (lang === "th" ? "📋 คัดลอกลิงก์" : "📋 Copy Link")}
                </button>
              </div>
            </div>
          </div>

          {/* สถิติต่างๆ */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <p className="text-sm text-slate-400">{lang === "th" ? "จำนวนคลิกเข้าชม" : "Total Clicks"}</p>
              <h2 className="text-3xl font-black text-white mt-2">0</h2>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <p className="text-sm text-slate-400">{lang === "th" ? "สมาชิกที่สมัครผ่านลิงก์" : "Registered Referrals"}</p>
              <h2 className="text-3xl font-black text-sky-400 mt-2">0</h2>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <p className="text-sm text-slate-400">{lang === "th" ? "สมาชิก VIP ที่แนะนำสำเร็จ" : "VIP Referrals"}</p>
              <h2 className="text-3xl font-black text-emerald-400 mt-2">0</h2>
            </div>
          </div>

          {/* 🌟 ฟอร์มแจ้งถอนเงิน (จำกัด 1 ครั้ง/เดือน และเฉพาะช่วงสิ้นเดือน) */}
          <div className="mb-10 rounded-3xl bg-slate-900 border border-slate-800 p-8 shadow-2xl">
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <span>💳</span> {lang === "th" ? "ระบบถอนเงินคอมมิชชัน" : "Withdrawal Request"}
                </h3>
                <p className="text-sm text-slate-400 mt-1">
                  {lang === "th" ? "กรอกข้อมูลบัญชีธนาคารเพื่อรับเงินโอน (ชื่อบัญชีตรงกับชื่อสมาชิกอัตโนมัติ)" : "Enter your bank details to request a payout."}
                </p>
              </div>

              {/* ป้ายแสดงสถานะเงื่อนไขการถอน */}
              <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${isWithdrawOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                {withdrawalMessage}
              </div>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* เลือกธนาคาร */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {lang === "th" ? "ธนาคาร" : "Bank Name"}
                  </label>
                  <select
                    disabled={!isWithdrawOpen}
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-purple-500 focus:outline-none disabled:opacity-50 cursor-pointer"
                  >
                    <option value="กสิกรไทย (KBANK)">ธนาคารกสิกรไทย (KBANK)</option>
                    <option value="ไทยพาณิชย์ (SCB)">ธนาคารไทยพาณิชย์ (SCB)</option>
                    <option value="กรุงเทพ (BBL)">ธนาคารกรุงเทพ (BBL)</option>
                    <option value="กรุงไทย (KTB)">ธนาคารกรุงไทย (KTB)</option>
                    <option value="ทหารไทยธนชาต (TTB)">ธนาคารทหารไทยธนชาต (TTB)</option>
                    <option value="ออมสิน (GSB)">ธนาคารออมสิน (GSB)</option>
                  </select>
                </div>

                {/* เลขที่บัญชี */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {lang === "th" ? "เลขที่บัญชีธนาคาร" : "Account Number"}
                  </label>
                  <input
                    type="text"
                    disabled={!isWithdrawOpen}
                    placeholder="เช่น 1234567890"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-purple-500 focus:outline-none font-mono disabled:opacity-50"
                    required={isWithdrawOpen}
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* ชื่อบัญชี (ล็อกตามชื่อสมาชิก) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {lang === "th" ? "ชื่อบัญชีธนาคาร (ตรงกับชื่อสมาชิก)" : "Account Name (Locked to Member Name)"}
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={accountName}
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 text-sm text-purple-300 font-semibold cursor-not-allowed select-none"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {lang === "th" ? "* ชื่อบัญชีตรงกับชื่อ-นามสกุลจริงของผู้สมัครสมาชิกเพื่อความปลอดภัย" : "* Must match member's real name."}
                  </p>
                </div>

                {/* จำนวนเงินที่จะถอน */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {lang === "th" ? "จำนวนเงินที่ต้องการถอน (บาท)" : "Withdrawal Amount (THB)"}
                  </label>
                  <input
                    type="number"
                    disabled={!isWithdrawOpen}
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-purple-500 focus:outline-none font-bold text-emerald-400 disabled:opacity-50"
                    required={isWithdrawOpen}
                  />
                </div>

              </div>

              {/* หมายเหตุการถอนเงิน */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  {lang === "th" ? "หมายเหตุการถอนเงิน (ถ้ามี)" : "Withdrawal Remark"}
                </label>
                <textarea
                  rows={2}
                  disabled={!isWithdrawOpen}
                  placeholder={lang === "th" ? "ระบุหมายเหตุเพิ่มเติม เช่น โอนรอบสิ้นเดือน ฯลฯ" : "Optional notes..."}
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-purple-500 focus:outline-none resize-none disabled:opacity-50"
                />
              </div>

              {/* ปุ่มกดส่งคำขอถอนเงิน */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  {lang === "th" ? "ℹ️ จำกัดการถอน 1 ครั้ง/เดือน | เงินจะเข้าบัญชีภายใน 1-3 วันทำการหลังอนุมัติ" : "ℹ️ Limit: 1 withdrawal per month | Funds transferred in 1-3 business days."}
                </p>

                <button
                  type="submit"
                  disabled={!isWithdrawOpen || withdrawing}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-8 py-3.5 font-extrabold text-white shadow-xl hover:from-emerald-500 hover:to-teal-500 transition cursor-pointer text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {withdrawing 
                    ? (lang === "th" ? "กำลังส่งคำขอ..." : "Processing...") 
                    : (lang === "th" ? "💸 ยืนยันการถอนเงิน" : "Submit Withdrawal")}
                </button>
              </div>

            </form>
          </div>

        </div>
      </main>
    </>
  );
}