"use client";

import { Language } from "@/lib/i18n";

interface MarketPreviewProps {
  lang: Language;
  onOpenUSMarket: (symbol?: string) => void;
}

export default function MarketPreview({ lang, onOpenUSMarket }: MarketPreviewProps) {
  const watchlist = [
    { symbol: "AEHR", name: "Aehr Test Sys", market: "US", price: "76.32", change: "-0.42%", isUp: false },
    { symbol: "LRCX", name: "Lam Research", market: "US", price: "305.21", change: "+0.09%", isUp: true },
    { symbol: "TSLA", name: "Tesla Inc", market: "US", price: "313.03", change: "-0.53%", isUp: false },
    { symbol: "ONDS", name: "Ondas Holdings", market: "US", price: "7.80", change: "+0.39%", isUp: true },
  ];

  return (
    <section className="bg-slate-950 py-16">
      <div className="mx-auto max-w-7xl px-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold text-white">
              {lang === "th" ? "🔥 หุ้นเด่นยอดฮิต & ตลาดสหรัฐ" : "🔥 Market Watchlist & US Stocks"}
            </h2>
            <p className="mt-2 text-slate-400">
              {lang === "th" ? "ติดตามความเคลื่อนไหวราคาแบบเรียลไทม์" : "Track real-time price movements instantly."}
            </p>
          </div>

          <button
            onClick={() => onOpenUSMarket()}
            className="self-start md:self-auto rounded-xl bg-indigo-600/20 border border-indigo-500/30 px-4 py-2.5 text-sm font-semibold text-indigo-400 hover:bg-indigo-600 hover:text-white transition shadow-lg shadow-indigo-900/20"
          >
            {lang === "th" ? "📊 ดูตลาดหุ้นสหรัฐทั้งหมด →" : "📊 View All US Markets →"}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {watchlist.map((stock) => (
            <div 
              key={stock.symbol}
              onClick={() => onOpenUSMarket(stock.symbol)}
              className="cursor-pointer rounded-2xl border border-slate-800 bg-slate-900/80 p-5 transition hover:border-indigo-500 hover:scale-[1.02]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-extrabold text-white">{stock.symbol}</span>
                    <span className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">{stock.market}</span>
                  </div>
                  <p className="text-xs text-slate-400 truncate max-w-[120px] mt-0.5">{stock.name}</p>
                </div>

                <div className={`rounded-xl px-3 py-2 text-right ${stock.isUp ? 'bg-emerald-600' : 'bg-rose-600'}`}>
                  <div className="text-lg font-bold text-white">{stock.price}</div>
                  <div className="text-[11px] font-medium text-white/90">{lang === "th" ? "หลัง: " : "Chg: "}{stock.change}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}