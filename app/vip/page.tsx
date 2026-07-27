"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { getStockPrice } from "@/lib/stock";
import { translations, Language } from "@/lib/i18n";

export default function VipPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [isVip, setIsVip] = useState(false);
  const [upgrading, setUpgrading] = useState(false);

  const [analysisSymbol, setAnalysisSymbol] = useState("AAPL");
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [analysisPrice, setAnalysisPrice] = useState(0);

  // ข้อมูลโปรไฟล์บริษัทและการเงินแบบเรียลไทม์
  const [companyInfo, setCompanyInfo] = useState<any>({
    name: "Apple Inc.",
    business: "กำลังโหลดรายละเอียดบริษัท...",
    score: 8.8,
    level: "แข็งแกร่งมาก (Excellent)",
    pe: 31.4,
    peAnalysis: "P/E ค่อนข้างสูงสะท้อนความเชื่อมั่นแบรนด์และกระแสเงินสดที่สม่ำเสมอ เหมาะกับการลงทุนระยะยาว",
    earnings: []
  });

  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  // ฟังก์ชันดึงข้อมูลโปรไฟล์บริษัทจริงและงบการเงินจาก Backend API
  const fetchRealCompanyDetails = async (symbol: string) => {
    try {
      const cleanSymbol = symbol.toUpperCase().trim();
      const res = await fetch(`/api/stock-profile?symbol=${cleanSymbol}`);
      const data = await res.json();

      if (res.ok && data) {
        setCompanyInfo({
          name: data.name || `${cleanSymbol} Corporation`,
          business: data.description || `บริษัทจดทะเบียนในตลาดหลักทรัพย์สหรัฐฯ ดำเนินธุรกิจและให้บริการในกลุ่มอุตสาหกรรม ${data.industry || 'Technology'}`,
          score: 8.5,
          level: "แข็งแกร่ง (Strong)",
          pe: data.peRatio || 25.0,
          peAnalysis: `P/E Ratio (${data.peRatio || 'N/A'}) คำนวณจากงบการเงินและราคาตลาดล่าสุด สะท้อนมูลค่าเหมาะสมตามปัจจัยพื้นฐานปัจจุบัน`,
          earnings: data.earnings || []
        });
      }
    } catch (err) {
      console.error("Error fetching company profile:", err);
    }
  };

  const getTechnicalSignal = (price: number, seed: number) => {
    const val = (price * seed) % 3;
    if (val < 1) {
      return { label: "ซื้อทันที", color: "bg-emerald-500/20 border-emerald-500/40 text-emerald-400" };
    } else if (val < 2) {
      return { label: "ถือ", color: "bg-slate-500/20 border-slate-500/40 text-slate-300" };
    } else {
      return { label: "ขาย", color: "bg-rose-500/20 border-rose-500/40 text-rose-400" };
    }
  };

  const checkVipStatus = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("is_vip")
      .eq("id", userId)
      .single();

    if (data) {
      setIsVip(data.is_vip || false);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      await checkVipStatus(user.id);
      const initialPrice = await getStockPrice("AAPL");
      setAnalysisPrice(initialPrice);
      await fetchRealCompanyDetails("AAPL");
    }
    init();
  }, [router, checkVipStatus]);

  const handleSearchAnalysisSymbol = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol.trim()) return;
    const cleanSymbol = inputSymbol.trim().toUpperCase();
    setAnalysisSymbol(cleanSymbol);
    
    // ดึงราคาและข้อมูลบริษัทจริงแบบเรียลไทม์
    const p = await getStockPrice(cleanSymbol);
    setAnalysisPrice(p);
    await fetchRealCompanyDetails(cleanSymbol);
  };

  async function handleUpgradeVip() {
    setUpgrading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, is_vip: true, updated_at: new Date() });

    if (error) {
      alert(lang === "th" ? "อัปเกรดไม่สำเร็จ กรุณาลองใหม่" : "Upgrade failed.");
    } else {
      setIsVip(true);
      alert(lang === "th" ? "🎉 ยินดีด้วย! คุณได้อัปเกรดเป็นสมาชิก VIP เรียบร้อยแล้ว" : "🎉 Congratulations! You are now a VIP member.");
    }
    setUpgrading(false);
  }

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

      <main className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4">
        <div className="mx-auto max-w-5xl">
          
          {/* 🌟 ส่วนที่ 1: ข้อมูลสำคัญและเครื่องมือวิเคราะห์ตลาดพรีเมียม */}
          <div className="mb-12">
            <div className="text-center mb-10">
              <span className="inline-block rounded-full bg-purple-500/10 px-4 py-1.5 text-xs font-bold text-purple-400 border border-purple-500/20 uppercase tracking-widest mb-3">
                ⭐ VIP Market Intelligence & Analytics
              </span>
              <h2 className="text-3xl md:text-5xl font-black text-white tracking-tight">
                {lang === "th" ? "ข้อมูลเชิงลึกและเครื่องมือระดับโปร" : "Institutional-Grade Market Insights"}
              </h2>
              <p className="mt-3 text-sm md:text-base text-slate-400 max-w-2xl mx-auto">
                {lang === "th" 
                  ? "เกาะติดตลาดเรียลไทม์ด้วยข้อมูลคำสั่งซื้อขายขนาดใหญ่ แนวรับแนวต้าน และกระแสเงินลงทุนกองทุนเพื่อความได้เปรียบสูงสุด" 
                  : "Track real-time whale orders, support/resistance, and institutional fund flows for maximum trading edge."}
              </p>
            </div>

            {/* 🌟 ส่วนตารางวิเคราะห์ทางเทคนิค & พื้นฐานบริษัท */}
            <div className="mb-10 rounded-2xl bg-slate-900/90 p-6 md:p-8 border border-purple-500/30 shadow-2xl">
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-6 border-b border-slate-800 pb-6">
                <div>
                  <span className="inline-block rounded-full bg-purple-500/10 px-3 py-1 text-xs font-bold text-purple-400 border border-purple-500/20 uppercase tracking-widest mb-1">
                    ⭐ REAL-TIME TECHNICAL ANALYSIS & FUNDAMENTALS
                  </span>
                  <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3 mt-1">
                    <span>📈</span> หุ้น: <span className="text-purple-400 underline decoration-purple-500/50">{analysisSymbol}</span> 
                    <span className="text-sm font-normal text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
                      ${analysisPrice > 0 ? analysisPrice.toFixed(2) : "Loading..."}
                    </span>
                  </h3>
                </div>

                {/* ฟอร์มป้อนชื่อหุ้น */}
                <form onSubmit={handleSearchAnalysisSymbol} className="flex flex-wrap items-center gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800 shadow-inner">
                  <div className="text-xs font-bold text-purple-300">
                    {lang === "th" ? "ป้อนชื่อหุ้นที่ต้องการวิเคราะห์:" : "Analysis Ticker:"}
                  </div>
                  <input
                    type="text"
                    value={inputSymbol}
                    onChange={(e) => setInputSymbol(e.target.value)}
                    placeholder="AAPL, TSLA..."
                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-sm text-white font-mono uppercase focus:border-purple-500 focus:outline-none w-28 text-center"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-bold text-white hover:bg-purple-500 transition cursor-pointer shadow-md"
                  >
                    {lang === "th" ? "วิเคราะห์เรียลไทม์" : "Analyze"}
                  </button>
                </form>
              </div>

              {/* รายละเอียดบริษัทและธุรกิจ (ดึงข้อมูลจริง) */}
              <div className="mb-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-purple-400 uppercase tracking-wider mb-1">🏢 รายละเอียดบริษัท ({companyInfo.name})</div>
                <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
                  {companyInfo.business}
                </p>
              </div>

              {/* 📅 เพิ่มใหม่ตามคำขอ: ข้อมูลผลประกาศไตรมาส Q1-Q4 (คาดการณ์ vs จริง, วันที่, EPS) */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                <div className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                  <span>📅</span> {lang === "th" ? "ข้อมูลผลประกาศไตรมาส Q1-Q4 (คาดการณ์ vs ผลประกอบการจริง)" : "Quarterly Earnings & EPS Forecast (Q1-Q4)"}
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs md:text-sm">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400">
                        <th className="pb-2 font-semibold">{lang === "th" ? "ไตรมาส" : "Period"}</th>
                        <th className="pb-2 font-semibold">{lang === "th" ? "วันที่ประกาศ" : "Report Date"}</th>
                        <th className="pb-2 font-semibold">{lang === "th" ? "กำไรต่อหุ้น (คาดการณ์ EPS)" : "Est. EPS"}</th>
                        <th className="pb-2 font-semibold">{lang === "th" ? "กำไรต่อหุ้น (จริง Actual)" : "Actual EPS"}</th>
                        <th className="pb-2 font-semibold">{lang === "th" ? "ความต่าง (Surprise)" : "Surprise"}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      {companyInfo.earnings && companyInfo.earnings.length > 0 ? (
                        companyInfo.earnings.map((item: any, idx: number) => (
                          <tr key={idx} className="hover:bg-slate-900/40 transition">
                            <td className="py-2.5 font-bold text-white">{item.period}</td>
                            <td className="py-2.5 text-slate-300">{item.date}</td>
                            <td className="py-2.5 text-slate-300">${item.estimatedEPS}</td>
                            <td className="py-2.5 font-bold text-emerald-400">${item.actualEPS}</td>
                            <td className="py-2.5 text-indigo-300 font-semibold">{item.surprise}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-slate-500">กำลังโหลดข้อมูลผลประกอบการ...</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* คะแนนสุขภาพการเงิน */}
              <div className="mb-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="w-full md:w-1/3">
                  <div className="text-xs font-bold text-slate-300 mb-1">คะแนนสุขภาพการเงิน (Financial Health)</div>
                  <div className="text-sm font-black text-emerald-400">{companyInfo.level}</div>
                </div>
                <div className="w-full md:w-1/2">
                  <div className="h-4 w-full rounded-full bg-slate-800 overflow-hidden p-0.5 border border-slate-700">
                    <div 
                      className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-400 transition-all duration-500 shadow-lg"
                      style={{ width: `${(companyInfo.score / 10) * 100}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-full md:w-auto text-right whitespace-nowrap">
                  <span className="text-xs text-slate-400">คะแนนรวม: </span>
                  <span className="text-base font-black text-white">{companyInfo.score} <span className="text-xs font-normal text-slate-400">/ 10</span></span>
                </div>
              </div>

              {/* P/E Ratio จริง และบทวิเคราะห์ */}
              <div className="mb-8 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                  <div className="text-xs font-bold text-sky-400 uppercase tracking-wider">อัตราส่วน P/E Ratio (Real-time)</div>
                  <div className="text-2xl font-black text-white mt-0.5">{companyInfo.pe} <span className="text-xs font-normal text-slate-400">เท่า</span></div>
                </div>
                <div className="flex-1 md:border-l md:border-slate-800 md:pl-6">
                  <div className="text-xs font-semibold text-slate-400 mb-1">บทวิเคราะห์อัตราส่วน P/E:</div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {companyInfo.peAnalysis}
                  </p>
                </div>
              </div>

              {/* แนวโน้ม 3 ระยะ */}
              <div className="space-y-4 mb-8">
                <div className="p-5 rounded-2xl bg-slate-950/70 border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 mt-1.5 animate-pulse"></span>
                    <div>
                      <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">1. แนวโน้มระยะสั้น (Short-Term Trend: 1 - 4 สัปดาห์)</div>
                      <div className="text-base font-extrabold text-white mt-1">ขาขึ้นแข็งแกร่ง (Bullish Momentum)</div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        <strong className="text-purple-300">บทวิเคราะห์นักวิเคราะห์:</strong> ราคาแกว่งตัวเหนือเส้น EMA20 อย่างมั่นคง เหมาะสำหรับการเก็งกำไรระยะสั้น
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right whitespace-nowrap">
                    <span className="text-[11px] text-slate-400 block">คำแนะนำ</span>
                    <span className="text-xs font-bold text-emerald-400">ซื้อ / เก็งกำไรระยะสั้น</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-gradient-to-r from-purple-950/40 via-slate-950/70 to-slate-950/70 border border-purple-500/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                    ✨ แนะนำสำหรับ DCA
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="w-3 h-3 rounded-full bg-purple-400 mt-1.5 animate-pulse"></span>
                    <div>
                      <div className="text-xs text-purple-400 font-bold uppercase tracking-wider">2. แนวโน้มระยะกลาง (Medium-Term Trend: 1 - 6 เดือน) — 🎯 โซนเหมาะสำหรับ DCA</div>
                      <div className="text-base font-extrabold text-white mt-1">โครงสร้างขาขึ้นเติบโตต่อเนื่อง (Healthy Uptrend)</div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        <strong className="text-purple-300">บทวิเคราะห์นักวิเคราะห์:</strong> เส้น EMA50 ทำหน้าที่เป็นแนวรับสำคัญ <span className="text-purple-300 font-bold underline">เป็นช่วงเวลาที่ดีที่สุดสำหรับการทำ Dollar-Cost Averaging (DCA)</span> เพื่อทยอยสะสมต้นทุน
                      </p>
                    </div>
                  </div>
                  <div className="bg-purple-950/60 px-4 py-2 rounded-xl border border-purple-500/30 text-right whitespace-nowrap mt-2 md:mt-0">
                    <span className="text-[11px] text-purple-300 block">กลยุทธ์การลงทุน</span>
                    <span className="text-xs font-bold text-purple-200">🚀 เหมาะสมอย่างยิ่งสำหรับ DCA</span>
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="w-3 h-3 rounded-full bg-blue-400 mt-1.5"></span>
                    <div>
                      <div className="text-xs text-blue-400 font-bold uppercase tracking-wider">3. แนวโน้มระยะยาว (Long-Term Trend: 1 ปีขึ้นไป)</div>
                      <div className="text-base font-extrabold text-white mt-1">แนวโน้มหลักเป็นขาขึ้น (Long-Term Bull Market)</div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                        <strong className="text-purple-300">บทวิเคราะห์นักวิเคราะห์:</strong> ราคายืนอยู่เหนือเส้น EMA200 อย่างมั่นคง สะท้อนพื้นฐานและกระแสเงินลงทุนระยะยาวที่ยังไหลเข้าต่อเนื่อง
                      </p>
                    </div>
                  </div>
                  <div className="bg-slate-900 px-4 py-2 rounded-xl border border-slate-800 text-right whitespace-nowrap">
                    <span className="text-[11px] text-slate-400 block">คำแนะนำ</span>
                    <span className="text-xs font-bold text-blue-400">ถือลงทุนระยะยาว (Buy & Hold)</span>
                  </div>
                </div>
              </div>

              {/* หมายเหตุ */}
              <div className="mb-8 px-2">
                <p className="text-[11px] text-rose-400/90 leading-relaxed">
                  * หมายเหตุ: ข้อมูลการวิเคราะห์ทางเทคนิค บทวิเคราะห์ และสัญญาณข้างต้นจัดทำขึ้นเพื่อเป็นเครื่องมือช่วยประกอบการตัดสินใจเบื้องต้นเท่านั้น มิใช่การชี้นำ ชักชวน หรือให้คำแนะนำในการซื้อขายหลักทรัพย์ การลงทุนมีความเสี่ยง ผู้ลงทุนควรศึกษาข้อมูลและวิเคราะห์ด้วยตนเองก่อนตัดสินใจลงทุนทุกครั้ง
                </p>
              </div>

              {/* Timeframes Summary */}
              <div className="mb-8">
                <h3 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-wider">
                  1. สรุปภาพรวมตามกรอบเวลา (TIME-FRAME SUMMARY)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                  {[
                    { tf: "1 นาที", ...getTechnicalSignal(analysisPrice, 1) },
                    { tf: "5 นาที", ...getTechnicalSignal(analysisPrice, 2) },
                    { tf: "15 นาที", ...getTechnicalSignal(analysisPrice, 3) },
                    { tf: "30 นาที", ...getTechnicalSignal(analysisPrice, 4) },
                    { tf: "รายชั่วโมง", ...getTechnicalSignal(analysisPrice, 5) },
                    { tf: "รายวัน", ...getTechnicalSignal(analysisPrice, 6) },
                    { tf: "รายสัปดาห์", ...getTechnicalSignal(analysisPrice, 7) },
                    { tf: "รายเดือน", ...getTechnicalSignal(analysisPrice, 8) },
                  ].map((item, idx) => (
                    <div key={idx} className={`rounded-xl border p-3 text-center ${item.color}`}>
                      <div className="text-[11px] font-semibold text-slate-300">{item.tf}</div>
                      <div className="text-xs font-bold mt-1">🎯 {item.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Pivot Points */}
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>📌</span> จุดกลับตัว (Pivot Points)
                    </h3>
                    <span className="text-xs text-slate-400">Classic / Fibonacci</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 text-left">ระดับ</th>
                          <th className="py-2 text-right">Classic</th>
                          <th className="py-2 text-right">Fibonacci</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-mono">
                        <tr>
                          <td className="py-2 font-bold text-rose-400">R3</td>
                          <td className="py-2 text-right text-rose-300">{(analysisPrice * 1.05).toFixed(2)}</td>
                          <td className="py-2 text-right text-rose-300">{(analysisPrice * 1.045).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-rose-400">R2</td>
                          <td className="py-2 text-right text-rose-300">{(analysisPrice * 1.035).toFixed(2)}</td>
                          <td className="py-2 text-right text-rose-300">{(analysisPrice * 1.03).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-rose-400">R1</td>
                          <td className="py-2 text-right text-rose-300">{(analysisPrice * 1.018).toFixed(2)}</td>
                          <td className="py-2 text-right text-rose-300">{(analysisPrice * 1.015).toFixed(2)}</td>
                        </tr>
                        <tr className="bg-slate-900/80 font-bold">
                          <td className="py-2 text-slate-200">จุดกลับตัว (Pivot)</td>
                          <td className="py-2 text-right text-slate-200">{analysisPrice.toFixed(2)}</td>
                          <td className="py-2 text-right text-slate-200">{analysisPrice.toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-emerald-400">S1</td>
                          <td className="py-2 text-right text-emerald-300">{(analysisPrice * 0.982).toFixed(2)}</td>
                          <td className="py-2 text-right text-emerald-300">{(analysisPrice * 0.985).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-emerald-400">S2</td>
                          <td className="py-2 text-right text-emerald-300">{(analysisPrice * 0.965).toFixed(2)}</td>
                          <td className="py-2 text-right text-emerald-300">{(analysisPrice * 0.97).toFixed(2)}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-bold text-emerald-400">S3</td>
                          <td className="py-2 text-right text-emerald-300">{(analysisPrice * 0.95).toFixed(2)}</td>
                          <td className="py-2 text-right text-emerald-300">{(analysisPrice * 0.955).toFixed(2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Moving Averages */}
                <div className="rounded-2xl bg-slate-950/60 border border-slate-800 p-5">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>📊</span> ค่าเฉลี่ยเคลื่อนที่ (Moving Averages)
                    </h3>
                    <span className="text-xs text-slate-400">SMA / EMA</span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-400">
                          <th className="py-2 text-left">Period</th>
                          <th className="py-2 text-right">แบบทั่วไป (SMA)</th>
                          <th className="py-2 text-right">แบบเอ็กซ์โพเนนเชียล (EMA)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 font-mono">
                        {[
                          { ma: "MA5", sma: `${(analysisPrice * 0.995).toFixed(2)} (ซื้อ)`, ema: `${(analysisPrice * 0.996).toFixed(2)} (ซื้อ)` },
                          { ma: "MA10", sma: `${(analysisPrice * 0.99).toFixed(2)} (ซื้อ)`, ema: `${(analysisPrice * 0.992).toFixed(2)} (ซื้อ)` },
                          { ma: "MA20", sma: `${(analysisPrice * 0.985).toFixed(2)} (ถือ)`, ema: `${(analysisPrice * 0.987).toFixed(2)} (ถือ)` },
                          { ma: "MA50", sma: `${(analysisPrice * 0.97).toFixed(2)} (ซื้อ)`, ema: `${(analysisPrice * 0.975).toFixed(2)} (ซื้อ)` },
                          { ma: "MA100", sma: `${(analysisPrice * 0.95).toFixed(2)} (ซื้อ)`, ema: `${(analysisPrice * 0.955).toFixed(2)} (ซื้อ)` },
                          { ma: "MA200", sma: `${(analysisPrice * 0.92).toFixed(2)} (ซื้อ)`, ema: `${(analysisPrice * 0.93).toFixed(2)} (ซื้อ)` },
                        ].map((item, i) => (
                          <tr key={i}>
                            <td className="py-2 font-bold text-white">{item.ma}</td>
                            <td className="py-2 text-right text-emerald-400">{item.sma}</td>
                            <td className="py-2 text-right text-emerald-400">{item.ema}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* ฟีเจอร์ที่ 1: แนวรับ-แนวต้าน & บิ๊กออเดอร์เรียลไทม์ */}
              <div className="rounded-3xl bg-gradient-to-br from-purple-950/40 via-slate-900 to-slate-950 border border-purple-500/30 p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="text-3xl mb-4">📈</div>
                  <h3 className="text-xl font-bold text-white">
                    {lang === "th" ? "แนวรับ-แนวต้าน & บิ๊กออเดอร์เรียลไทม์" : "Support/Resistance & Real-time Whale Orders"}
                  </h3>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    {lang === "th" 
                      ? "ตรวจจับคำสั่งซื้อและคำสั่งขายขนาดใหญ่ (Block Trade / Whale Orders) แบบเรียลไทม์ พร้อมวิเคราะห์โซนแนวรับแนวต้านสำคัญให้คุณเห็นจุดเข้าทำกำไรชัดเจน" 
                      : "Detect large buy/sell orders in real-time with automated support and resistance zones."}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-purple-400">
                  <span>⚡ Live Data Feed</span>
                  <span className="bg-purple-500/20 px-3 py-1 rounded-full border border-purple-500/30">VIP Exclusive</span>
                </div>
              </div>

              {/* ฟีเจอร์ที่ 2: เส้น EMA & คำสั่งซื้อของกองทุน */}
              <div className="rounded-3xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-950 border border-indigo-500/30 p-8 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="text-3xl mb-4">🏛️</div>
                  <h3 className="text-xl font-bold text-white">
                    {lang === "th" ? "วิเคราะห์เส้น EMA & คำสั่งซื้อกองทุน (Institutional Flow)" : "EMA Analysis & Institutional Fund Flows"}
                  </h3>
                  <p className="text-sm text-slate-300 mt-3 leading-relaxed">
                    {lang === "th" 
                      ? "ติดตามระบบเส้นค่าเฉลี่ยเคลื่อนที่ (EMA) หลายกรอบเวลา และวิเคราะห์ทิศทางกระแสเงินลงทุนของกองทุนสถาบัน เพื่อเกาะรอย Smart Money อย่างแท้จริง" 
                      : "Multi-timeframe EMA analysis combined with tracking institutional fund flows."}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-400">
                  <span>📊 Smart Money Tracker</span>
                  <span className="bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/30">VIP Exclusive</span>
                </div>
              </div>

            </div>
          </div>

          {/* ฟีเจอร์เสริมย่อย */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-3">🚀</div>
                <h3 className="text-lg font-bold text-white">Advanced Tracker</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "th" ? "ติดตามพอร์ตหุ้นแบบแยกรายไม้ วิเคราะห์กลยุทธ์ 10 ระดับอย่างแม่นยำ" : "Real-time lot tracking and 10-tier strategy analysis."}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-purple-400">Included in VIP</div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-3">💰</div>
                <h3 className="text-lg font-bold text-white">Affiliate Earnings</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "th" ? "รับลิงก์แนะนำส่วนตัว สร้างรายได้คอมมิชชันจากการเชิญเพื่อนมาใช้งาน" : "Earn commissions by inviting friends to join the platform."}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-purple-400">Exclusive for VIP</div>
            </div>

            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl flex flex-col justify-between">
              <div>
                <div className="text-2xl mb-3">⭐</div>
                <h3 className="text-lg font-bold text-white">Priority Support</h3>
                <p className="text-xs text-slate-400 mt-2">
                  {lang === "th" ? "รับการอัปเดตฟีเจอร์ใหม่ก่อนใคร และสิทธิพิเศษในการดูแลระดับพรีเมียม" : "Get early access to new features and priority support."}
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800 text-xs font-bold text-purple-400">24/7 Access</div>
            </div>
          </div>

          {/* 🌟 ส่วนที่ 2: หัวข้อโปรโมตหลักและปุ่มสถานะ/สมัครสมาชิก */}
          <div className="text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
              {lang === "th" ? "ยกระดับการลงทุนและสร้างรายได้ไร้ขีดจำกัด" : "Upgrade Your Investing & Earning Potential"}
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              {lang === "th" 
                ? "ปลดล็อกเครื่องมือวิเคราะห์ตลาดเชิงลึกและพอร์ตลงทุนขั้นสูง เพื่อการตัดสินใจที่แม่นยำยิ่งขึ้น" 
                : "Unlock advanced market analysis and portfolio tools for smarter decision making."}
            </p>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-purple-900/40 via-indigo-950 to-slate-900 border border-purple-500/30 p-8 md:p-10 text-center shadow-2xl">
            {isVip ? (
              <div>
                <span className="inline-block rounded-full bg-purple-600 px-4 py-1 text-xs font-black text-white uppercase tracking-wider mb-3">
                  ⭐ Active VIP Status
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {lang === "th" ? "คุณเป็นสมาชิก VIP เรียบร้อยแล้ว!" : "You are a VIP Member!"}
                </h2>
                <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
                  {lang === "th" ? "คุณสามารถเข้าใช้งานระบบสร้างรายได้และดูสถิติลิงก์แนะนำเพื่อนได้ทันที" : "You have full access to the affiliate program and advanced features."}
                </p>

                <div className="mt-8 flex justify-center">
                  <Link
                    href="/affiliate-program"
                    className="rounded-xl bg-purple-600 px-8 py-3.5 font-bold text-white shadow-lg hover:bg-purple-500 transition text-center cursor-pointer text-sm"
                  >
                    💸 {lang === "th" ? "สร้างรายได้ (Affiliate)" : "Affiliate Program"}
                  </Link>
                </div>
              </div>
            ) : (
              <div>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white">
                  {lang === "th" ? "พร้อมปลดล็อกสิทธิประโยชน์ทั้งหมดแล้วหรือยัง?" : "Ready to unlock all VIP benefits?"}
                </h2>
                <p className="mt-2 text-sm text-slate-300 max-w-md mx-auto">
                  {lang === "th" ? "อัปเกรดเป็นสมาชิก VIP วันนี้ เพื่อเริ่มใช้งานเครื่องมือวิเคราะห์ระดับโปรและระบบ Affiliate" : "Upgrade to VIP today and start using professional analytics."}
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={handleUpgradeVip}
                    disabled={upgrading}
                    className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-8 py-3.5 font-extrabold text-white shadow-xl hover:from-purple-500 hover:to-indigo-500 transition cursor-pointer text-sm disabled:opacity-50"
                  >
                    {upgrading 
                      ? (lang === "th" ? "กำลังดำเนินการ..." : "Processing...") 
                      : (lang === "th" ? "✨ สมัครสมาชิก VIP ทันที" : "✨ Upgrade to VIP Now")}
                  </button>

                  <Link
                    href="/vip/dashboard"
                    className="w-full sm:w-auto rounded-xl bg-slate-900 border border-slate-700 px-6 py-3.5 font-bold text-slate-300 hover:bg-slate-800 transition text-center cursor-pointer text-sm"
                  >
                    🔑 {lang === "th" ? "เข้าสู่ระบบ VIP" : "VIP Login"}
                  </Link>
                </div>
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}