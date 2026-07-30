"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type CashModalProps = {
  open: boolean;
  onClose: () => void;
  currentCash: number;
  currentCurrency: "THB" | "USD";
  onSaved: () => void;
};

export default function CashModal({
  open,
  onClose,
  currentCash,
  currentCurrency,
  onSaved,
}: CashModalProps) {
  const [amount, setAmount] = useState(currentCash);
  const [currency, setCurrency] = useState<"THB" | "USD">("THB");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setAmount(currentCash);
    setCurrency(currentCurrency);
  }, [currentCash, currentCurrency, open]);

  if (!open) return null;

  const saveCash = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      alert("ไม่พบข้อมูลผู้ใช้งาน");
      return;
    }

    setLoading(true);

    try {
      // 1. ค้นหาแถวข้อมูลเงินสดที่มีอยู่แล้วของผู้ใช้ตามสกุลเงินที่เลือก
      const { data: existingCash, error: fetchError } = await supabase
        .from("cash")
        .select("id")
        .eq("user_id", user.id)
        .eq("currency", currency)
        .maybeSingle();

      if (fetchError) {
        throw fetchError;
      }

      let error;

      if (existingCash) {
        // 2. ถ้ามีข้อมูลอยู่แล้ว ให้ใช้วิธี Update ตาม ID เดิม
        const res = await supabase
          .from("cash")
          .update({
            amount: Number(amount),
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingCash.id);
        error = res.error;
      } else {
        // 3. ถ้ายังไม่มี ให้สร้างแถวใหม่ (Insert)
        const res = await supabase.from("cash").insert([
          {
            user_id: user.id,
            amount: Number(amount),
            currency: currency,
            updated_at: new Date().toISOString(),
          },
        ]);
        error = res.error;
      }

      if (error) {
        alert(error.message);
        return;
      }

      await onSaved();
      onClose();
    } catch (err: any) {
      console.error("Error saving cash:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูลเงินสด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold">💰 แก้ไขเงินสด</h2>

        <label className="mb-2 block text-sm font-medium">
          สกุลเงิน
        </label>

        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as "THB" | "USD")}
          className="mb-4 w-full rounded-lg border p-3"
        >
          <option value="THB">🇹🇭 THB</option>
          <option value="USD">🇺🇸 USD</option>
        </select>

        <label className="mb-2 block text-sm font-medium">
          จำนวนเงินสด
        </label>

        <input
          type="number"
          step="any"
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mb-6 w-full rounded-lg border p-3"
        />

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-gray-300 px-5 py-2 cursor-pointer"
          >
            ยกเลิก
          </button>

          <button
            type="button"
            onClick={saveCash}
            disabled={loading}
            className="rounded-lg bg-green-600 px-5 py-2 text-white cursor-pointer hover:bg-green-500 transition"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}