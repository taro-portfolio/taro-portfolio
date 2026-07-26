import Link from "next/link";
import { Language } from "@/lib/i18n";

interface HeroProps {
  lang: Language;
}

export default function Hero({ lang }: HeroProps) {
  return (
    <section className="mx-auto max-w-7xl px-8 py-24">
      <div className="max-w-3xl">
        <span className="rounded-full bg-blue-600/20 px-4 py-2 text-sm font-semibold text-blue-400">
          🚀 {lang === "th" ? "แพลตฟอร์มจัดการพอร์ตอัจฉริยะ" : "Smart Portfolio Platform"}
        </span>

        <h1 className="mt-8 text-7xl font-extrabold leading-tight text-white">
          {lang === "th" ? (
            <>
              ติดตามพอร์ต
              <br />
              อย่างมืออาชีพ
            </>
          ) : (
            <>
              Track Your Portfolio
              <br />
              Like a Pro
            </>
          )}
        </h1>

        <p className="mt-8 text-xl leading-9 text-slate-400">
          {lang === "th"
            ? "บันทึกพอร์ต วิเคราะห์ผลตอบแทน แจ้งเตือนตามกฎของคุณ และปลดล็อกเครื่องมือวิเคราะห์ขั้นสูงสำหรับสมาชิก VIP"
            : "Record your portfolio, analyze returns, get alerts based on your rules, and unlock advanced analytical tools for VIP members."}
        </p>

        {/* ปุ่มเริ่มใช้ฟรีทันที (เหลือเพียงอันเดียว) */}
        <div className="mt-10 flex gap-4">
          <Link
            href="/register"
            className="rounded-xl bg-blue-600 px-8 py-4 font-bold text-white hover:bg-blue-700 transition shadow-xl inline-block text-center cursor-pointer"
          >
            {lang === "th" ? "🚀 เริ่มใช้ฟรีทันที" : "🚀 Get Started Free"}
          </Link>
        </div>
      </div>
    </section>
  );
}