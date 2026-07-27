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

  // สถิติต่างๆ
  const [totalClicks, setTotalClicks] = useState(0);
  const [registeredReferrals, setRegisteredReferrals] = useState(0);
  const [vipReferrals, setVipReferrals] = useState(0);

  // รายชื่อสมาชิกที่แนะนำมา
  const [referredList, setReferredList] = useState<any[]>([]);

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

  const checkWithdrawalRules = async (userId: string, currentEarnings: number) => {
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
    } else if (currentEarnings < 300) {
      setIsWithdrawOpen(false);
      setWithdrawalMessage(
        lang === "th"
          ? "🔒 ยอดเงินสะสมไม่ถึง 300 บาท (ขั้นต่ำการถอน 300 บาท)"
          : "🔒 Minimum withdrawal amount is 300 THB."
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
          ? "🟢 เปิดระบบถอนเงินรอบสิ้นเดือนแล้ว! (ขั้นต่ำ 300 บาท | จำกัด 1 ครั้ง/เดือน)"
          : "🟢 Withdrawal open! (Min 300 THB | 1 time/month)"
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

    let calculatedEarnings = 0;

    if (profile) {
      if (!profile.is_vip) {
        router.replace("/vip/pay");
        return;
      }
      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim();
      setAccountName(fullName || user.email || "");
      
      const code = profile.referral_code || "";
      setReferralCode(code);

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      if (code) {
        setReferralLink(`${baseUrl}/register?ref=${code}`);
      } else {
        setReferralLink(`${baseUrl}/register?ref=${user.id}`);
      }

      // ดึงสถิติสมาชิกที่สมัครผ่านลิงก์
      try {
        const { data: referredUsers } = await supabase
          .from("profiles")
          .select("id, email, first_name, last_name, is_vip, vip_expires_at, created_at, referred_by")
          .or(`referred_by.eq.${code},referred_by.eq.${user.id}`)
          .order("created_at", { ascending: false });

        if (referredUsers) {
          setReferredList(referredUsers);
          setRegisteredReferrals(referredUsers.length);

          const vipCount = referredUsers.filter((u) => u.is_vip).length;
          setVipReferrals(vipCount);
        }
      } catch (err) {
        console.error("Error fetching referrals:", err);
      }

      // ดึงจำนวนคลิกเข้าชม
      try {
        const { count: clicksCount } = await supabase
          .from("affiliate_clicks")
          .select("*", { count: "exact", head: true })
          .or(`referral_code.eq.${code},referrer_id.eq.${user.id}`);

        if (clicksCount !== null) {
          setTotalClicks(clicksCount);
        }
      } catch (err) {
        console.error("Error fetching click count:", err);
      }

      // ดึงยอดรายได้สะสม
      try {
        const { data: commData } = await supabase
          .from("commissions")
          .select("amount")
          .eq("user_id", user.id);

        if (commData && commData.length > 0) {
          calculatedEarnings = commData.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
          setTotalEarnings(calculatedEarnings);
        }
      } catch (err) {
        console.error("Error fetching total earnings:", err);
      }
    }

    await checkWithdrawalRules(user.id, calculatedEarnings);
    setLoading(false);
  }, [router]);

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
      alert(lang === "th" ? "ไม่สามารถทำรายการถอนได้ในขณะนี้ (ตรวจสอบเงื่อนไขยอดขั้นต่ำ 300 บาท, ช่วงเวลา หรือการถอนครบ 1 ครั้งแล้ว)" : "Withdrawal is currently unavailable.");
      return;
    }

    const amountNum = Number(withdrawAmount);

    if (!withdrawAmount || amountNum < 300) {
      alert(lang === "th" ? "⚠️ กำหนดขั้นต่ำการถอนเงิน 300 บาทขึ้นไปครับ" : "Minimum withdrawal amount is 300 THB.");
      return;
    }

    if (amountNum > totalEarnings) {
      alert(lang === "th" ? "ยอดเงินสะสมของคุณไม่เพียงพอสำหรับการถอน" : "Insufficient balance for withdrawal.");
      return;
    }

    if (!accountNumber) {
      alert(lang === "th" ? "กรุณากรอกเลขที่บัญชีธนาคาร" : "Please enter your bank account number.");
      return;
    }

    // 🌟 กล่องยืนยันพร้อมคำเตือนขนาดใหญ่ตามต้องการ
    const confirmMessage = lang === "th"
      ? `🚨 คำเตือนสำคัญ:\nบัญชีผู้รับเงิน และชื่อสมาชิกจะต้องตรงกันเท่านั้น จึงจะอนุมัติถอนเงินได้!\nหากไม่ตรงจะถูกปฏิเสธ และระบบจะไม่คืนคอมมิชชันที่กดถอนในรอบนั้นๆ\n\nยืนยันการถอนเงินจำนวน ${amountNum.toLocaleString()} บาท ใช่หรือไม่?`
      : `🚨 IMPORTANT WARNING:\nThe bank account name must match the member's name exactly. Otherwise, the withdrawal will be rejected and commissions for this round will NOT be refunded.\n\nConfirm withdrawal of ${amountNum.toLocaleString()} THB?`;

    if (!window.confirm(confirmMessage)) {
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
      amount: amountNum,
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

          {/* กล่องแสดงเงื่อนไขและอัตราค่าคอมมิชชัน */}
          <div className="mb-8 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-slate-900 border border-purple-500/30 p-6 shadow-xl">
            <h3 className="text-sm font-extrabold text-purple-300 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span>📊</span> {lang === "th" ? "อัตราผลตอบแทนค่าคอมมิชชัน Affiliate & เงื่อนไขการถอน" : "Commission Structure & Rules"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-1">
                <span className="text-emerald-400 font-bold text-sm">✨ คอมมิชชันการสมัครและการต่ออายุ</span>
                <p className="text-slate-400">
                  {lang === "th" 
                    ? "รับ 8% จากยอดสมัครครั้งแรก และ 4% จากทุกยอดการต่ออายุแพ็กเกจ VIP ของเพื่อน" 
                    : "Earn 8% on first sign-up and 4% on VIP renewals."}
                </p>
              </div>
              <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/30 space-y-1">
                <span className="text-amber-400 font-bold text-sm">⚠️ เงื่อนไขการถอนเงิน</span>
                <p className="text-slate-400">
                  {lang === "th" 
                    ? "ถอนขั้นต่ำ 300 บาทขึ้นไป เปิดให้ถอนเฉพาะช่วงสิ้นเดือน (วันที่ 25 - สิ้นเดือน) จำกัด 1 ครั้ง/เดือน" 
                    : "Min withdrawal 300 THB. Available from 25th to end of month (1 time/month)."}
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
              <h2 className="text-3xl font-black text-white mt-2">{totalClicks.toLocaleString()}</h2>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <p className="text-sm text-slate-400">{lang === "th" ? "สมาชิกที่สมัครผ่านลิงก์" : "Registered Referrals"}</p>
              <h2 className="text-3xl font-black text-sky-400 mt-2">{registeredReferrals.toLocaleString()}</h2>
            </div>
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-lg">
              <p className="text-sm text-slate-400">{lang === "th" ? "สมาชิก VIP ที่แนะนำสำเร็จ" : "VIP Referrals"}</p>
              <h2 className="text-3xl font-black text-emerald-400 mt-2">{vipReferrals.toLocaleString()}</h2>
            </div>
          </div>

          {/* ฟอร์มแจ้งถอนเงิน พร้อมคำเตือนขนาดใหญ่ */}
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

              <div className={`px-4 py-2 rounded-xl text-xs font-bold border ${isWithdrawOpen ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'}`}>
                {withdrawalMessage}
              </div>
            </div>

            {/* 🌟 กล่องคำเตือนขนาดใหญ่ */}
            <div className="mb-6 rounded-2xl bg-rose-950/40 border border-rose-500/50 p-5 text-rose-200 text-xs md:text-sm space-y-2 shadow-lg">
              <div className="font-extrabold text-base flex items-center gap-2 text-rose-400">
                <span>🚨</span> {lang === "th" ? "คำเตือนสำคัญก่อนทำการถอนเงิน" : "Important Withdrawal Warning"}
              </div>
              <p className="leading-relaxed">
                {lang === "th" 
                  ? "• บัญชีผู้รับเงิน และชื่อสมาชิกจะต้องตรงกันเท่านั้น จึงจะอนุมัติถอนเงินได้\n• หากชื่อบัญชีไม่ตรงกับชื่อสมาชิก จะถูกปฏิเสธการโอนเงิน และระบบจะไม่คืนยอดคอมมิชชันที่กดถอนในรอบนั้นๆ" 
                  : "• The bank account name must match the member's name exactly to be approved.\n• If names do not match, the request will be rejected and commissions for this round will not be refunded."}
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
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
                    {lang === "th" ? "* ชื่อบัญชีต้องตรงกับชื่อ-นามสกุลจริงของผู้สมัครสมาชิก" : "* Must match member's real name."}
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-2">
                    {lang === "th" ? "จำนวนเงินที่ต้องการถอน (ขั้นต่ำ 300 บาท)" : "Withdrawal Amount (Min 300 THB)"}
                  </label>
                  <input
                    type="number"
                    min="300"
                    disabled={!isWithdrawOpen}
                    placeholder="300 ขึ้นไป"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 focus:border-purple-500 focus:outline-none font-bold text-emerald-400 disabled:opacity-50"
                    required={isWithdrawOpen}
                  />
                </div>

              </div>

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

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-xs text-slate-400">
                  {lang === "th" ? "ℹ️ ถอนขั้นต่ำ 300 บาท | จำกัด 1 ครั้ง/เดือน | เงินเข้าบัญชีภายใน 1-3 วันทำการ" : "ℹ️ Min 300 THB | Limit: 1 withdrawal per month"}
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

          {/* ตารางรายชื่อคนที่แนะนำมา (ด้านล่างสุด) */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 md:p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <span>👥</span> {lang === "th" ? "รายชื่อสมาชิกที่แนะนำทั้งหมด" : "Referred Members List"}
                <span className="ml-2 rounded-full bg-purple-500/10 px-3 py-0.5 text-xs font-bold text-purple-400 border border-purple-500/20">
                  {referredList.length} คน
                </span>
              </h3>
            </div>

            {referredList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-sm bg-slate-950/40">
                {lang === "th" ? "ยังไม่มีสมาชิกสมัครผ่านลิงก์แนะนำของคุณ" : "No referrals yet."}
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/50">
                <table className="min-w-[700px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-4">{lang === "th" ? "อีเมล / ชื่อสมาชิก" : "Member"}</th>
                      <th className="px-4 py-4">{lang === "th" ? "วันที่สมัคร" : "Registration Date"}</th>
                      <th className="px-4 py-4 text-center">{lang === "th" ? "สถานะ" : "Status"}</th>
                      <th className="px-4 py-4 text-right">{lang === "th" ? "วันหมดอายุ VIP" : "VIP Expiry Date"}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
                    {referredList.map((item) => {
                      const isVip = Boolean(item.is_vip);
                      const name = `${item.first_name || ""} ${item.last_name || ""}`.trim();
                      const displayEmail = item.email || "ไม่ระบุอีเมล";
                      const regDate = item.created_at ? new Date(item.created_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "-";
                      const expiryDate = item.vip_expires_at ? new Date(item.vip_expires_at).toLocaleDateString(lang === "th" ? "th-TH" : "en-US", { year: 'numeric', month: 'short', day: 'numeric' }) : "-";

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 font-semibold text-white">
                            <div>{displayEmail}</div>
                            {name && <div className="text-[11px] text-slate-400 font-normal">{name}</div>}
                          </td>
                          <td className="px-4 py-4 text-slate-400 font-medium">{regDate}</td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block rounded-full px-3 py-1 text-xs font-extrabold ${isVip ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-slate-800 text-slate-400 border border-slate-700'}`}>
                              {isVip ? "VIP" : "สมาชิกทั่วไป"}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-mono font-bold text-slate-300">
                            {isVip ? expiryDate : <span className="text-slate-500 font-normal">ฟรี</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}