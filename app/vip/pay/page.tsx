"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Language } from "@/lib/i18n";

export default function VipPaymentPage() {
  const router = useRouter();
  const [selectedPlan, setSelectedPlan] = useState<"99" | "499" | "899">("99");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [lang, setLang] = useState<Language>("th");

  // State สำหรับควบคุมการเปิด/ปิดแสดง QR Code
  const [showQrCode, setShowQrCode] = useState(false);

  const planPrices: Record<string, number> = {
    "99": 99,
    "499": 499,
    "899": 899,
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      alert("กรุณาแนบหลักฐานการโอนเงิน (สลิป)");
      return;
    }

    try {
      setUploading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 1. อัปโหลดรูปสลิปไปที่ Supabase Storage (Bucket ชื่อ "slips")
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from("slips")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // ดึง Public URL ของรูปสลิป
      const { data: publicUrlData } = supabase.storage
        .from("slips")
        .getPublicUrl(fileName);

      const slipUrl = publicUrlData.publicUrl;

      // 2. อัปเดตข้อมูลในตาราง profiles เป็นสถานะรอตรวจสอบ (pending)
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          vip_plan: selectedPlan,
          slip_url: slipUrl,
          vip_status: "pending", // รอแอดมินอนุมัติ
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      alert("ส่งหลักฐานการชำระเงินสำเร็จ! กรุณารอแอดมินตรวจสอบและอนุมัติภายใน 24 ชม.");
      router.push("/dashboard");
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar lang={lang} setLang={setLang} />
      <div className="mx-auto max-w-xl px-4 py-12">
        <div className="rounded-3xl border border-indigo-500/30 bg-[#0c101d] p-8 shadow-2xl space-y-6">
          <div className="text-center">
            <h1 className="text-2xl font-extrabold text-white mb-2">💎 แจ้งชำระเงินแพ็กเกจ VIP</h1>
            <p className="text-xs text-slate-400">เลือกแพ็กเกจ กดแสดง QR Code เพื่อชำระเงิน และแนบสลิปโอนเงินเพื่อยืนยัน</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* เลือกแพ็กเกจ */}
            <div className="grid grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => { setSelectedPlan("99"); setShowQrCode(false); }}
                className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                  selectedPlan === "99" ? "border-indigo-500 bg-indigo-600/20 text-white shadow-lg" : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">รายเดือน</div>
                <div className="text-lg font-extrabold mt-1">99 ฿</div>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedPlan("499"); setShowQrCode(false); }}
                className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                  selectedPlan === "499" ? "border-indigo-500 bg-indigo-600/20 text-white shadow-lg" : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">6 เดือน</div>
                <div className="text-lg font-extrabold mt-1">499 ฿</div>
              </button>
              <button
                type="button"
                onClick={() => { setSelectedPlan("899"); setShowQrCode(false); }}
                className={`p-4 rounded-2xl border text-center transition cursor-pointer ${
                  selectedPlan === "899" ? "border-indigo-500 bg-indigo-600/20 text-white shadow-lg" : "border-slate-800 bg-slate-900 text-slate-400"
                }`}
              >
                <div className="text-xs font-bold">1 ปี</div>
                <div className="text-lg font-extrabold mt-1">899 ฿</div>
              </button>
            </div>

            {/* ส่วนปุ่มกดเพื่อแสดง QR Code */}
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-center space-y-4 shadow-inner">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-200">
                  ยอดชำระแพ็กเกจ: <span className="text-indigo-400 text-lg font-black">฿{planPrices[selectedPlan]}</span>
                </span>
                
                {/* ปุ่มกดเปิด-ปิด QR Code */}
                <button
                  type="button"
                  onClick={() => setShowQrCode(!showQrCode)}
                  className="rounded-xl bg-indigo-600/20 border border-indigo-500/40 px-4 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-600 hover:text-white transition cursor-pointer"
                >
                  {showQrCode ? "ซ่อน QR Code ✖" : "📱 แสดง QR Code แม่มณี"}
                </button>
              </div>

              {/* แสดง QR Code ก็ต่อเมื่อกดปุ่ม (showQrCode เป็น true) */}
              {showQrCode && (
                <div className="pt-3 space-y-3 animate-fadeIn">
                  <div className="flex justify-center">
                    <img
                      src="https://dqnrixhptlgceimxdvwo.supabase.co/storage/v1/object/public/slips/S__113950724.jpg"
                      alt="PromptPay Mae Manee QR Code"
                      className="w-44 h-44 object-contain rounded-xl border border-slate-700 bg-white p-2 shadow-md"
                    />
                  </div>
                  <div className="text-[11px] text-slate-300 space-y-1">
                    <p className="font-bold text-purple-300">ร้านค้า: ทาโร่ พอร์ตโฟลิโอ</p>
                    <p>ชื่อบัญชี: พิษณุ ปุกคาม</p>
                    <p className="text-slate-400">ประเภท: พร้อมเพย์ / แม่มณี</p>
                  </div>
                </div>
              )}
            </div>

            {/* ช่องอัปโหลดสลิป พร้อมหมายเหตุเตือนทางกฎหมาย */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide">
                แนบสลิปหลักฐานการโอนเงิน
              </label>
              
              {/* กล่องหมายเหตุเตือน */}
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-[11px] text-rose-300 leading-relaxed">
                ⚠️ **คำเตือน:** กรุณาส่งสลิปโอนเงินจริงเท่านั้น หากมีการตรวจพบการปลอมแปลงสลิปหรือเจตนาฉ้อโกง ทางระบบจะดำเนินการทางกฎหมายและดำเนินคดีตามกฎหมายสูงสุดทันที
              </div>

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
              />
            </div>

            <button
              type="submit"
              disabled={uploading}
              className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 py-3.5 text-sm font-bold text-white transition shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
            >
              {uploading ? "กำลังอัปโหลดสลิป..." : "ยืนยันการแจ้งชำระเงิน"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}