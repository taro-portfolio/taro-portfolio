import { Language } from "@/lib/i18n";

interface FeaturesProps {
  lang: Language;
}

export default function Features({ lang }: FeaturesProps) {
  const features = [
    {
      title: lang === "th" ? "ติดตามพอร์ต" : "Portfolio Tracking",
      desc:
        lang === "th"
          ? "บันทึกและติดตามพอร์ตการลงทุนแบบเรียลไทม์"
          : "Record and track your investment portfolio in real-time.",
      icon: "📊",
    },
    {
      title: lang === "th" ? "แจ้งเตือนอัจฉริยะ" : "Smart Alerts",
      desc:
        lang === "th"
          ? "แจ้งเตือนตามกฎการลงทุนที่คุณกำหนดเอง"
          : "Get alerts based on your custom investment rules.",
      icon: "🔔",
    },
    {
      title: lang === "th" ? "วิเคราะห์ทางเทคนิค" : "Technical Analysis",
      desc:
        lang === "th"
          ? "EMA แนวรับ แนวต้าน และแนวโน้มตลาด (VIP)"
          : "EMA, support, resistance, and market trends (VIP).",
      icon: "📈",
    },
    {
      title: lang === "th" ? "สรุปด้วย AI" : "AI Summary",
      desc:
        lang === "th"
          ? "สรุปภาพรวมพอร์ตของคุณแบบเข้าใจง่าย"
          : "An easy-to-understand overview of your portfolio.",
      icon: "🤖",
    },
  ];

  return (
    <section className="bg-slate-950 py-24" id="features">
      <div className="mx-auto max-w-7xl px-8">
        <h2 className="text-center text-5xl font-bold text-white">
          {lang === "th" ? "ทุกสิ่งที่คุณต้องการ" : "Everything You Need"}
        </h2>

        <p className="mt-4 text-center text-slate-400">
          {lang === "th"
            ? "เครื่องมือครบสำหรับติดตามพอร์ตและวิเคราะห์การลงทุน"
            : "Complete tools for portfolio tracking and investment analysis."}
        </p>

        <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {features.map((item) => (
            <div
              key={item.title}
              className="rounded-3xl border border-slate-800 bg-slate-900 p-8 transition hover:border-blue-500"
            >
              <div className="text-5xl">{item.icon}</div>

              <h3 className="mt-6 text-2xl font-bold text-white">
                {item.title}
              </h3>

              <p className="mt-4 leading-7 text-slate-400">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}