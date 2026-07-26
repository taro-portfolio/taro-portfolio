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

    const { error } = await supabase.from("cash").upsert({
  user_id: user.id,
  amount: amount,
  currency: currency,
});

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    await onSaved();
    onClose();
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
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="mb-6 w-full rounded-lg border p-3"
        />

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-lg bg-gray-300 px-5 py-2"
          >
            ยกเลิก
          </button>

          <button
            onClick={saveCash}
            disabled={loading}
            className="rounded-lg bg-green-600 px-5 py-2 text-white"
          >
            {loading ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </div>
  );
}