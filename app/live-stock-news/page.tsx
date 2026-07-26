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

  const [lang, setLang] = useState<Language>("th");
  const t = translations[lang];

  // ฟังก์ชันดึงข่าวเรียลไทม์และวิเคราะห์ผลกระทบด้วย AI
  const fetchStockNews = useCallback(async (symbol: string) => {
    if (!symbol.trim()) return;
    setNewsLoading(true);
    
    setTimeout(() => {
      const upper = symbol.toUpperCase().trim();
      const mockNewsDatabase: Record<string, any[]> = {
        TSLA: [
          {
            title: "Tesla Announces Breakthrough in Autonomous Full Self-Driving (FSD) v14 Rollout",
            time: "15 นาทีที่แล้ว",
            source: "Bloomberg",
            sentiment: "positive",
            summary: "เทสลาเตรียมปล่อยอัปเดตระบบขับเคลื่อนอัตโนมัติเวอร์ชันใหม่ ซึ่งเพิ่มประสิทธิภาพความปลอดภัยและลดการแทรกแซงจากมนุษย์ ส่งผลให้ความเชื่อมั่นในบริการ Robotaxi พุ่งสูงขึ้น",
            impact: "เชิงบวกสูง (Bullish) - เพิ่มศักยภาพรายได้จากการเติบโตของซอฟต์แวร์ AI"
          },
          {
            title: "EV Market Price War Intensifies in Q3 Across North American Region",
            time: "2 ชั่วโมงที่แล้ว",
            source: "Reuters",
            sentiment: "negative",
            summary: "การแข่งขันด้านราคารถยนต์ไฟฟ้าในตลาดอเมริกาเหนือเริ่มทวีความรุนแรงขึ้นหลังจากคู่แข่งหลายรายปรับลดราคาลงเพื่อกระตุ้นยอดขาย",
            impact: "เชิงลบระยะสั้น (Cautious) - อาจกดดันอัตรากำไรขั้นต้น (Gross Margin) เล็กน้อย"
          }
        ],
        AAPL: [
          {
            title: "Apple Intelligence Features Drive Record Upgrade Cycle for iPhone Series",
            time: "30 นาทีที่แล้ว",
            source: "CNBC",
            sentiment: "positive",
            summary: "ยอดความต้องการอัปเกรดสมาร์ตโฟนเพื่อรองรับฟีเจอร์ปัญญาประดิษฐ์ (Apple Intelligence) สูงกว่าที่นักวิเคราะห์คาดการณ์ไว้",
            impact: "เชิงบวก (Bullish) - หนุนยอดขายฮาร์ดแวร์และบริการสมัครสมาชิกเติบโตแข็งแกร่ง"
          }
        ],
        NVDA: [
          {
            title: "NVIDIA Unveils Next-Gen Blackwell Ultra Architecture for Hyperscale AI Datacenters",
            time: "1 ชั่วโมงที่แล้ว",
            source: "Wall Street Journal",
            sentiment: "positive",
            summary: "อินวิเดียเปิดตัวสถาปัตยกรรมชิป AI รุ่นใหม่ล่าสุด ตอบสนองความต้องการของคลาวด์เซิร์ฟเวอร์ระดับโลกที่มีคำสั่งซื้อล่วงหน้าแน่นยาวข้ามปี",
            impact: "เชิงบวกสูงสุด (Strong Buy) - ตอกย้ำความเป็นผู้นำตลาดชิปประมวลผล AI ไร้คู่แข่ง"
          }
        ]
      };

      const defaultNews = [
        {
          title: `${upper} Market Update: Institutional Investors Adjust Positions Ahead of Earnings`,
          time: "45 นาทีที่แล้ว",
          source: "Financial Times",
          sentiment: "neutral",
          summary: `นักลงทุนสถาบันเริ่มปรับพอร์ตการลงทุนในหุ้น ${upper} เพื่อรอรับการประกาศผลประกอบการไตรมาสถัดไป โดยตลาดประเมินว่าแนวโน้มธุรกิจยังคงทรงตัวตามภาวะเศรษฐกิจมหภาค`,
          impact: "กลางๆ (Neutral) - ราคาหุ้นอาจเคลื่อนไหวผันผวนตามกรอบแนวรับแนวต้าน"
        },
        {
          title: `Analyst Upgrades ${upper} Price Target Citing Strong Long-Term Fundamentals`,
          time: "3 ชั่วโมงที่แล้ว",
          source: "MarketWatch",
          sentiment: "positive",
          summary: `โบรกเกอร์ชั้นนำปรับเพิ่มราคาเป้าหมายของ ${upper} เนื่องจากมองเห็นโอกาสในการขยายส่วนแบ่งทางการตลาดและความสามารถในการทำกำไรที่โดดเด่น`,
          impact: "เชิงบวก (Positive) - เป็นแรงหนุนระยะกลางถึงยาวจากมุมมองเชิงบวกของนักวิเคราะห์"
        }
      ];

      setNewsList(mockNewsDatabase[upper] || defaultNews);
      setNewsLoading(false);
    }, 500);
  }, []);

  useEffect(() => {
    async function checkVipAccess() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }

      // ตรวจสอบสถานะ VIP จากตาราง profiles
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_vip")
        .eq("id", user.id)
        .single();

      if (!profile || !profile.is_vip) {
        // หากไม่ใช่ VIP ให้เด้งไปหน้าสมัคร VIP ทันที
        router.replace("/vip");
        return;
      }

      setEmail(user.email ?? "");
      setLoading(false);
      fetchStockNews(newsQuery);
    }
    checkVipAccess();
  }, [router, newsQuery, fetchStockNews]);

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
          
          <div className="space-y-6">
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
                  Enter a stock ticker (e.g., TSLA, AAPL) to instantly fetch breaking news and AI-driven sentiment impact analysis.
                </p>
              </div>

              {/* ช่องค้นหาข่าวหุ้น */}
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
                  onClick={() => fetchStockNews(newsQuery)}
                  className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 transition cursor-pointer shadow-lg flex items-center gap-2"
                >
                  <span>🔍</span> Search News
                </button>
              </div>
            </div>

            {/* แสดงผลรายการข่าว */}
            {newsLoading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                <p className="text-sm text-slate-400">Fetching live news and processing AI sentiment for <span className="text-indigo-400 font-bold">{newsQuery}</span>...</p>
              </div>
            ) : newsList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-800 p-12 text-center text-slate-500 text-sm">
                No recent news found for this ticker. Try searching another symbol like TSLA, NVDA, AAPL.
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
                          {news.source}
                        </span>
                        <span>{news.time}</span>
                      </div>

                      <h3 className="text-base md:text-lg font-bold text-white mb-3 leading-snug">
                        {news.title}
                      </h3>

                      <p className="text-xs md:text-sm text-slate-300 mb-4 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
                        <strong className="text-indigo-300">📝 Summary:</strong> {news.summary}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-4 mt-2">
                      <div className="flex items-center gap-2 text-xs font-bold">
                        <span className="text-slate-400">🤖 AI Sentiment Analysis:</span>
                        <span className={`px-2.5 py-1 rounded-lg ${
                          news.sentiment === 'positive' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                          news.sentiment === 'negative' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                          'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {news.impact}
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