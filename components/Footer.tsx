import { Language } from "@/lib/i18n";

interface FooterProps {
  lang: Language;
}

export default function Footer({ lang }: FooterProps) {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8" id="contact">
      <div className="mx-auto max-w-7xl px-8 text-center text-slate-500">
        © 2026 TARO Platform. {lang === "th" ? "สงวนลิขสิทธิ์ทั้งหมด" : "All rights reserved."}
      </div>
    </footer>
  );
}