"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login");
        return;
      }
      setUserId(user.id);
    }
    checkUser();
  }, [router]);

  async function handleConfirmPayment() {
    if (!userId) return;
    setLoading(true);

    try {
      // 1. อัปเดตสถานะใน profiles ให้เป็น vip (กำหนดหมดอายุ 30 วัน)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          role: "vip",
          vip_expires_at: expiresAt.toISOString(),
        });

      if (profileError) throw profileError;

      // 2. บันทึกประวัติชำระเงิน
      await supabase.from("subscriptions").insert({
        user_id: userId,
        amount: 199,
        status: "paid",
        payment_method: "promptpay",
      });

      alert("🎉 อัปเกรดเป็นสมาชิก VIP สำเร็จแล้ว!");
      router.push("/dashboard");
    } catch (err: any) {
      alert("เกิดข้อผิดพลาด: " + err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-slate-100 p-6 md:p-12 flex justify-center items-center">
        <div className="w-full max-w-lg rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
          <div className="text-center">
            <span className="text-4xl">👑</span>
            <h1 className="mt-2 text-2xl font-bold text-gray-900">อัปเกรดเป็น Taro VIP</h1>
            <p className="mt-1 text-sm text-gray-500">ปลดล็อกการวิเคราะห์พอร์ตและสัญญาณปรับพอร์ตเชิงลึก</p>
          </div>

          <div className="mt-6 rounded-xl bg-amber-50 p-4 border border-amber-200">
            <div className="flex justify-between items-center font-bold text-amber-900">
              <span>แพ็กเกจ VIP รายเดือน</span>
              <span className="text-xl">฿199 / เดือน</span>
            </div>
            <ul className="mt-3 space-y-2 text-xs text-amber-800">
              <li>✓ ปลดล็อกสัญญาณปรับพอร์ตตามวินัยทุกตัวในพอร์ต</li>
              <li>✓ คำนวณเป้าหมายราคาเข้าสะสม/ทำกำไรรายตัว</li>
              <li>✓ สรุปการประเมินความเสี่ยงและเงินปันผลคาดการณ์</li>
              <li>✓ สิทธิ์ใช้งานลิงก์แนะนำเพื่อนเพื่อสร้างรายได้</li>
            </ul>
          </div>

          {!showQR ? (
            <button
              onClick={() => setShowQR(true)}
              className="mt-6 w-full rounded-xl bg-amber-500 py-3.5 font-bold text-white shadow-md hover:bg-amber-600 transition"
            >
              ดำเนินการชำระเงิน (PromptPay QR)
            </button>
          ) : (
            <div className="mt-6 text-center">
              <p className="text-xs font-semibold text-gray-600 mb-3">สแกน QR Code ชำระเงิน 199 บาท</p>
              
              {/* ตัวอย่างภาพ QR Code จำลอง */}
              <div className="mx-auto w-48 h-48 bg-slate-200 rounded-xl flex items-center justify-center border-2 border-dashed border-gray-400">
                <span className="text-xs text-gray-500 font-bold">[ PromptPay QR Code ]</span>
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading}
                className="mt-6 w-full rounded-xl bg-emerald-600 py-3.5 font-bold text-white shadow-md hover:bg-emerald-700 active:bg-emerald-800 transition disabled:opacity-50"
              >
                {loading ? "กำลังตรวจสอบ..." : "ยืนยันการชำระเงิน"}
              </button>
            </div>
          )}
        </div>
      </main>
    </>
  );
}