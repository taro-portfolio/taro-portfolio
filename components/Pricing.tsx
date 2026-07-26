import { Language } from "@/lib/i18n";

interface PricingProps {
  lang: Language;
}

export default function Pricing({ lang }: PricingProps) {
  return (
    <section className="bg-slate-900 py-24" id="pricing">
      <div className="mx-auto max-w-6xl px-8">
        <h2 className="text-center text-5xl font-bold text-white">
          {lang === "th" ? "แพ็กเกจราคา" : "Pricing"}
        </h2>

        <div className="mt-16 grid gap-8 md:grid-cols-2">
          <div className="rounded-3xl border border-slate-700 p-10">
            <h3 className="text-3xl font-bold text-white">
              {lang === "th" ? "ฟรี" : "Free"}
            </h3>

            <p className="mt-4 text-slate-400">
              {lang === "th" ? "ฟรีตลอดการใช้งาน" : "Free forever"}
            </p>

            <ul className="mt-8 space-y-3 text-slate-300">
              <li>✔ Portfolio</li>
              <li>✔ Dashboard</li>
              <li>✔ Alerts</li>
            </ul>
          </div>

          <div className="rounded-3xl border-2 border-blue-500 bg-slate-950 p-10">
            <h3 className="text-3xl font-bold text-white">
              VIP
            </h3>

            <div className="mt-4 text-5xl font-bold text-blue-400">
              ฿99
            </div>

            <p className="text-slate-400">
              {lang === "th" ? "/ เดือน" : "/ month"}
            </p>

            <ul className="mt-8 space-y-3 text-slate-300">
              <li>✔ EMA</li>
              <li>✔ {lang === "th" ? "แนวรับ" : "Support Level"}</li>
              <li>✔ {lang === "th" ? "แนวต้าน" : "Resistance Level"}</li>
              <li>✔ AI Summary</li>
              <li>✔ {lang === "th" ? "Dashboard ขั้นสูง" : "Advanced Dashboard"}</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}