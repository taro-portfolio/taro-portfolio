"use client";

import { useState, useEffect } from "react";
import { Language } from "@/lib/i18n";

interface USMarketViewProps {
  lang: Language;
  initialSymbol?: string;
  onBack: () => void;
}

declare global {
  interface Window {
    TradingView: any;
  }
}

export default function USMarketView({ lang, initialSymbol, onBack }: USMarketViewProps) {
  // ฐานข้อมูลหุ้นเชิงลึกรายตัว
  const usStocks = [
    { 
      symbol: "AEHR", name: "Aehr Test Systems", market: "NASDAQ", price: "76.32", change: "-0.42%", isUp: false,
      support: "$72.00 / $68.50", resistance: "$81.00 / $85.50",
      shortTerm: "📈 ขาขึ้นอ่อนๆ", midTerm: "⚖️ ไซด์เวย์ (Sideway)", longTerm: "🚀 ขาขึ้นเติบโต",
      largeBuy: "450,000 หุ้น ($34.2M)", largeSell: "520,000 หุ้น ($39.6M)", netFlow: "🔴 เงินออกสุทธิ (- $5.4M)", institution: "แรงขายทำกำไรระยะสั้น"
    },
    { 
      symbol: "LRCX", name: "Lam Research Corporation", market: "NASDAQ", price: "305.21", change: "+0.09%", isUp: true,
      support: "$295.50 / $282.00", resistance: "$320.00 / $335.50",
      shortTerm: "📈 ขาขึ้น (Bullish)", midTerm: "📈 ขาขึ้นแข็งแกร่ง", longTerm: "🚀 ขาขึ้น (Strong Buy)",
      largeBuy: "1,450,000 หุ้น ($44.2M)", largeSell: "320,000 หุ้น ($9.7M)", netFlow: "💚 เงินเข้าสุทธิ (+ $34.5M)", institution: "สะสมหุ้นต่อเนื่อง (Accumulation)"
    },
    { 
      symbol: "TSLA", name: "Tesla, Inc.", market: "NASDAQ", price: "313.03", change: "-0.53%", isUp: false,
      support: "$300.00 / $285.00", resistance: "$325.00 / $340.00",
      shortTerm: "⚖️ พักตัวระยะสั้น", midTerm: "📈 ขาขึ้น", longTerm: "🚀 ขาขึ้นระยะยาว",
      largeBuy: "3,890,000 หุ้น ($1.21B)", largeSell: "4,120,000 หุ้น ($1.28B)", netFlow: "🔴 เงินออกสุทธิ (- $70M)", institution: "แรงซื้อสลับแรงขายหนาแน่น"
    },
    { 
      symbol: "ONDS", name: "Ondas Holdings Inc.", market: "NASDAQ", price: "7.80", change: "+0.39%", isUp: true,
      support: "$7.20 / $6.80", resistance: "$8.50 / $9.20",
      shortTerm: "📈 ขาขึ้นรอบใหม่", midTerm: "📈 ขาขึ้น", longTerm: "⭐ เก็งกำไรสูง",
      largeBuy: "890,000 หุ้น ($6.9M)", largeSell: "150,000 หุ้น ($1.1M)", netFlow: "💚 เงินเข้าสุทธิ (+ $5.8M)", institution: "กลุ่มทุนรายใหญ่ทยอยเก็บ"
    },
    { 
      symbol: "NVDA", name: "NVIDIA Corporation", market: "NASDAQ", price: "128.50", change: "+2.15%", isUp: true,
      support: "$122.00 / $118.50", resistance: "$135.00 / $142.00",
      shortTerm: "🚀 ขาขึ้นร้อนแรง", midTerm: "📈 ขาขึ้นแข็งแกร่งมาก", longTerm: "🌟 ขาขึ้นหลักของตลาด",
      largeBuy: "12,500,000 หุ้น ($1.6B)", largeSell: "2,100,000 หุ้น ($270M)", netFlow: "💚 เงินเข้าสุทธิ (+ $1.33B)", institution: "กองทุนระดับโลกเข้าซื้อสะสม"
    },
    { 
      symbol: "AAPL", name: "Apple Inc.", market: "NASDAQ", price: "214.20", change: "+0.65%", isUp: true,
      support: "$208.00 / $202.00", resistance: "$220.00 / $228.00",
      shortTerm: "📈 ขาขึ้นมั่นคง", midTerm: "📈 ขาขึ้น", longTerm: "💎 ถือลงทุนระยะยาวดีเยี่ยม",
      largeBuy: "5,400,000 หุ้น ($1.15B)", largeSell: "1,800,000 หุ้น ($385M)", netFlow: "💚 เงินเข้าสุทธิ (+ $765M)", institution: "เสถียรภาพสูง แรงซื้อสม่ำเสมอ"
    },
  ];

  const [selectedStock, setSelectedStock] = useState<typeof usStocks[0] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isVip, setIsVip] = useState(false); // ควบคุมสถานะสิทธิ์ VIP

  useEffect(() => {
    if (initialSymbol) {
      const found = usStocks.find((s) => s.symbol === initialSymbol);
      if (found) setSelectedStock(found);
    }
  }, [initialSymbol]);

  useEffect(() => {
    if (!selectedStock) return;

    const loadTradingView = () => {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `${selectedStock.market}:${selectedStock.symbol}`,
          interval: "D",
          timezone: "Asia/Bangkok",
          theme: "dark",
          style: "1",
          locale: lang === "th" ? "th_TH" : "en",
          enable_publishing: false,
          backgroundColor: "#090d16",
          gridColor: "#1e293b",
          hide_top_toolbar: false,
          save_image: false,
          container_id: "tv_advanced_chart",
        });
      }
    };

    const scriptId = "tradingview-widget-script";
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://s3.tradingview.com/tv.js";
      script.async = true;
      script.onload = loadTradingView;
      document.body.appendChild(script);
    } else {
      loadTradingView();
    }
  }, [selectedStock, lang]);

  const filteredStocks = usStocks.filter(
    (stock) =>
      stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <section className="bg-slate-950 py-16 text-white min-h-screen">
      <div className="mx-auto max-w-7xl px-8">
        {selectedStock ? (
          <div>
            <button 
              onClick={() => setSelectedStock(null)}
              className="mb-6 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition shadow-md"
            >
              ← {lang === "th" ? "กลับไปหน้าตลาดหุ้น" : "Back to Market List"}
            </button>

            <div className="rounded-3xl border border-slate-800 bg-slate-900/90 p-6 md:p-8 shadow-2xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl font-black">{selectedStock.symbol}</span>
                    <span className="rounded bg-indigo-500/20 text-indigo-400 px-2 py-0.5 text-xs font-bold">{selectedStock.market}</span>
                  </div>
                  <p className="text-slate-400 mt-1 text-sm">{selectedStock.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold">${selectedStock.price}</div>
                  <div className={`text-xs font-semibold ${selectedStock.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedStock.change}
                  </div>
                </div>
              </div>

              {/* กราฟ TradingView */}
              <div className="rounded-2xl bg-[#090d16] border border-slate-800 p-2 overflow-hidden relative">
                <div id="tv_advanced_chart" className="w-full h-[500px]" />
              </div>

              {/* ส่วนข้อมูลเชิงลึก (ล็อก VIP สำหรับสมาชิกธรรมดา) */}
              <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-800 pt-6">
                
                {/* กล่องที่ 1: แนวรับ แนวต้าน & แนวโน้ม */}
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-indigo-400 flex items-center gap-2">
                      🛡️ {lang === "th" ? `แนวรับ-แนวต้าน (${selectedStock.symbol})` : `Support & Resistance`}
                    </h3>
                    <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold">VIP EXCLUSIVE</span>
                  </div>

                  {isVip ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">แนวรับ (Support):</span>
                        <span className="font-bold text-emerald-400">{selectedStock.support}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">แนวต้าน (Resistance):</span>
                        <span className="font-bold text-rose-400">{selectedStock.resistance}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">ระยะสั้น:</span>
                        <span className="font-semibold text-white">{selectedStock.shortTerm}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">ระยะกลาง:</span>
                        <span className="font-semibold text-white">{selectedStock.midTerm}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">ระยะยาว:</span>
                        <span className="font-semibold text-white">{selectedStock.longTerm}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="text-3xl mb-2">🔒</div>
                      <p className="text-xs text-slate-300 mb-4">
                        {lang === "th" ? "ฟีเจอร์นี้สำหรับสมาชิก VIP เท่านั้น สมัครเพื่อดูแนวรับ-แนวต้านและแนวโน้ม" : "Unlock support & resistance with VIP"}
                      </p>
                      <button 
                        onClick={() => setIsVip(true)}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:brightness-110 transition flex items-center gap-2"
                      >
                        ⭐ {lang === "th" ? "คลิกสมัคร VIP เพื่อปลดล็อก" : "Unlock VIP Access"}
                      </button>
                    </div>
                  )}
                </div>

                {/* กล่องที่ 2: คำสั่งซื้อขายใหญ่ & กระแสเงิน */}
                <div className="rounded-2xl bg-slate-950/80 border border-slate-800 p-6 relative overflow-hidden">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-indigo-400 flex items-center gap-2">
                      ⚡ {lang === "th" ? `คำสั่งซื้อขายใหญ่ & กระแสเงิน` : `Large Orders & Flow`}
                    </h3>
                    <span className="rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold">VIP EXCLUSIVE</span>
                  </div>

                  {isVip ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">ซื้อขนาดใหญ่ (Large Buy):</span>
                        <span className="font-bold text-emerald-400">{selectedStock.largeBuy}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">ขายขนาดใหญ่ (Large Sell):</span>
                        <span className="font-bold text-rose-400">{selectedStock.largeSell}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-800/60 pb-2">
                        <span className="text-slate-400">กระแสเงินสดสุทธิ:</span>
                        <span className="font-bold">{selectedStock.netFlow}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">พฤติกรรมสถาบัน:</span>
                        <span className="font-bold text-indigo-300">{selectedStock.institution}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-slate-950/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-10">
                      <div className="text-3xl mb-2">🔒</div>
                      <p className="text-xs text-slate-300 mb-4">
                        {lang === "th" ? "ฟีเจอร์นี้สำหรับสมาชิก VIP เท่านั้น สมัครเพื่อดูคำสั่งซื้อขายใหญ่ Real-time" : "Unlock real-time large orders with VIP"}
                      </p>
                      <button 
                        onClick={() => setIsVip(true)}
                        className="rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 px-5 py-2.5 text-xs font-bold text-slate-950 shadow-lg hover:brightness-110 transition flex items-center gap-2"
                      >
                        ⭐ {lang === "th" ? "คลิกสมัคร VIP เพื่อปลดล็อก" : "Unlock VIP Access"}
                      </button>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        ) : (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
              <div>
                <button 
                  onClick={onBack}
                  className="mb-4 flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-sm text-slate-300 hover:bg-slate-800 transition shadow-md"
                >
                  ← {lang === "th" ? "กลับสู่หน้าหลัก Portfolio" : "Back to Home"}
                </button>
                
                {/* หัวข้อสไตล์เดียวกับหน้าแรกที่คุณต้องการ */}
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🔥</span>
                  <h1 className="text-2xl font-extrabold text-white">
                    {lang === "th" ? "หุ้นเด่นยอดฮิต & ตลาดสหรัฐ" : "Trending US Stocks"}
                  </h1>
                </div>
                <p className="text-slate-400 text-sm mt-1">
                  {lang === "th" ? "ติดตามความเคลื่อนไหวราคาแบบเรียลไทม์ พร้อมวิเคราะห์เชิงลึกระดับโปร" : "Track real-time price movements and advanced analysis."}
                </p>
              </div>

              <div className="w-full md:w-72">
                <input
                  type="text"
                  placeholder={lang === "th" ? "🔍 ค้นหาชื่อย่อหุ้น..." : "🔍 Search symbol..."}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl bg-slate-900 border border-slate-800 px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none transition"
                />
              </div>
            </div>

            {/* การ์ดหุ้นยอดฮิตที่ดีไซน์ตรงตามเรฟที่คุณต้องการเป๊ะๆ */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {filteredStocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => setSelectedStock(stock)}
                  className="cursor-pointer rounded-2xl border border-slate-800 bg-[#0c101d] p-5 transition hover:border-indigo-500 hover:scale-[1.02] shadow-xl flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">{stock.symbol}</span>
                      <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 text-[10px] font-bold">US</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate max-w-[120px]">{stock.name}</p>
                  </div>
                  <div className={`rounded-xl px-3.5 py-2.5 text-right ${stock.isUp ? 'bg-emerald-600/20 text-emerald-400' : 'bg-rose-600/20 text-rose-400'}`}>
                    <div className="text-base font-bold">${stock.price}</div>
                    <div className="text-[11px] font-semibold">
                      {lang === "th" ? "หลัง: " : "Chg: "}{stock.change}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}