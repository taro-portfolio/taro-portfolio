"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { translations, Language } from "@/lib/i18n";

export default function LiveStockNewsPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // State สำหรับระบบค้นหาและวิเคราะห์ข่าวหุ้นเรียลไทม์
  const [newsQuery, setNewsQuery] = useState("TSLA");
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // State สำหรับข่าวพิเศษด้านบน (ทรัมป์ & เฟด)
  const [macroNews, setMacroNews] = useState<any[]>([]);
  const [macroLoading, setMacroLoading] = useState(true);

  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  // ฟังก์ชันจัดกลุ่มสีตามประเภท Sentiment
  const getSentimentBadgeStyle = (text: string) => {
    const lower = text.toLowerCase();
    if (lower.includes("เชิงบวก") || lower.includes("positive") || lower.includes("strong") || lower.includes("bullish")) {
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"; // เขียว (ข่าวดี)
    } else if (lower.includes("เชิงลบ") || lower.includes("negative") || lower.includes("cautious") || lower.includes("ระมัดระวัง") || lower.includes("risk")) {
      return "bg-rose-500/20 text-rose-400 border border-rose-500/40"; // แดง (ข่าวร้าย)
    } else {
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40"; // เหลือง (กลางๆ ทั่วไป)
    }
  };

  // ฟังก์ชันดึงข่าวภาพรวมมหภาคแบบเรียลไทม์จาก API จริง
  const fetchMacroNews = useCallback(async (currentLang: string) => {
    setMacroLoading(true);
    try {
      const res = await fetch(`/api/news?lang=${currentLang}`);
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.news)) {
          // แปลงรูปแบบข่าวให้เข้ากับ UI มหภาคด้านบน
          const formattedMacro = data.news.slice(0, 2).map((item: any, idx: number) => ({
            headline: idx === 0 ? `🔥 ${item.title}` : `🏦 ${item.title}`,
            summary: item.summary || item.title,
            source: item.source || "Global Financial Desk",
            url: item.link,
            timeAgo: new Date(item.pubDate).toLocaleDateString() === new Date().toLocaleDateString() ? (currentLang === "th" ? "สดๆ ร้อนๆ วันนี้" : "Today") : (currentLang === "th" ? "เมื่อเร็วๆ นี้" : "Recent"),
            sentiment: idx === 0 ? (currentLang === "th" ? "เชิงระมัดระวัง (Cautious)" : "Cautious") : (currentLang === "th" ? "กลางๆ (Neutral)" : "Neutral")
          }));
          setMacroNews(formattedMacro);
        }
      }
    } catch (err) {
      console.error("Error fetching live macro news:", err);
    } finally {
      setMacroLoading(false);
    }
  }, []);

  // ฟังก์ชันดึงข่าวหุ้นรายตัวแบบเรียลไทม์จาก Backend API
  const fetchStockNews = useCallback(async (symbol: string, currentLang: string) => {
    if (!symbol.trim()) return;
    setNewsLoading(true);

    try {
      const cleanSymbol = symbol.toUpperCase().trim();
      const res = await fetch(`/api/news?symbol=${cleanSymbol}&lang=${currentLang}`);
      
      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      if (data && data.success && Array.isArray(data.news)) {
        setNewsList(data.news);
      } else {
        setNewsList([]);
      }
    } catch (err) {
      console.error("Error fetching live stock news:", err);
      setNewsList([]);
    } finally {
      setNewsLoading(false);
    }
  }, []);

  useEffect(() => {
    async function checkVipAccess() {
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

      // ป้องกันเข้มงวด: หากไม่พบข้อมูลโปรไฟล์หรือไม่ได้เป็น VIP ให้ดีดกลับไปหน้า /vip ทันที
      if (!profile || !profile.is_vip) {
        router.replace("/vip");
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
      fetchMacroNews(lang);
      fetchStockNews(newsQuery, lang);
    }
    checkVipAccess();
  }, [router, newsQuery, lang, fetchMacroNews, fetchStockNews]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-4 border-purple-500 border-t-transparent"></div>
          <h1 className="text-xl font-semibold text-slate-300">กำลังตรวจสอบสิทธิ์ VIP...</h1>
        </div>
      </main>
    );
  }

  return (
    <>
      <Navbar lang={lang} setLang={setLang} />

      <main className="min-h-screen bg-slate-950 text-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-8 md:p-10">
          
          <div className="space-y-8">
            
            {/* ข่าวภาพรวมมหภาค (เรียลไทม์สดๆ จาก API) */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <span>🇺🇸</span> {lang === "th" ? "เกาะติดประเด็นร้อน: ข่าวสารการเงินระดับโลก (Real-time Live)" : "Macro Focus: Global Live Financial News"}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                {lang === "th" ? "สรุปข่าวสารสำคัญที่มีผลกระทบต่อตลาดหุ้นและทิศทางการลงทุน" : "Key Market-Moving Headlines & Policy Impact"}
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mb-6">
                {lang === "th" ? "อัปเดตสถานการณ์สดจากหลากหลายสำนักข่าวต่างประเทศเพื่อประกอบการตัดสินใจพอร์ตของคุณ" : "Latest live updates compiled from global financial wires."}
              </p>

              {macroLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">กำลังดึงข้อมูลข่าวสารล่าสุด...</div>
              ) : macroNews.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">ไม่พบข้อมูลข่าวสารในช่วงเวลานี้</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {macroNews.map((macro, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="rounded bg-amber-500/10 text-amber-400 px-2.5 py-0.5 font-bold border border-amber-500/20">
                            {macro.source}
                          </span>
                          <span>{macro.timeAgo}</span>
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-white mb-2 leading-snug">
                          {macro.headline}
                        </h3>
                        <p className="text-xs text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80 line-clamp-3">
                          {macro.summary}
                        </p>
                      </div>
                      <div className="border-t border-slate-800/60 pt-3 text-xs font-bold flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-400">🤖 AI Impact:</span>
                          <span className={`px-2.5 py-1 rounded-lg ${getSentimentBadgeStyle(macro.sentiment)}`}>
                            {macro.sentiment}
                          </span>
                        </div>
                        <a 
                          href={macro.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-indigo-400 hover:underline text-xs"
                        >
                          อ่านต้นฉบับ ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ส่วนค้นหาและวิเคราะห์หุ้นรายตัว */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="bg-purple-600/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                    ⭐ VIP Exclusive Feature
                  </span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                  <span>⚡</span> Live Stock News Analysis with AI
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  {lang === "th" 
                    ? "พิมพ์ชื่อย่อหุ้น (เช่น TSLA, AAPL) เพื่อดึงข่าวสดและวิเคราะห์ผลกระทบด้วย AI แบบเรียลไทม์"
                    : "Enter a stock ticker (e.g., TSLA, AAPL) to instantly fetch breaking news and AI-driven sentiment impact analysis."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <input
                    type="text"
                    value={newsQuery}
                    onChange={(e) => setNewsQuery(e.target.value.toUpperCase())}
                    placeholder="Enter ticker (e.g. TSLA, AAPL)"
                    className="rounded-xl border border-indigo-500/50 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white uppercase focus:border-indigo-500 focus:outline-none shadow-lg w-64"
                  />
                </div>
                <button
                  onClick={() => fetchStockNews(newsQuery, lang)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <span>🔍</span> {lang === "th" ? "ค้นหาข่าว" : "Search News"}
                </button>
              </div>
            </div>

            {/* แสดงผลรายการข่าวหุ้นรายตัว */}
            {newsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-sm text-slate-400">
                  {lang === "th" ? `กำลังดึงข่าวสดและวิเคราะห์ AI สำหรับหุ้น ${newsQuery}...` : `Fetching live news and processing AI sentiment for ${newsQuery}...`}
                </p>
              </div>
            ) : newsList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-sm">
                {lang === "th" ? "ไม่พบข่าวล่าสุดสำหรับหุ้นตัวนี้ ลองค้นหาหุ้นตัวอื่น เช่น TSLA, NVDA, AAPL" : "No recent news found for this ticker. Try searching another symbol like TSLA, NVDA, AAPL."}
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {newsList.map((news, index) => (
                  <div 
                    key={index}
                    className="rounded-2xl border border-slate-800 bg-[#0c101d] p-6 shadow-xl flex flex-col justify-between transition hover:border-indigo-500/60"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                        <span className="rounded bg-indigo-500/10 text-indigo-400 px-2.5 py-1 font-bold border border-indigo-500/20">
                          {news.source || "Global News"}
                        </span>
                        <span>{news.timeAgo || "Live"}</span>
                      </div>

                      <a 
                        href={news.link || news.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-base md:text-lg font-bold text-white mb-3 leading-snug hover:text-indigo-400 transition block"
                      >
                        {news.title || news.headline} ↗
                      </a>

                      <p className="text-xs md:text-sm text-slate-300 mb-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <strong className="text-indigo-300">📝 {lang === "th" ? "สรุปใจความสำคัญ:" : "Summary:"}</strong> {news.summary || news.title}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-400">🤖 AI Sentiment Analysis:</span>
                        <span className={`px-2.5 py-1 rounded-lg ${getSentimentBadgeStyle(news.sentiment || "Neutral")}`}>
                          {news.sentiment || (lang === "th" ? "กลางๆ (Neutral)" : "Neutral")}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>
    </>
  );
}