"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import MarketPreview from "@/components/MarketPreview";
import USMarketView from "@/components/USMarketView";
import Features from "@/components/Features";
import Pricing from "@/components/Pricing";
import Footer from "@/components/Footer";
import { Language } from "@/lib/i18n";

export default function Home() {
  const [lang, setLang] = useState<Language>("th");
  const [showUSMarket, setShowUSMarket] = useState(false);
  const [initialSymbol, setInitialSymbol] = useState<string | undefined>(undefined);

  const handleOpenUSMarket = (symbol?: string) => {
    setInitialSymbol(symbol);
    setShowUSMarket(true);
  };

  return (
    <main className="min-h-screen bg-slate-950">
      <Navbar lang={lang} setLang={setLang} />
      
      {showUSMarket ? (
        <USMarketView 
          lang={lang} 
          initialSymbol={initialSymbol}
          onBack={() => {
            setShowUSMarket(false);
            setInitialSymbol(undefined);
          }} 
        />
      ) : (
        <>
          {/* แสดงส่วน Hero ซึ่งจัดการปุ่ม "เริ่มใช้ฟรีทันที" ไว้ภายในอย่างเรียบร้อย */}
          <Hero lang={lang} />

          {/* ส่วนข้อดีของเว็บ, ฟรีฟีเจอร์ (แดชบอร์ด & พอร์ตฟิลิปส์) และแพ็กเกจ VIP */}
          <div className="mx-auto max-w-7xl px-4 py-8">
            <div className="rounded-3xl border border-indigo-500/30 bg-gradient-to-b from-slate-900/90 to-[#0c101d] p-6 md:p-10 shadow-2xl">
              
              {/* หัวข้อหลัก */}
              <div className="text-center max-w-2xl mx-auto mb-10">
                <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  ✨ ทำไมต้องเลือก TARO Portfolio
                </span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-white mt-3">
                  เครื่องมือคู่ใจนักลงทุนหุ้นสหรัฐฯ และสาย DCA ยุคใหม่
                </h2>
                <p className="text-slate-400 text-sm mt-2">
                  ออกแบบมาเพื่อให้มือใหม่เข้าใจง่าย และช่วยให้นักลงทุนมืออาชีพจัดการพอร์ตได้อย่างแม่นยำ
                </p>
              </div>

              {/* 3 ข้อดีหลักของแอป */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-3xl mb-3">📊</div>
                  <h3 className="text-lg font-bold text-white mb-2">บันทึก & ติดตามพอร์ตอัจฉริยะ</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    คำนวณต้นทุน กำไร/ขาดทุน แยกตามไม้แบบเรียลไทม์ เหมาะกับสาย DCA ที่ต้องการความชัดเจนทุกบาททุกสตางค์
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-3xl mb-3">⚡</div>
                  <h3 className="text-lg font-bold text-white mb-2">วิเคราะห์ข่าวด้วย AI</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    อัปเดตข่าวสารหุ้นเด่น (เช่น TSLA, NVDA, AAPL) พร้อมระบบ AI สรุปผลกระทบและประเมินแนวโน้มราคาให้ทันที
                  </p>
                </div>

                <div className="bg-slate-950/60 border border-slate-800 p-6 rounded-2xl">
                  <div className="text-3xl mb-3">🎯</div>
                  <h3 className="text-lg font-bold text-white mb-2">เหมาะสำหรับมือใหม่และมือโปร</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    ใช้งานง่าย ไม่ซับซ้อน ช่วยลดความเสี่ยงและวางแผนการลงทุนในตลาดหุ้นต่างประเทศได้อย่างมั่นใจ
                  </p>
                </div>
              </div>

              {/* ส่วนแนะนำฟีเจอร์ฟรี: แดชบอร์ด และ พอร์ตฟิลิปส์ */}
              <div className="mb-12 border-t border-slate-800 pt-10">
                <div className="text-center max-w-2xl mx-auto mb-8">
                  <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                    🎁 เริ่มต้นใช้งานฟรีทันที
                  </span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mt-2">
                    2 ฟีเจอร์หลักที่เปิดให้ใช้งานฟรี ไม่มีค่าใช้จ่าย
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* ฟีเจอร์ที่ 1: แดชบอร์ด */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-lg">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          ฟรีไม่มีค่าใช้จ่าย
                        </span>
                        <span className="text-2xl">📈</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">1. แดชบอร์ด (Dashboard)</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        <strong>ข้อดี:</strong> สรุปภาพรวมพอร์ตการลงทุนทั้งหมด มูลค่าทรัพย์สินรวม และการเติบโตแบบเรียลไทม์ ช่วยให้นักลงทุนเห็นสถานะการเงินของตัวเองได้ทันทีในหน้าจอเดียว
                      </p>
                      
                      {/* ตัวอย่างภาพจำลอง UI แดชบอร์ด */}
                      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 mb-4 text-center">
                        <div className="text-[10px] text-slate-400 mb-1">ตัวอย่างหน้าจอแดชบอร์ด</div>
                        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800/80 flex items-center justify-between">
                          <div className="text-left">
                            <div className="text-[10px] text-slate-400">มูลค่าพอร์ตทั้งหมด</div>
                            <div className="text-sm font-bold text-emerald-400">$24,850.00</div>
                          </div>
                          <div className="text-right">
                            <div className="text-[10px] text-slate-400">กำไร/ขาดทุน</div>
                            <div className="text-xs font-bold text-emerald-400">+12.4% (+$2,740)</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <a href="/register" className="w-full block rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition text-center">
                      สมัครใช้งานฟรีทันที
                    </a>
                  </div>

                  {/* ฟีเจอร์ที่ 2: พอร์ตฟิลิปส์ */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-emerald-500/40 transition shadow-lg">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
                          ฟรีไม่มีค่าใช้จ่าย
                        </span>
                        <span className="text-2xl">📋</span>
                      </div>
                      <h4 className="text-lg font-bold text-white mb-2">2. พอร์ตฟิลิปส์ (บันทึกซื้อขาย)</h4>
                      <p className="text-xs text-slate-300 leading-relaxed mb-4">
                        <strong>ข้อดี:</strong> บันทึกรายการซื้อเข้าและขายออกแยกตามไม้ พร้อมระบบคำนวณต้นทุนเฉลี่ยและแสดงผลกำไรขาดทุนอย่างแม่นยำ เหมาะกับสาย DCA ตัวจริง
                      </p>
                      
                      {/* ตัวอย่างภาพจำลอง UI พอร์ตฟิลิปส์ */}
                      <div className="rounded-xl bg-slate-900 border border-slate-800 p-4 mb-4 text-center">
                        <div className="text-[10px] text-slate-400 mb-1">ตัวอย่างตารางบันทึกไม้ (DCA)</div>
                        <div className="bg-slate-950 rounded-lg p-2.5 border border-slate-800/80 text-left text-[11px] space-y-1">
                          <div className="flex justify-between text-slate-400 border-b border-slate-800 pb-1">
                            <span>หุ้น (Ticker)</span>
                            <span>ราคาซื้อ / จำนวน</span>
                          </div>
                          <div className="flex justify-between text-white font-medium">
                            <span>TSLA (ไม้ที่ 1)</span>
                            <span className="text-indigo-400">$210.50 / 5 หุ้น</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <a href="/register" className="w-full block rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition text-center">
                      สมัครใช้งานฟรีทันที
                    </a>
                  </div>

                </div>
              </div>

              {/* ส่วนจูงใจสมัครสมาชิก VIP ตามเรทราคาที่กำหนด */}
              <div className="border-t border-slate-800 pt-8 text-center">
                <div className="mb-6">
                  <span className="text-yellow-400 font-bold text-sm tracking-wide">⭐ ปลดล็อกเครื่องมือขั้นสูงแบบจัดเต็ม</span>
                  <h3 className="text-xl md:text-2xl font-extrabold text-white mt-1">เลือกแพ็กเกจ VIP ที่ใช่สำหรับคุณ</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
                  
                  {/* รายเดือน */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition">
                    <div>
                      <span className="text-xs font-bold text-slate-400 uppercase">รายเดือน</span>
                      <div className="text-3xl font-extrabold text-white my-3">99 <span className="text-sm font-normal text-slate-400">บาท/เดือน</span></div>
                      <p className="text-xs text-slate-400">เหมาะสำหรับทดลองใช้งานฟีเจอร์พรีเมียมทั้งหมด</p>
                    </div>
                    <a href="/vip" className="mt-6 w-full block rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-white transition text-center">
                      สมัครแพ็กเกจรายเดือน
                    </a>
                  </div>

                  {/* 6 เดือน (ยอดฮิต คุ้มค่า) */}
                  <div className="bg-gradient-to-b from-indigo-950/40 to-slate-950 border-2 border-indigo-500 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl">
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                      🔥 ยอดฮิต คุ้มที่สุด
                    </div>
                    <div>
                      <span className="text-xs font-bold text-indigo-400 uppercase">6 เดือน</span>
                      <div className="text-3xl font-extrabold text-white my-3">499 <span className="text-sm font-normal text-slate-400">บาท</span></div>
                      <p className="text-xs text-slate-400">ประหยัดกว่า คุ้มค่าสำหรับการลงทุนระยะกลาง</p>
                    </div>
                    <a href="/vip" className="mt-6 w-full block rounded-xl bg-indigo-600 hover:bg-indigo-500 py-2.5 text-xs font-bold text-white transition text-center shadow-lg">
                      สมัครแพ็กเกจ 6 เดือน
                    </a>
                  </div>

                  {/* 1 ปี */}
                  <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between hover:border-indigo-500/50 transition">
                    <div>
                      <span className="text-xs font-bold text-purple-400 uppercase">รายปี (12 เดือน)</span>
                      <div className="text-3xl font-extrabold text-white my-3">899 <span className="text-sm font-normal text-slate-400">บาท/ปี</span></div>
                      <p className="text-xs text-slate-400">คุ้มค่าที่สุด เฉลี่ยตกเดือนละไม่กี่บาท ใช้งานยาวๆ</p>
                    </div>
                    <a href="/vip" className="mt-6 w-full block rounded-xl bg-purple-600 hover:bg-purple-500 py-2.5 text-xs font-bold text-white transition text-center">
                      สมัครแพ็กเกจรายปี
                    </a>
                  </div>

                </div>
              </div>

            </div>
          </div>

          <MarketPreview lang={lang} onOpenUSMarket={handleOpenUSMarket} />
          <Features lang={lang} />
          <Pricing lang={lang} />
        </>
      )}

      <Footer lang={lang} />
    </main>
  );
}