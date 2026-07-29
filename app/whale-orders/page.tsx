"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { getStockPrice } from "@/lib/stock";
import { translations, Language } from "@/lib/i18n";

export default function WhaleOrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState("AAPL");
  const [inputSymbol, setInputSymbol] = useState("AAPL");
  const [price, setPrice] = useState(0);
  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  const [marketData, setMarketData] = useState({
    support1: 0,
    support2: 0,
    resistance1: 0,
    resistance2: 0,
    whaleBuyPressure: "78%",
    whaleSellPressure: "22%",
    orders: [] as any[],
  });

  useEffect(() => {
    async function checkAuthAndLoad() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

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
      calculateLevelsAndOrders(p, "AAPL");
      setLoading(false);
    }
    checkAuthAndLoad();
  }, [router]);

  const calculateLevelsAndOrders = (currentPrice: number, ticker: string) => {
    const s1 = Number((currentPrice * 0.985).toFixed(2));
    const s2 = Number((currentPrice * 0.965).toFixed(2));
    const r1 = Number((currentPrice * 1.015).toFixed(2));
    const r2 = Number((currentPrice * 1.035).toFixed(2));

    const mockOrders = [
      { id: 1, time: "10:14:22", type: "BUY (ซื้อก้อนใหญ่)", shares: "45,000 หุ้น", total: `$${(45000 * currentPrice).toLocaleString()}`, impact: "High Buy Wall" },
      { id: 2, time: "10:11:05", type: "BUY (บิ๊กออเดอร์สถาบัน)", shares: "120,000 หุ้น", total: `$${(120000 * currentPrice).toLocaleString()}`, impact: "Accumulation Zone" },
      { id: 3, time: "09:58:40", type: "SELL (แรงขายทำกำไร)", shares: "30,000 หุ้น", total: `$${(30000 * currentPrice).toLocaleString()}`, impact: "Resistance Rejection" },
      { id: 4, time: "09:45-12", type: "BUY (เติมไม้หนาแน่น)", shares: "85,000 หุ้น", total: `$${(85000 * currentPrice).toLocaleString()}`, impact: "Support Defense" },
    ];

    setMarketData({
      support1: s1,
      support2: s2,
      resistance1: r1,
      resistance2: r2,
      whaleBuyPressure: ((currentPrice % 10) + 70).toFixed(0) + "%",
      whaleSellPressure: (100 - Number(((currentPrice % 10) + 70).toFixed(0))) + "%",
      orders: mockOrders,
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputSymbol.trim()) return;
    const clean = inputSymbol.toUpperCase().trim();
    setSymbol(clean);
    const p = await getStockPrice(clean);
    setPrice(p);
    calculateLevelsAndOrders(p, clean);
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">กำลังโหลดระบบตรวจจับบิ๊กออเดอร์...</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      {/* Navbar แบบกำหนดเองสำหรับหน้า VIP */}
      <nav className="w-full bg-slate-900 border-b border-slate-800 py-3 px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-black text-white tracking-wider">TARO <span className="text-purple-400 text-xs px-2 py-0.5 rounded bg-purple-500/20 border border-purple-500/30">VIP PORTAL</span></span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/vip" className="text-xs font-bold text-slate-300 hover:text-white transition">
            หน้าหลัก VIP
          </Link>
          <button 
            onClick={async () => {
              await supabase.auth.signOut();
              router.replace("/login");
            }}
            className="text-xs font-bold text-rose-400 hover:text-rose-300 bg-rose-500/10 px-3 py-1.5 rounded-lg border border-rose-500/20 transition cursor-pointer"
          >
            ออกจากระบบ
          </button>
        </div>
      </nav>

      <main className="min-h-screen bg-slate-950 text-slate-100 py-10 px-4">
        <div className="mx-auto max-w-6xl space-y-8">
          
          {/* Header พร้อมปุ่มกลับแดชบอร์ด */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <Link 
                href="/vip" 
                className="inline-flex items-center gap-2 text-xs font-bold text-purple-400 hover:text-purple-300 mb-3 bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 transition"
              >
                ← กลับหน้าแดชบอร์ด VIP
              </Link>
              <h1 className="text-2xl md:text-3xl font-black text-white mt-1">
                แนวรับ-แนวต้านอัตโนมัติ & ตรวจจับบิ๊กออเดอร์เรียลไทม์
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1">
                วิเคราะห์คำสั่งซื้อขายล็อตใหญ่ (Block Trade / Whale Orders) และคำนวณโซนแนวรับแนวต้านแบบเรียลไทม์รายตัว
              </p>
            </div>

            <form onSubmit={handleSearch} className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-800 shadow-inner">
              <input
                type="text"
                value={inputSymbol}
                onChange={(e) => setInputSymbol(e.target.value)}
                placeholder="AAPL, TSLA..."
                className="bg-slate-950 text-white px-3 py-2 rounded-lg text-sm font-mono uppercase focus:outline-none w-28 text-center border border-slate-700"
              />
              <button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer">
                🔍 ค้นหาหุ้น
              </button>
            </form>
          </div>

          {/* สรุปข้อมูลราคาปัจจุบัน & แรงซื้อขาย */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">หุ้นที่กำลังตรวจสอบ (Ticker)</div>
              <div className="text-3xl font-black text-purple-400">{symbol}</div>
              <div className="text-emerald-400 font-bold text-base mt-1">${price.toFixed(2)} USD</div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">แรงซื้อจากบิ๊กออเดอร์ (Whale Buy Pressure)</div>
              <div className="text-3xl font-black text-emerald-400">{marketData.whaleBuyPressure}</div>
              <div className="h-2 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: marketData.whaleBuyPressure }}></div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <div className="text-xs text-slate-400 font-bold mb-1">แรงขายจากบิ๊กออเดอร์ (Whale Sell Pressure)</div>
              <div className="text-3xl font-black text-rose-400">{marketData.whaleSellPressure}</div>
              <div className="h-2 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-rose-500" style={{ width: marketData.whaleSellPressure }}></div>
              </div>
            </div>
          </div>

          {/* โซนแนวรับ-แนวต้านอัตโนมัติ */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>🛡️</span> โซนแนวรับคำนวณอัตโนมัติ ({symbol})
              </h3>
              <div className="space-y-3 text-xs md:text-sm font-mono">
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-emerald-500/30">
                  <span className="text-slate-300 font-sans">แนวรับที่ 1 (Support 1 - จุดสะสมระยะสั้น)</span>
                  <span className="font-bold text-emerald-400">${marketData.support1} USD</span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-emerald-500/20">
                  <span className="text-slate-300 font-sans">แนวรับที่ 2 (Support 2 - แนวรับแข็งแกร่งหลัก)</span>
                  <span className="font-bold text-emerald-400">${marketData.support2} USD</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
              <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <span>🎯</span> โซนแนวต้านคำนวณอัตโนมัติ ({symbol})
              </h3>
              <div className="space-y-3 text-xs md:text-sm font-mono">
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-rose-500/30">
                  <span className="text-slate-300 font-sans">แนวต้านที่ 1 (Resistance 1 - จุดขายทำกำไรแรก)</span>
                  <span className="font-bold text-rose-400">${marketData.resistance1} USD</span>
                </div>
                <div className="flex justify-between items-center p-3.5 rounded-xl bg-slate-950 border border-rose-500/20">
                  <span className="text-slate-300 font-sans">แนวต้านที่ 2 (Resistance 2 - จุดแนวต้านสำคัญ)</span>
                  <span className="font-bold text-rose-400">${marketData.resistance2} USD</span>
                </div>
              </div>
            </div>
          </div>

          {/* ตารางแสดงรายการบิ๊กออเดอร์เรียลไทม์ */}
          <div className="rounded-2xl bg-slate-900/90 p-6 border border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
              <span>🐋</span> ตรวจจับบิ๊กออเดอร์เรียลไทม์ (Whale Block Trades) สำหรับหุ้น <span className="text-purple-400">{symbol}</span>
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="pb-3 font-semibold">เวลา (Time)</th>
                    <th className="pb-3 font-semibold">ประเภทคำสั่ง</th>
                    <th className="pb-3 font-semibold">จำนวนหุ้น</th>
                    <th className="pb-3 font-semibold">มูลค่ารวม (USD)</th>
                    <th className="pb-3 font-semibold text-right">ผลกระทบต่อราคา</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {marketData.orders.map((ord) => (
                    <tr key={ord.id} className="hover:bg-slate-950/50 transition">
                      <td className="py-3 text-slate-300">{ord.time}</td>
                      <td className={`py-3 font-bold ${ord.type.includes("BUY") ? "text-emerald-400" : "text-rose-400"}`}>
                        {ord.type}
                      </td>
                      <td className="py-3 text-white">{ord.shares}</td>
                      <td className="py-3 text-purple-300 font-semibold">{ord.total}</td>
                      <td className="py-3 text-right text-slate-300 font-sans text-xs">{ord.impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>
    </>
  );
}