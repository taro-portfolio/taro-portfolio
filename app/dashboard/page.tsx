"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import AddStockModal from "@/components/portfolio/AddStockModal";
import CashModal from "@/components/portfolio/CashModal";
import USMarketView from "@/components/USMarketView"; 
import { getStockPrice } from "@/lib/stock";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { translations, Language } from "@/lib/i18n";

export default function Dashboard() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshingPrices, setRefreshingPrices] = useState(false);
  const [lastUpdatedTime, setLastUpdatedTime] = useState<string>("");

  const [openModal, setOpenModal] = useState(false);
  const [modalMode, setModalMode] = useState<"BUY" | "SELL">("BUY");
  const [editStock, setEditStock] = useState<any>(null);
  const [openCashModal, setOpenCashModal] = useState(false);
  const [rawStocks, setRawStocks] = useState<any[]>([]);
  const [cash, setCash] = useState(0);
  const [cashCurrency, setCashCurrency] = useState<"THB" | "USD">("THB");
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [currency, setCurrency] = useState<"THB" | "USD">("THB");
  const [exchangeRate, setExchangeRate] = useState(35);

  const [selectedStockSymbol, setSelectedStockSymbol] = useState<string | null>(null);

  const [usWatchlist, setUsWatchlist] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("taro_us_watchlist");
      if (saved) {
        try { return JSON.parse(saved); } catch (e) { /* ignore */ }
      }
    }
    return ["TSLA", "AAPL", "NVDA", "MSFT", "AMZN", "GOOGL"];
  });
  const [newUsInput, setNewUsInput] = useState("");
  const [usPrices, setUsPrices] = useState<Record<string, { price: number; change: string; isUp: boolean }>>({});

  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("taro_us_watchlist", JSON.stringify(usWatchlist));
    }
  }, [usWatchlist]);

  function getTradingViewStyleLogo(symbol: string) {
    const upper = symbol.toUpperCase().trim();
    const customDomains: Record<string, string> = {
      TSLA: "tesla.com",
      AAPL: "apple.com",
      NVDA: "nvidia.com",
      MSFT: "microsoft.com",
      GOOGL: "google.com",
      AMZN: "amazon.com",
      META: "meta.com",
      NFLX: "netflix.com",
      AMD: "amd.com",
      INTC: "intel.com",
      COIN: "coinbase.com",
    };
    const domain = customDomains[upper] || `${upper.toLowerCase()}.com`;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
  }

  function getStockLogoColor(symbol: string) {
    const upper = symbol.toUpperCase();
    if (upper.includes("NVDA")) return "#76B900"; 
    if (upper.includes("TSLA")) return "#E82127";  
    if (upper.includes("AAPL")) return "#A2AAAD";  
    if (upper.includes("MSFT")) return "#00A4EF"; 
    
    const fallbackColors = ["#3B82F6", "#10B981", "#F59E0B", "#EC4899", "#8B5CF6", "#14B8A6", "#F97316"];
    let hash = 0;
    for (let i = 0; i < upper.length; i++) {
      hash = upper.charCodeAt(i) + ((hash << 5) - hash);
    }
    return fallbackColors[Math.abs(hash) % fallbackColors.length];
  }

  function getStockStrategy(profitPercent: number, lang: Language) {
    if (profitPercent <= -25) {
      return { action: lang === "th" ? "🚨 ซื้อเพิ่มอีก 25%" : "🚨 Buy +25%", color: "bg-red-700 text-white border-red-800" };
    } else if (profitPercent <= -15) {
      return { action: lang === "th" ? "⚠️ ซื้อเพิ่มอีก 10%" : "⚠️ Buy +10%", color: "bg-amber-600 text-white border-amber-700" };
    } else if (profitPercent <= -5) {
      return { action: lang === "th" ? "⏸️ ไม่ทำอะไร" : "⏸️ Hold (Wait)", color: "bg-slate-500 text-white border-slate-600" };
    } else if (profitPercent < 15) {
      return { action: lang === "th" ? "🛡️ ถือต่อไป" : "🛡️ Hold", color: "bg-blue-600 text-white border-blue-700" };
    } else if (profitPercent < 25) {
      return { action: lang === "th" ? "🛡️ ถือต่อไปต่อเนื่อง" : "🛡️ Hold Strong", color: "bg-indigo-600 text-white border-indigo-700" };
    } else if (profitPercent < 35) {
      return { action: lang === "th" ? "💰 ขาย 10%" : "💰 Sell 10%", color: "bg-emerald-500 text-white border-emerald-600" };
    } else if (profitPercent < 45) {
      return { action: lang === "th" ? "💰 ขาย 20%" : "💰 Sell 20%", color: "bg-emerald-600 text-white border-emerald-700" };
    } else if (profitPercent < 60) {
      return { action: lang === "th" ? "💵 ขาย 30%" : "💵 Sell 30%", color: "bg-green-600 text-white border-green-700" };
    } else if (profitPercent < 100) {
      return { action: lang === "th" ? "💵 ขาย 40%" : "💵 Sell 40%", color: "bg-teal-600 text-white border-teal-700" };
    } else {
      return { action: lang === "th" ? "🚀 ขายทั้งหมด (Take Profit)" : "🚀 Sell All", color: "bg-purple-700 text-white border-purple-800" };
    }
  }

  async function loadExchangeRate() {
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data && data.rates && data.rates.THB) {
        setExchangeRate(Number(data.rates.THB));
      }
    } catch (err) {
      console.error("Error loading exchange rate:", err);
    }
  }

  const fetchWatchlistPrices = useCallback(async (usList: string[]) => {
    const usResults: Record<string, { price: number; change: string; isUp: boolean }> = {};
    for (const sym of usList) {
      const price = await getStockPrice(sym);
      const changeVal = (Math.random() * 2 - 1).toFixed(2);
      usResults[sym] = {
        price: price > 0 ? price : 100.00,
        change: `${Number(changeVal) >= 0 ? "+" : ""}${changeVal}%`,
        isUp: Number(changeVal) >= 0,
      };
    }
    setUsPrices(usResults);
  }, []);

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
    await fetchWatchlistPrices(usWatchlist);

    setLastUpdatedTime(
      new Date().toLocaleTimeString(lang === "th" ? "th-TH" : "en-US", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      })
    );
    setRefreshingPrices(false);
  }, [lang, usWatchlist, fetchWatchlistPrices]);

  const loadPortfolio = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("portfolio")
      .select("*")
      .eq("user_id", userId)
      .order("buy_date", { ascending: true });

    if (error) {
      console.error("Error loading portfolio message:", error.message || error);
      return [];
    }

    const portfolioList = data ?? [];
    setRawStocks(portfolioList);
    await fetchPrices(portfolioList);
    return portfolioList;
  }, [fetchPrices]);

  const loadCash = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("cash")
      .select("amount, currency")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) {
      setCash(0);
      setCashCurrency("THB");
      return;
    }

    const cashRow = data[0];
    setCash(Number(cashRow.amount || 0));
    setCashCurrency((cashRow.currency ?? "THB") as "THB" | "USD");
  }, []);

  const initDashboard = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      router.replace("/login");
      return;
    }

    setEmail(user.email ?? "");
    await Promise.all([
      loadExchangeRate(),
      loadPortfolio(user.id),
      loadCash(user.id),
      fetchWatchlistPrices(usWatchlist),
    ]);
    setLoading(false);
  }, [router, loadPortfolio, loadCash, fetchWatchlistPrices, usWatchlist]);

  useEffect(() => {
    initDashboard();
  }, [initDashboard]);

  async function handleAdminAccess() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert("กรุณาเข้าสู่ระบบก่อน");
      router.push("/login");
      return;
    }

    const adminEmails = ["aflanos001@gmail.com", "admin@taro.com"]; 

    if (adminEmails.includes(user.email ?? "")) {
      router.push("/admin/login");
    } else {
      alert("❌ สำหรับบัญชีแอดมินเท่านั้น VIP ท่านอื่นไม่สามารถเข้าถึงได้");
    }
  }

  async function handleAddUsWatchlist(e: React.FormEvent) {
    e.preventDefault();
    if (!newUsInput.trim()) return;
    const sym = newUsInput.toUpperCase().trim();
    if (usWatchlist.includes(sym)) {
      alert(lang === "th" ? "มีหุ้นนี้ในรายการติดตามแล้ว" : "Stock already in watchlist");
      return;
    }
    const updated = [...usWatchlist, sym];
    setUsWatchlist(updated);
    setNewUsInput("");
    await fetchWatchlistPrices(updated);
  }

  function handleRemoveUsWatchlist(symToRemove: string, e: React.MouseEvent) {
    e.stopPropagation();
    const updated = usWatchlist.filter(s => s !== symToRemove);
    setUsWatchlist(updated);
  }

  async function handleResetAllData() {
    const confirmMessage = lang === "th" 
      ? "⚠️ คำเตือน: การกระทำนี้จะลบประวัติการซื้อขายและข้อมูลเงินสดทั้งหมดของคุณอย่างถาวร! หากต้องการยืนยัน โปรดพิมพ์คำว่า DELETE"
      : "⚠️ Warning: This will permanently delete all your transaction history and cash data! Type DELETE to confirm.";
    
    const userInput = prompt(confirmMessage);
    if (userInput !== "DELETE") {
      alert(lang === "th" ? "ยกเลิกการล้างข้อมูล (พิมพ์ไม่ถูกต้อง)" : "Cancelled (Incorrect text typed)");
      return;
    }

    const doubleCheck = window.confirm(lang === "th" ? "คุณแน่ใจจริงๆ หรือไม่ที่จะล้างข้อมูลทั้งหมด?" : "Are you absolutely sure you want to reset all data?");
    if (!doubleCheck) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from("portfolio").delete().eq("user_id", user.id);
      await supabase.from("cash").delete().eq("user_id", user.id);

      alert(lang === "th" ? "ล้างข้อมูลทั้งหมดเรียบร้อยแล้ว" : "All data has been reset successfully.");
      
      await loadPortfolio(user.id);
      await loadCash(user.id);
    } catch (err) {
      console.error(err);
      alert("Error resetting data");
    } finally {
      setLoading(false);
    }
  }

  function currencySymbol(curr: "THB" | "USD") {
    return curr === "THB" ? "฿" : "$";
  }

  const rate = exchangeRate || 35;

  let totalSpentTHB = 0;
  let totalReceivedTHB = 0;

  const stockNetMap: Record<string, { symbol: string; market: string; quantity: number; totalCost: number; fee: number; buy_date: string }> = {};

  rawStocks.forEach((item) => {
    const symbol = item.symbol;
    const qty = Number(item.quantity || 0);
    const price = Number(item.buy_price || 0);
    const fee = Number(item.fee || 0);
    const isSell = item.type === "SELL";
    const isUS = item.market === "US"; 

    const multiplier = isUS ? rate : 1; 

    if (isSell) {
      totalReceivedTHB += ((price * qty) - fee) * multiplier;
    } else {
      totalSpentTHB += ((price * qty) + fee) * multiplier;
    }

    if (!stockNetMap[symbol]) {
      stockNetMap[symbol] = { symbol, market: item.market, quantity: 0, totalCost: 0, fee: 0, buy_date: item.buy_date };
    }

    if (isSell) {
      stockNetMap[symbol].quantity -= qty;
      if (stockNetMap[symbol].quantity > 0 && stockNetMap[symbol].quantity + qty > 0) {
        const avgCost = stockNetMap[symbol].totalCost / (stockNetMap[symbol].quantity + qty);
        stockNetMap[symbol].totalCost -= (avgCost * qty);
      } else {
        stockNetMap[symbol].totalCost = 0;
      }
    } else {
      stockNetMap[symbol].quantity += qty;
      stockNetMap[symbol].totalCost += ((price * qty) + fee) * multiplier;
      stockNetMap[symbol].fee += fee;
      stockNetMap[symbol].buy_date = item.buy_date;
    }
  });

  const aggregatedStocks = Object.values(stockNetMap).filter((stock) => stock.quantity > 0).map((stock) => {
    const avgBuyPrice = stock.quantity > 0 ? stock.totalCost / stock.quantity : 0;
    return {
      ...stock,
      buy_price: avgBuyPrice, 
    };
  });

  const initialCashTHB = cashCurrency === "USD" ? (cash * rate) : cash;
  const netCashTHB = initialCashTHB - totalSpentTHB + totalReceivedTHB;

  const displayInUSD = currency === "USD";

  const mainCash = displayInUSD ? (netCashTHB / rate) : netCashTHB;
  const altCash = displayInUSD ? netCashTHB : (netCashTHB / rate);

  let totalStockCostTHB = 0;
  let currentValueTHB = 0;

  aggregatedStocks.forEach((stock) => {
    const apiPrice = prices[stock.symbol] || 0;
    const curPrice = apiPrice > 0 ? apiPrice : (stock.market === "US" ? stock.buy_price / rate : stock.buy_price);
    const isUS = stock.market === "US";
    const stockCurPriceTHB = isUS ? (curPrice * rate) : curPrice;

    totalStockCostTHB += stock.totalCost;
    currentValueTHB += stockCurPriceTHB * stock.quantity;
  });

  const totalPortfolioValue = currentValueTHB + mainCash; 
  const profitLossTHB = currentValueTHB - totalStockCostTHB;

  const currentValue = displayInUSD ? (currentValueTHB / rate) : currentValueTHB;
  const profitLoss = displayInUSD ? (profitLossTHB / rate) : profitLossTHB;
  const altCurrentValue = displayInUSD ? currentValueTHB : (currentValueTHB / rate);
  const altProfitLoss = displayInUSD ? profitLossTHB : (profitLossTHB / rate);

  const chartData = [
    ...aggregatedStocks.map((stock) => {
      const isUS = stock.market === "US";
      const apiPrice = prices[stock.symbol] || 0;
      const curPrice = apiPrice > 0 ? apiPrice : (isUS ? stock.buy_price / rate : stock.buy_price);
      const stockValTHB = (isUS ? curPrice * rate : curPrice) * stock.quantity;
      const val = displayInUSD ? (stockValTHB / rate) : stockValTHB;
      const percentage = (totalPortfolioValue > 0 && !isNaN(val)) ? (val / (displayInUSD ? (totalPortfolioValue) : totalPortfolioValue)) * 100 : 0;

      return {
        name: `${stock.symbol} (${Math.max(0, percentage).toFixed(1)}%)`,
        value: Number(val.toFixed(2)),
        color: getStockLogoColor(stock.symbol),
      };
    }),
    ...(mainCash > 0
      ? [
          {
            name: `${t.cashLabel} (${totalPortfolioValue > 0 ? Math.max(0, (mainCash / totalPortfolioValue) * 100).toFixed(1) : 0}%)`,
            value: Number(mainCash.toFixed(2)),
            color: "#065f46", 
          },
        ]
      : []),
  ].filter((item) => item.value > 0);

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

  if (selectedStockSymbol) {
    return (
      <>
        <Navbar lang={lang} setLang={setLang} />
        <USMarketView
          lang={lang}
          initialSymbol={selectedStockSymbol}
          onBack={() => setSelectedStockSymbol(null)}
        />
      </>
    );
  }

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        
        {/* 🌟 ป้ายประกาศสุดเด่น: พื้นหลังนีออนม่วง-ทองเข้ม, ขอบเรืองแสงสว่าง, ตัวหนังสือใหญ่สะใจ & วิ่งไวขึ้น */}
        <div className="mx-auto max-w-7xl px-4 pt-6">
          <div style={{ 
            width: '100%', 
            background: 'linear-gradient(90deg, #3b0764, #581c87, #4c1d95, #3b0764)', 
            border: '2px solid rgba(250, 204, 21, 0.7)', 
            boxShadow: '0 0 20px rgba(168, 85, 247, 0.5), inset 0 0 15px rgba(250, 204, 21, 0.2)',
            borderRadius: '16px', 
            padding: '14px 20px', 
            overflow: 'hidden', 
            position: 'relative' 
          }}>
            <div className="marquee-container">
              
              {/* ชุดข้อความที่ 1 (ตัวหนังสือใหญ่, สีเหลืองทองนีออนสดใส, มีเงาเรืองแสง) */}
              <div className="marquee-content">
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#fef08a', textShadow: '0 0 10px rgba(234, 179, 8, 0.8), 0 2px 4px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🔥</span> 
                  {lang === "th" 
                    ? "ขอเชิญท่านสมาชิก แนะนำเพื่อนมาทดลองใช้งาน ระบบ TARO Portfolio เชิญเพื่อนใช้งาน 10 คน รับสิทธิ์เป็นสมาชิก VIP 1 เดือนทันที! 🚀" 
                    : "🎉 Invite your friends to try TARO Portfolio! Refer 10 friends and get 1 month of VIP membership for free! 🚀"}
                </span>
              </div>

              {/* ชุดข้อความที่ 2 (สำเนาต่อท้ายเพื่อให้วนลูปแบบไร้รอยต่อ) */}
              <div className="marquee-content">
                <span style={{ fontSize: '18px', fontWeight: '900', color: '#fef08a', textShadow: '0 0 10px rgba(234, 179, 8, 0.8), 0 2px 4px rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '22px' }}>🔥</span> 
                  {lang === "th" 
                    ? "ขอเชิญท่านสมาชิก แนะนำเพื่อนมาทดลองใช้งาน ระบบ TARO Portfolio เชิญเพื่อนใช้งาน 10 คน รับสิทธิ์เป็นสมาชิก VIP 1 เดือนทันที! 🚀" 
                    : "🎉 Invite your friends to try TARO Portfolio! Refer 10 friends and get 1 month of VIP membership for free! 🚀"}
                </span>
              </div>

            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-8 md:p-10">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white">{t.welcome}</h1>
              <p className="mt-1 text-sm text-slate-400">{email}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => fetchPrices(rawStocks)}
                disabled={refreshingPrices}
                className="flex items-center gap-2 rounded-xl bg-slate-900 border border-slate-800 px-4 py-2 text-xs md:text-sm font-medium text-slate-300 hover:bg-slate-800 transition cursor-pointer"
              >
                <span className={refreshingPrices ? "animate-spin" : ""}>🔄</span>
                {refreshingPrices ? t.updating : t.refreshPrices}
              </button>

              <div className="flex overflow-hidden rounded-xl border border-slate-800 bg-slate-900">
                <button
                  onClick={() => setCurrency("THB")}
                  className={`px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    currency === "THB" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  THB (฿)
                </button>
                <button
                  onClick={() => setCurrency("USD")}
                  className={`px-3 py-2 text-xs font-bold transition cursor-pointer ${
                    currency === "USD" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                  }`}
                >
                  USD ($)
                </button>
              </div>
            </div>
          </div>

          <div className="mt-6 md:mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            <div className="flex flex-col gap-4 md:gap-6 justify-between">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-950/60 via-slate-900/80 to-slate-900 p-5 md:p-6 border border-emerald-500/35 shadow-xl flex-1 flex flex-col justify-center">
                <p className="text-xs md:text-sm font-medium text-emerald-400">{t.cash}</p>
                <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-white">
                  {currencySymbol(currency)}{mainCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="mt-1 text-xs text-slate-400">
                  ≈ {currencySymbol(currency === "THB" ? "USD" : "THB")}{altCash.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/60 p-5 md:p-6 border border-slate-800/80 shadow-xl flex-1 flex flex-col justify-center">
                <p className="text-xs md:text-sm font-medium text-slate-400">{t.portfolioValue}</p>
                <h2 className="mt-2 text-2xl md:text-3xl font-extrabold text-white">
                  {currencySymbol(currency)}{currentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  ≈ {currencySymbol(currency === "THB" ? "USD" : "THB")}{altCurrentValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-900/60 p-5 md:p-6 border border-slate-800/80 shadow-xl flex-1 flex flex-col justify-center">
                <p className="text-xs md:text-sm font-medium text-slate-400">{t.profitLoss}</p>
                <h2 className={`mt-2 text-2xl md:text-3xl font-extrabold ${profitLoss >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {currencySymbol(currency)}{profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  ≈ {currencySymbol(currency === "THB" ? "USD" : "THB")}{altProfitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* 🌟 ส่วนกราฟ Asset Allocation */}
            <div className="rounded-2xl bg-slate-900/60 p-5 md:p-8 border border-slate-800/80 shadow-xl flex flex-col justify-between">
              <h2 className="mb-4 text-xl md:text-2xl font-bold text-white">{t.assetAllocation}</h2>
              {chartData.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <p className="text-center text-slate-500 py-12 text-sm">{t.noChartData}</p>
                </div>
              ) : (
                <>
                  <div className="hidden md:block h-[350px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={chartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={90}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#f8fafc" }}
                          formatter={(val: any) => [
                            `${currencySymbol(currency)}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                            t.valueLabel,
                          ]}
                        />
                        <Legend wrapperStyle={{ color: "#cbd5e1" }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="block md:hidden flex flex-col items-center">
                    <div className="h-52 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={chartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={65}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "0.75rem", color: "#f8fafc" }}
                            formatter={(val: any) => [
                              `${currencySymbol(currency)}${Number(val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
                              t.valueLabel,
                            ]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 w-full px-2">
                      {chartData.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-[11px] text-slate-300 truncate">{entry.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

          </div>

          <div className="mt-6 md:mt-8 flex flex-wrap gap-3 md:gap-4">
            <button
              onClick={() => {
                setModalMode("BUY");
                setEditStock(null);
                setOpenModal(true);
              }}
              className="rounded-xl bg-indigo-600 px-6 py-2.5 font-bold text-white shadow-lg hover:bg-indigo-500 active:scale-95 transition flex items-center gap-2 cursor-pointer text-sm"
            >
              <span>➕</span> {lang === "th" ? "ซื้อหุ้นเข้า" : "Add Buy"}
            </button>

            <button
              onClick={() => {
                setModalMode("SELL");
                setEditStock(null);
                setOpenModal(true);
              }}
              className="rounded-xl bg-rose-600 px-6 py-2.5 font-bold text-white shadow-lg hover:bg-rose-500 active:scale-95 transition flex items-center gap-2 cursor-pointer text-sm"
            >
              <span>➖</span> {lang === "th" ? "ขายหุ้นออก" : "Add Sell"}
            </button>

            <button
              onClick={() => setOpenCashModal(true)}
              className="rounded-xl bg-slate-900 border border-slate-800 px-6 py-2.5 font-bold text-slate-200 hover:bg-slate-800 active:scale-95 transition flex items-center gap-2 cursor-pointer text-sm"
            >
              <span>💵</span> {t.editCash}
            </button>
          </div>

          <div className="mt-6 md:mt-8 rounded-2xl bg-slate-900/60 p-5 md:p-8 border border-slate-800/80 shadow-xl">
            <h2 className="mb-4 md:mb-6 text-xl md:text-2xl font-bold text-white">{t.stockList}</h2>

            {aggregatedStocks.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-8 md:p-12 text-center text-slate-500 text-sm">
                {t.noStockData}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1000px] w-full border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-xs text-slate-400 uppercase tracking-wider">
                      <th className="px-4 py-3 text-left font-bold">{t.ticker}</th>
                      <th className="px-4 py-3 text-left font-bold">{t.market}</th>
                      <th className="px-4 py-3 text-right font-bold">{t.quantity}</th>
                      <th className="px-4 py-3 text-right font-bold">สัดส่วนพอร์ต (%)</th>
                      <th className="px-4 py-3 text-right font-bold">{t.avgBuyPrice} ({currencySymbol(currency)})</th>
                      <th className="px-4 py-3 text-right font-bold">{t.currentPrice} ({currencySymbol(currency)})</th>
                      <th className="px-4 py-3 text-right font-bold">{t.currentValue} ({currencySymbol(currency)})</th>
                      <th className="px-4 py-3 text-right font-bold">{t.profitLoss} ({currencySymbol(currency)})</th>
                      <th className="px-4 py-3 text-right font-bold">%</th>
                      <th className="px-4 py-3 text-center font-bold">{lang === "th" ? "สถานะ / กลยุทธ์" : "Strategy"}</th>
                      <th className="px-4 py-3 text-center font-bold">{t.action}</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/50 text-sm">
                    {aggregatedStocks.map((stock) => {
                      const isUS = stock.market === "US";
                      const quantity = Number(stock.quantity || 0);
                      const rawBuyPriceUSD = isUS ? (stock.buy_price / rate) : stock.buy_price;
                      const apiPrice = prices[stock.symbol] || 0;
                      const rawCurrentPriceUSD = apiPrice > 0 ? apiPrice : rawBuyPriceUSD;

                      const buyPrice = displayInUSD ? rawBuyPriceUSD : (rawBuyPriceUSD * rate);
                      const currentPrice = displayInUSD ? rawCurrentPriceUSD : (rawCurrentPriceUSD * rate);

                      const totalStockCost = buyPrice * quantity;
                      const totalStockValue = currentPrice * quantity;
                      const stockProfitLoss = totalStockValue - totalStockCost;
                      const profitPercent = totalStockCost > 0 ? (stockProfitLoss / totalStockCost) * 100 : 0;
                      const portfolioShare = totalPortfolioValue > 0 ? (totalStockValue / totalPortfolioValue) * 100 : 0;

                      const isPositive = stockProfitLoss >= 0;
                      const strategy = getStockStrategy(profitPercent, lang);

                      return (
                        <tr key={stock.symbol} className="hover:bg-slate-800/40 transition">
                          <td 
                            onClick={() => setSelectedStockSymbol(stock.symbol)}
                            className="px-4 py-4 font-extrabold text-white cursor-pointer hover:text-indigo-400 transition flex items-center gap-2"
                          >
                            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: getStockLogoColor(stock.symbol) }}></span>
                            {stock.symbol} <span className="text-xs text-indigo-400">📈</span>
                          </td>
                          <td className="px-4 py-4 text-slate-400">
                            <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-bold text-slate-300">
                              {stock.market}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-right font-semibold text-slate-200">{quantity.toLocaleString()}</td>
                          <td className="px-4 py-4 text-right font-extrabold text-indigo-400">{portfolioShare.toFixed(1)}%</td>
                          <td className="px-4 py-4 text-right text-slate-300">{buyPrice.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right text-slate-300">{currentPrice.toFixed(2)}</td>
                          <td className="px-4 py-4 text-right font-semibold text-white">{totalStockValue.toFixed(2)}</td>
                          <td className={`px-4 py-4 text-right font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{stockProfitLoss.toFixed(2)}
                          </td>
                          <td className={`px-4 py-4 text-right font-bold ${isPositive ? "text-emerald-400" : "text-rose-400"}`}>
                            {isPositive ? "+" : ""}{profitPercent.toFixed(2)}%
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`inline-block rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-md border ${strategy.color}`}>
                              {strategy.action}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={() => {
                                setModalMode("SELL");
                                setEditStock({ symbol: stock.symbol, market: stock.market, quantity: stock.quantity, buy_price: rawCurrentPriceUSD });
                                setOpenModal(true);
                              }}
                              className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold text-rose-400 hover:bg-rose-500/20 transition cursor-pointer"
                            >
                              {lang === "th" ? "ขายออก" : "Sell"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="mt-6 md:mt-8 rounded-2xl bg-[#090d16] p-6 text-white shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl">⭐</span>
                  <h2 className="text-xl md:text-2xl font-extrabold text-white">
                    {lang === "th" ? "หุ้นที่ฉันติดตาม หุ้นสหรัฐ 🇺🇸" : "My Watchlist - US Stocks 🇺🇸"}
                  </h2>
                </div>
                <p className="text-slate-400 text-xs md:text-sm mt-1">
                  {lang === "th" ? "เพิ่มและติดตามราคาหุ้นสหรัฐที่คุณสนใจแบบเรียลไทม์" : "Track US stocks in real-time."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <form onSubmit={handleAddUsWatchlist} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsInput}
                    onChange={(e) => setNewUsInput(e.target.value)}
                    placeholder={lang === "th" ? "พิมพ์ชื่อหุ้นสหรัฐ (เช่น AAPL)" : "Enter US Symbol (e.g. AAPL)"}
                    className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs md:text-sm text-white uppercase focus:border-indigo-500 focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="rounded-xl bg-indigo-600 px-4 py-2 text-xs md:text-sm font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-md"
                  >
                    {lang === "th" ? "+ เพิ่มหุ้น" : "+ Add"}
                  </button>
                </form>
              </div>
            </div>

            {usWatchlist.length === 0 ? (
              <p className="text-slate-500 text-center py-6 text-sm">
                {lang === "th" ? "ยังไม่มีหุ้นสหรัฐในรายการติดตาม" : "No US watchlist stocks."}
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {usWatchlist.map((sym) => {
                  const data = usPrices[sym] || { price: 0, change: "+0.00%", isUp: true };
                  const logoUrl = getTradingViewStyleLogo(sym);

                  return (
                    <div
                      key={sym}
                      onClick={() => setSelectedStockSymbol(sym)}
                      className="relative cursor-pointer rounded-2xl border border-slate-800 bg-[#0c101d] p-4 transition hover:border-indigo-500 hover:scale-[1.02] shadow-lg flex flex-col justify-between"
                    >
                      <button
                        onClick={(e) => handleRemoveUsWatchlist(sym, e)}
                        className="absolute top-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-slate-400 hover:bg-rose-600 hover:text-white transition text-xs font-bold shadow"
                        title="Remove"
                      >
                        ✕
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white p-1.5 overflow-hidden border border-slate-700 shrink-0 shadow">
                          <img
                            src={logoUrl}
                            alt={sym}
                            className="h-full w-full object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                              if (target.parentElement) {
                                target.parentElement.innerText = sym.slice(0, 3);
                                target.parentElement.style.color = "#ffffff";
                                target.parentElement.style.fontWeight = "bold";
                                target.parentElement.style.backgroundColor = getStockLogoColor(sym);
                              }
                            }}
                          />
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-base font-extrabold text-white">{sym}</span>
                            <span className="rounded bg-slate-800 text-slate-300 px-1.5 py-0.5 text-[9px] font-bold">US 🇺🇸</span>
                          </div>
                          <p className="text-[11px] text-slate-400 font-medium">US Stock</p>
                        </div>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-slate-800/80 pt-3">
                        <span className="text-xs text-slate-400">{lang === "th" ? "ราคาปัจจุบัน" : "Price"}</span>
                        <div className="text-right">
                          <span className="text-sm font-bold text-white">${data.price.toFixed(2)}</span>
                          <span className={`ml-2 text-xs font-semibold ${data.isUp ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {data.change}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleAdminAccess}
              className="text-[9px] text-slate-600 hover:text-slate-400 tracking-widest uppercase transition opacity-40 hover:opacity-100 cursor-pointer"
            >
              AD TARO
            </button>
          </div>

          <div className="mt-2 mb-8 flex flex-col items-center justify-center border-t border-slate-800/80 pt-8">
            <button
              onClick={handleResetAllData}
              className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 px-6 py-3 text-xs md:text-sm font-bold text-rose-400 hover:bg-rose-500/20 active:scale-95 transition cursor-pointer shadow-lg"
            >
              <span>🗑️</span>
              {lang === "th" ? "ล้างข้อมูลพอร์ตและเงินสดทั้งหมด (Reset Data)" : "Reset All Portfolio & Cash Data"}
            </button>
            <p className="mt-2 text-xs text-slate-500">
              {lang === "th" ? "ใช้สำหรับล้างค่าทดลองเล่น โดยต้องพิมพ์คำว่า DELETE เพื่อยืนยัน" : "Used for clearing sandbox data. Requires typing DELETE to confirm."}
            </p>
          </div>

        </div>
      </main>

      <AddStockModal
        open={openModal || !!editStock}
        onClose={() => {
          setOpenModal(false);
          setEditStock(null);
        }}
        onSuccess={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await loadPortfolio(user.id);
            await loadCash(user.id);
          }
        }}
        editStock={editStock}
        defaultType={modalMode}
        onClearEdit={() => setEditStock(null)}
      />

      <CashModal
        open={openCashModal}
        onClose={() => setOpenCashModal(false)}
        currentCash={cash}
        currentCurrency={cashCurrency}
        onSaved={async () => {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) loadCash(user.id);
        }}
      />

      {/* 🌟 ปรับเพิ่มความเร็วขึ้น (20s) และจัดกึ่งกลางวนลูปสมบูรณ์ */}
      <style jsx global>{`
        @keyframes ledScroll {
          0% { transform: translateX(25%); }
          100% { transform: translateX(-25%); }
        }
        .marquee-container {
          display: flex;
          width: max-content;
          animation: ledScroll 20s linear infinite;
        }
        .marquee-content {
          display: flex;
          align-items: center;
          margin-right: 100px;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}