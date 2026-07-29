"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import AddStockModal from "@/components/portfolio/AddStockModal";
import CashModal from "@/components/portfolio/CashModal";
import { getStockPrice } from "@/lib/stock";
import { translations, Language } from "@/lib/i18n";

export default function PortfolioPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"BUY" | "SELL">("BUY");
  const [editStock, setEditStock] = useState<any>(null);
  const [openCashModal, setOpenCashModal] = useState(false);
  
  const [stocks, setStocks] = useState<any[]>([]);
  const [cash, setCash] = useState(0);
  const [cashCurrency, setCashCurrency] = useState<"THB" | "USD">("THB");
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState<"THB" | "USD">("THB");
  const [exchangeRate, setExchangeRate] = useState(35); // ค่าเริ่มต้นสำรอง จะถูกทับด้วยค่า Real-time API
  const [realizedPnl, setRealizedPnl] = useState(0);

  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  // 🌟 ดึงค่าอัตราแลกเปลี่ยนแบบ Real-time จาก API กลาง
  async function loadExchangeRate() {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data && data.rates && data.rates.THB) {
        setExchangeRate(Number(data.rates.THB));
      }
    } catch (err) {
      console.error("Error loading live exchange rate:", err);
    }
  }

  const fetchPrices = useCallback(async (portfolioList: any[]) => {
    if (!portfolioList || portfolioList.length === 0) return;
    setRefreshingPrices(true);

    const uniqueSymbols = Array.from(new Set(portfolioList.map((item) => item.symbol)));
    const pricePromises = uniqueSymbols.map(async (symbol) => {
      const price = await getStockPrice(symbol);
      return { symbol, price };
    });

    const priceResults = await Promise.all(pricePromises);
    const latestPrices: Record<string, number> = {};
    priceResults.forEach(({ symbol, price }) => {
      latestPrices[symbol] = price;
    });

    setPrices(latestPrices);
    setRefreshingPrices(false);
  }, []);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }
    setEmail(user.email ?? "");

    await loadExchangeRate();

    const { data: portData } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", user.id)
      .order("buy_date", { ascending: false });

    const items = portData || [];
    setStocks(items);
    await fetchPrices(items);

    let pnl = 0;
    items.forEach(item => {
      if (item.type === "SELL" && item.realized_pnl) {
        pnl += Number(item.realized_pnl);
      }
    });
    setRealizedPnl(pnl);

    const { data: cashData } = await supabase
      .from("cash")
      .select("amount, currency")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (cashData && cashData.length > 0) {
      setCash(Number(cashData[0].amount || 0));
      setCashCurrency((cashData[0].currency ?? "THB") as "THB" | "USD");
    }

    setLoading(false);
  }, [router, fetchPrices]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete(id: string) {
    if (!window.confirm("คุณต้องการลบรายการนี้ใช่หรือไม่?")) return;
    const { error } = await supabase.from("portfolio").delete().eq("id", id);
    if (!error) {
      loadData();
    } else {
      alert("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  }

  const currencySymbol = currency === "USD" ? "$" : "฿";
  const cashMultiplier = currency === "USD" 
    ? (cashCurrency === "THB" ? 1 / exchangeRate : 1) 
    : (cashCurrency === "USD" ? exchangeRate : 1);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">กำลังโหลดพอร์ตฟิลิปส์...</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-8 md:p-10 space-y-8">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <span className="inline-block rounded-full bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20 uppercase tracking-widest mb-2">
                PORTFOLIO TRACKER
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-3">
                <span>📋</span> พอร์ตฟิลิปส์ (บันทึกซื้อขาย)
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                บันทึกรายการซื้อเข้าและขายออกแยกตามไม้ พร้อมแสดงผลกำไรขาดทุนแบบเรียลไทม์
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData()}
                disabled={refreshingPrices}
                className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs md:text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer shadow-sm"
              >
                <span className={refreshingPrices ? "animate-spin" : ""}>🔄</span>
                {refreshingPrices ? "กำลังรีเฟรช..." : "รีเฟรชราคา"}
              </button>

              <div className="flex overflow-hidden rounded-xl border border-slate-800 bg-slate-900 shadow-sm">
                <button
                  onClick={() => setCurrency("THB")}
                  className={`px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    currency === "THB" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  THB (฿)
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3.5 py-2 text-xs font-bold transition cursor-pointer ${
                    currency === "USD" ? "bg-indigo-600 text-white shadow" : "text-slate-400 hover:text-white"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/40 p-4 rounded-2xl border border-slate-800/60 shadow-lg">
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  setModalMode("BUY");
                  setEditStock(null);
                  setOpenModal(true);
                }}
                className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white shadow-lg hover:bg-indigo-500 transition flex items-center gap-2 text-sm cursor-pointer"
              >
                <span>➕</span> เพิ่มหุ้น (ซื้อเข้า)
              </button>

              <button
                onClick={() => {
                  setModalMode("SELL");
                  setEditStock(null);
                  setOpenModal(true);
                }}
                className="rounded-xl bg-rose-600 px-5 py-2.5 font-bold text-white shadow-lg hover:bg-rose-500 transition flex items-center gap-2 text-sm cursor-pointer"
              >
                <span>➖</span> ขายหุ้น (ขายออก)
              </button>

              <button
                onClick={() => setOpenCashModal(true)}
                className="rounded-xl bg-slate-900 border border-slate-700/80 px-5 py-2.5 font-bold text-slate-200 hover:bg-slate-800 transition flex items-center gap-2 text-sm cursor-pointer shadow-sm"
              >
                <span>💵</span> แก้ไขเงินสด <span className="text-indigo-400">({currencySymbol}{(cash * cashMultiplier).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
              </button>
            </div>

            <div className="rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-2.5 text-xs md:text-sm font-semibold text-slate-300 flex items-center gap-2">
              <span className="text-slate-400">กำไร/ขาดทุนที่ขายแล้ว (Realized P/L):</span> 
              <span className={`font-bold ${realizedPnl >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                {realizedPnl >= 0 ? "+" : ""}{(realizedPnl * (currency === "THB" ? exchangeRate : 1)).toFixed(2)} {currencySymbol}
              </span>
            </div>
          </div>

          <div className="rounded-3xl bg-slate-900/60 p-6 md:p-8 border border-slate-800/80 shadow-2xl backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg md:text-xl font-bold text-white flex items-center gap-2">
                <span>📊</span> รายการซื้อขายทั้งหมด 
                <span className="ml-2 rounded-full bg-indigo-500/10 px-3 py-0.5 text-xs font-bold text-indigo-400 border border-indigo-500/20">
                  {stocks.length} รายการ
                </span>
              </h2>
            </div>

            {stocks.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-16 text-center text-slate-500 text-sm bg-slate-950/40">
                ยังไม่มีรายการซื้อขายในพอร์ต กดปุ่ม "เพิ่มหุ้น (ซื้อเข้า)" ด้านบนเพื่อเริ่มต้นบันทึก
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-800/80 bg-slate-950/50 shadow-inner">
                <table className="min-w-[1000px] w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-4">วันที่</th>
                      <th className="px-4 py-4">ประเภท</th>
                      <th className="px-4 py-4">TICKER</th>
                      <th className="px-4 py-4">ตลาด</th>
                      <th className="px-4 py-4 text-right">จำนวน</th>
                      <th className="px-4 py-4 text-right">ราคาทำรายการ ({currencySymbol})</th>
                      <th className="px-4 py-4 text-right">ราคาปัจจุบัน ({currencySymbol})</th>
                      <th className="px-4 py-4 text-right">กำไร / ขาดทุน ({currencySymbol})</th>
                      <th className="px-4 py-4 text-right">% กำไร/ขาดทุน</th>
                      <th className="px-4 py-4 text-center">จัดการ</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 text-xs md:text-sm">
                    {stocks.map((item) => {
                      const isBuy = item.type === "BUY";
                      const qty = Number(item.quantity || 0);
                      const isUS = item.market === "US";

                      const rawBuyPrice = Number(item.buy_price || 0);
                      const rawCurrentPrice = prices[item.symbol] || rawBuyPrice;

                      let buyPrice = rawBuyPrice;
                      let currentPrice = rawCurrentPrice;

                      // 🌟 ปรับปรุงการแปลงสกุลเงินหุ้น US ให้ถูกต้องตามสกุลเงินที่เลือกแสดงผล
                      if (isUS) {
                        if (currency === "THB") {
                          // ถ้าบันทึกเป็น USD แต่ผู้ใช้เลือกดูเป็น THB ให้แปลงเป็น THB
                          buyPrice = rawBuyPrice * exchangeRate;
                          currentPrice = rawCurrentPrice * exchangeRate;
                        } else {
                          // ถ้าผู้ใช้เลือกดูเป็น USD แสดงผลตามค่า USD จริง
                          buyPrice = rawBuyPrice;
                          currentPrice = rawCurrentPrice;
                        }
                      } else {
                        // หุ้นไทยหรือตลาดอื่นๆ (บันทึกเป็น THB)
                        if (currency === "USD") {
                          buyPrice = rawBuyPrice / exchangeRate;
                          currentPrice = rawCurrentPrice / exchangeRate;
                        } else {
                          buyPrice = rawBuyPrice;
                          currentPrice = rawCurrentPrice;
                        }
                      }

                      const pnl = (currentPrice - buyPrice) * qty;
                      const pnlPercent = buyPrice > 0 ? ((currentPrice - buyPrice) / buyPrice) * 100 : 0;
                      const isPositive = pnl >= 0;

                      return (
                        <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                          <td className="px-4 py-4 text-slate-400 font-medium whitespace-nowrap">{item.buy_date}</td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${isBuy ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'}`}>
                              {isBuy ? '🟢 ซื้อเข้า' : '🔴 ขายออก'}
                            </span>
                          </td>
                          <td className="px-4 py-4 font-extrabold text-white tracking-wide">{item.symbol}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-md bg-slate-800/80 px-2.5 py-1 text-xs font-bold text-slate-300 border border-slate-700/50">
                              {item.market}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-slate-200">{qty.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-mono text-slate-300">{buyPrice.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right font-mono text-slate-300">{currentPrice.toFixed(2)}</td>
                          <td className={`px-4 py-4 text-right font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{pnl.toFixed(2)}
                          </td>
                          <td className={`px-4 py-4 text-right font-mono font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{pnlPercent.toFixed(2)}%
                          </td>
                          <td className="px-4 py-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => {
                                  setEditStock(item);
                                  setModalMode(item.type);
                                  setOpenModal(true);
                                }}
                                className="rounded-xl px-3 py-1.5 text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 hover:bg-amber-500/20 transition cursor-pointer shadow-sm"
                              >
                                แก้ไข
                              </button>
                              <button
                                onClick={() => handleDelete(item.id)}
                                className="rounded-xl px-3 py-1.5 text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/30 hover:bg-rose-500/20 transition cursor-pointer shadow-sm"
                              >
                                ลบ
                              </button>
                            </div>
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

      <AddStockModal
        open={openModal || !!editStock}
        onClose={() => {
          setOpenModal(false);
          setEditStock(null);
        }}
        onSuccess={() => loadData()}
        editStock={editStock}
        defaultType={modalMode}
        onClearEdit={() => setEditStock(null)}
      />

      <CashModal
        open={openCashModal}
        onClose={() => setOpenCashModal(false)}
        currentCash={cash}
        currentCurrency={cashCurrency}
        onSaved={() => loadData()}
      />
    </>
  );
}