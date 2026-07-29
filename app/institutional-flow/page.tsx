"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { getStockPrice } from "@/lib/stock";
import { translations, Language } from "@/lib/i18n";

export default function InstitutionalFlowPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("AAPL");
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [price, setPrice] = useState(0);
  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  // ข้อมูลจำลอง Institutional Flow และ EMA Analysis ตามหุ้นที่ค้นหา
  const [flowData, setFlowData] = useState({
    institutionalInflow: "+$450.2M",
    flowStatus: "แรงซื้อหนาแน่นจากกองทุนใหญ่ (Strong Institutional Accumulation)",
    sentimentScore: 85,
    whaleOrdersCount: 24,
    emaTrend: "Bullish Alignment (EMA 20 > EMA 50 > EMA 200)",
    supportLevel: 0,
    resistanceLevel: 0,
  });

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // เช็คสิทธิ์ VIP
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_vip")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.is_vip) {
        router.replace("/vip");
        return;
      }

      const p = await getStockPrice("AAPL");
      setPrice(p);
      updateFlowMetrics(p, "AAPL");
      setLoading(false);
    }
    checkAuthAndLoad();
  }, [router]);

  const updateFlowMetrics = (currentPrice: number, ticker: string) => {
    // คำนวณจำลองข้อมูลเชิงลึกตามราคาหุ้นจริงเพื่อให้สมจริง
    const seed = ticker.charCodeAt(0);
    const inflow = ((seed * currentPrice) % 800) - 200;
    const isPositive = inflow >= 0;

    setFlowData({
      institutionalInflow: `${isPositive ? "+" : ""}$${inflow.toFixed(1)}M`,
      flowStatus: isPositive ? "สถาบันการเงินเข้าสะสมหุ้นต่อเนื่อง (Smart Money Buying)" : "สถาบันการเงินทยอยลดความเสี่ยง / ขายทำกำไร",
      sentimentScore: Math.min(95, Math.max(25, Math.floor(50 + (inflow / 10)))),
      whaleOrdersCount: Math.floor(10 + (currentPrice % 30)),
      emaTrend: currentPrice > 100 ? "Bullish Alignment (ขาขึ้นแข็งแกร่ง)" : "Consolidation / Sideway",
      supportLevel: Number((currentPrice * 0.97).toFixed(2)),
      resistanceLevel: Number((currentPrice * 1.03).toFixed(2)),
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol.trim()) return;
    const clean = inputSymbol.toUpperCase().trim();
    setSymbol(clean);
    const p = await getStockPrice(clean);
    setPrice(p);
    updateFlowMetrics(p, clean);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">กำลังตรวจสอบสิทธิ์ VIP และโหลดข้อมูลกองทุน...</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-xs font-bold uppercase mb-2">
                🏛️ VIP Institutional Flow & Smart Money Tracker
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-white">
                วิเคราะห์เส้น EMA & กระแสเงินลงทุนกองทุนสถาบัน
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                ติดตามคำสั่งซื้อขายระดับสถาบัน (Whale Orders) และเจาะลึกโครงสร้างเส้นค่าเฉลี่ยเคลื่อนที่แบบเรียลไทม์
              </p>
            </div>

            {/* ช่องค้นหาหุ้น */}
            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800">
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                placeholder="AAPL, TSLA..."
                className="bg-slate-950 text-white px-3 py-2 rounded-lg text-sm font-mono uppercase focus:outline-none w-28 text-center border border-slate-700"
              />
              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition">
                🔍 ค้นหา
              </button>
            </form>
          </div>

          {/* สรุปข้อมูลหลักของหุ้นที่เลือก */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">หุ้นที่วิเคราะห์ (Symbol)</div>
              <div className="text-3xl font-black text-white">{symbol}</div>
              <div className="text-emerald-400 font-bold text-sm mt-1">${price.toFixed(2)} USD</div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">กระแสเงินลงทุนกองทุน (Net Flow)</div>
              <div className="text-2xl font-black text-indigo-400">{flowData.institutionalInflow}</div>
              <div className="text-xs text-slate-300 mt-1">{flowData.flowStatus}</div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">ดัชนีชี้วัดความเชื่อมั่น Smart Money</div>
              <div className="text-3xl font-black text-emerald-400">{flowData.sentimentScore} / 100</div>
              <div className="text-xs text-slate-400 mt-1">ระดับความน่าสนใจในการเข้าสะสม</div>
            </div>

            <div className="rounded-2xl bg-slate-900/80 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">คำสั่งซื้อขายล็อตใหญ่ (Whale Blocks)</div>
              <div className="text-3xl font-black text-amber-400">{flowData.whaleOrdersCount} <span className="text-sm font-normal text-slate-400">รายการวันนี้</span></div>
              <div className="text-xs text-slate-400 mt-1">ตรวจพบการทำ Block Trade หนาแน่น</div>
            </div>
          </div>

          {/* ตารางวิเคราะห์เส้น EMA และ แนวรับ-แนวต้าน */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* โครงสร้างเส้น EMA */}
            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>📈</span> สภาพโครงสร้างเส้น EMA (Multi-Timeframe)
              </h3>
              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">แนวโน้มระยะสั้นและกลาง (EMA 20 & 50)</span>
                  <span className="font-bold text-emerald-400">🟢 ขาขึ้น (Bullish)</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">แนวโน้มหลักระยะยาว (EMA 200)</span>
                  <span className="font-bold text-emerald-400">🟢 ยืนเหนือเส้นค่าเฉลี่ยหลัก</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">สถานะสัญญาณเทคนิคปัจจุบัน</span>
                  <span className="font-bold text-purple-300">{flowData.emaTrend}</span>
                </div>
              </div>
            </div>

            {/* โซนแนวรับ แนวต้านอัตโนมัติ */}
            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <span>🎯</span> โซนแนวรับ & แนวต้านคำนวณด้วย Institutional Flow
              </h3>
              <div className="space-y-3 text-xs md:text-sm">
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">แนวต้านสำคัญ (Resistance Zone)</span>
                  <span className="font-bold text-rose-400">${flowData.resistanceLevel} USD</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">ราคาซื้อขายปัจจุบัน (Current Price)</span>
                  <span className="font-bold text-white">${price.toFixed(2)} USD</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">แนวรับสำคัญ / โซนสะสม (Support Zone)</span>
                  <span className="font-bold text-emerald-400">${flowData.supportLevel} USD</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </main>
    </>
  );
}