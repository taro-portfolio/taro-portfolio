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

  // State ค้นหาหุ้นด้านล่าง
  const [newsQuery, setNewsQuery] = useState("TSLA");
  const [newsList, setNewsList] = useState<any[]>([]);
  const [newsLoading, setNewsLoading] = useState(false);

  // State ข้อมูลด้านบน (ซ้าย: ทรัมป์ | ขวา: เฟด)
  const [macroNews, setMacroNews] = useState<any[]>([]);
  const [macroLoading, setMacroLoading] = useState(true);

  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  const getSentimentBadgeStyle = (text: string) => {
    const lower = text ? text.toLowerCase() : "";
    if (lower.includes("เชิงบวก") || lower.includes("positive") || lower.includes("bullish")) {
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"; 
    } else if (lower.includes("เชิงลบ") || lower.includes("cautious") || lower.includes("ระมัดระวัง") || lower.includes("risk")) {
      return "bg-rose-500/20 text-rose-400 border border-rose-500/40"; 
    } else {
      return "bg-amber-500/20 text-amber-400 border border-amber-500/40"; 
    }
  };

  // ดึงข้อมูลทั้งหมดจาก API ตัวเดียวจบ
  const fetchAllNews = useCallback(async (symbol: string, currentLang: string) => {
    setMacroLoading(true);
    setNewsLoading(true);

    try {
      const cleanSymbol = symbol ? symbol.toUpperCase().trim() : "TSLA";
      const res = await fetch(`/api/news?symbol=${cleanSymbol}&lang=${currentLang}`);
      
      if (res.ok) {
        const data = await res.json();
        if (data && data.success) {
          // ส่วนบน (ซ้าย: ทรัมป์ / ขวา: เฟด)
          if (Array.isArray(data.macro)) {
            setMacroNews(data.macro);
          }
          // ส่วนล่าง (ข่าวหุ้นตามจริงที่ค้นหา)
          if (Array.isArray(data.news)) {
            setNewsList(data.news);
          }
        }
      }
    } catch (err) {
      console.error("Error fetching news:", err);
    } finally {
      setMacroLoading(false);
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

      if (!profile || !profile.is_vip) {
        router.replace("/vip");
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
      fetchAllNews(newsQuery, lang);
    }
    checkVipAccess();
  }, [router, lang, fetchAllNews]);

  const handleSearch = () => {
    fetchAllNews(newsQuery, lang);
  };

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
          
          <div className="space-y-10">
            
            {/* 🔴 ส่วนบน: ซ้ายข่าวทรัมป์/นโยบายภาษี | ขวาข่าวเฟดและดอกเบี้ย */}
            <div className="rounded-3xl border border-amber-500/30 bg-gradient-to-r from-amber-950/20 via-slate-900 to-slate-950 p-6 md:p-8 shadow-2xl">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider flex items-center gap-1.5">
                  <span>🇺🇸</span> {lang === "th" ? "เกาะติดประเด็นร้อน: ทรัมป์ & เฟด (Real-time Live)" : "Macro Focus: Trump & Fed Updates"}
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-black text-white mb-2">
                {lang === "th" ? "สรุปข่าวสารสำคัญที่มีผลกระทบต่อตลาดหุ้นและทิศทางการลงทุน" : "Key Market-Moving Headlines & Policy Impact"}
              </h2>
              <p className="text-xs md:text-sm text-slate-400 mb-6">
                {lang === "th" ? "อัปเดตสถานการณ์สดแยกตามประเด็นสำคัญ เพื่อประกอบการตัดสินใจพอร์ตของคุณ" : "Latest updates separated by key macro themes."}
              </p>

              {macroLoading ? (
                <div className="py-8 text-center text-xs text-slate-400">กำลังโหลดข้อมูลภาพรวม...</div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {macroNews.map((macro, idx) => (
                    <div key={idx} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-5 shadow-lg flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                          <span className="rounded bg-amber-500/10 text-amber-400 px-2.5 py-0.5 font-bold border border-amber-500/20">
                            {idx === 0 ? "Global Trade Watch (ทรัมป์ & ภาษี)" : "Federal Reserve Desk (เฟด & ดอกเบี้ย)"}
                          </span>
                          <span>{macro.timeAgo}</span>
                        </div>
                        <h3 className="text-sm md:text-base font-bold text-white mb-2 leading-snug">
                          {macro.headline}
                        </h3>
                        <p className="text-xs text-slate-300 mb-4 bg-slate-900/50 p-3 rounded-xl border border-slate-800/80">
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
                        <a href={macro.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline text-xs">
                          อ่านต้นฉบับ ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 🔴 ส่วนล่าง: ค้นหาข่าวหุ้นรายตัวตามจริงแบบเรียลไทม์ */}
            <div className="space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="bg-purple-600/20 text-purple-300 border border-purple-500/40 px-2.5 py-0.5 rounded-full text-xs font-bold">
                      ⭐ VIP Stock News
                    </span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-extrabold text-white flex items-center gap-2">
                    <span>⚡</span> Live Stock News Analysis with AI
                  </h1>
                  <p className="mt-1 text-sm text-slate-400">
                    {lang === "th" 
                      ? "พิมพ์ชื่อย่อหุ้น (เช่น TSLA, NVDA) เพื่อดึงข่าวสดและวิเคราะห์ผลกระทบตามจริงแบบเรียลไทม์"
                      : "Enter a stock ticker to instantly fetch breaking news and sentiment analysis."}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newsQuery}
                    onChange={(e) => setNewsQuery(e.target.value.toUpperCase())}
                    placeholder="Enter ticker (e.g. TSLA)"
                    className="rounded-xl border border-indigo-500/50 bg-slate-900 px-4 py-2.5 text-sm font-bold text-white uppercase focus:border-indigo-500 focus:outline-none shadow-lg w-64"
                  />
                  <button
                    onClick={handleSearch}
                    className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-lg flex items-center gap-2"
                  >
                    <span>🔍</span> {lang === "th" ? "ค้นหาข่าว" : "Search"}
                  </button>
                </div>
              </div>

              {/* แสดงผลรายการข่าวหุ้นรายตัวด้านล่าง */}
              {newsLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                  <p className="text-sm text-slate-400">กำลังดึงข่าวสดและวิเคราะห์หุ้น {newsQuery}...</p>
                </div>
              ) : newsList.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-sm">
                  ไม่พบข่าวสำหรับหุ้นตัวนี้ ลองค้นหาตัวอื่น เช่น TSLA, AAPL, NVDA
                </div>
              ) : (
                <div className="grid gap-6 md:grid-cols-2">
                  {newsList.map((news, index) => (
                    <div key={index} className="rounded-2xl border border-slate-800 bg-[#0c101d] p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                          <span className="rounded bg-indigo-500/10 text-indigo-400 px-2.5 py-1 font-bold border border-indigo-500/20">
                            {news.source}
                          </span>
                          <span>{news.timeAgo}</span>
                        </div>
                        <a href={news.link} target="_blank" rel="noopener noreferrer" className="text-base font-bold text-white mb-3 leading-snug hover:text-indigo-400 transition block">
                          {news.title} ↗
                        </a>
                        <p className="text-xs text-slate-300 mb-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                          <strong className="text-indigo-300">📝 สรุปใจความสำคัญ:</strong> {news.summary}
                        </p>
                      </div>
                      <div className="border-t border-slate-800/80 pt-4 mt-2">
                        <div className="flex items-center gap-2 text-xs font-bold">
                          <span className="text-slate-400">🤖 AI Sentiment Analysis:</span>
                          <span className={`px-2.5 py-1 rounded-lg ${getSentimentBadgeStyle(news.sentiment)}`}>
                            {news.sentiment}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      </main>
    </>
  );
}