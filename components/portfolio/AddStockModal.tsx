"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export type StockEditData = {
  id: string;
  market?: string;
  symbol?: string;
  quantity?: number | string;
  buy_price?: number | string;
  fee?: number | string;
  buy_date?: string;
  note?: string;
  type?: "BUY" | "SELL";
};

type AddStockModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void | Promise<void>;
  editStock?: StockEditData | null;
  onClearEdit?: () => void;
  defaultType?: "BUY" | "SELL";
};

export default function AddStockModal({
  open,
  onClose,
  onSuccess,
  editStock,
  onClearEdit,
  defaultType = "BUY",
}: AddStockModalProps) {
  const [market, setMarket] = useState("US");
  const [symbol, setSymbol] = useState("");
  const [quantity, setQuantity] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [fee, setFee] = useState("0");
  const [buyDate, setBuyDate] = useState("");
  const [note, setNote] = useState("");
  const [txType, setTxType] = useState<"BUY" | "SELL">(defaultType);
  const [saving, setSaving] = useState(false);

  const currencySymbol = market === "US" ? "$" : "฿";

  const resetForm = () => {
    const today = new Date().toISOString().split("T")[0];
    setMarket("US");
    setSymbol("");
    setQuantity("");
    setBuyPrice("");
    setFee("0");
    setBuyDate(today);
    setNote("");
    setTxType(defaultType);
  };

  useEffect(() => {
    if (editStock) {
      setMarket(editStock.market ?? "US");
      setSymbol(editStock.symbol ?? "");
      setQuantity(editStock.quantity !== undefined && editStock.quantity !== null ? String(editStock.quantity) : "");
      setBuyPrice(editStock.buy_price !== undefined && editStock.buy_price !== null ? String(editStock.buy_price) : "");
      setFee(editStock.fee !== undefined && editStock.fee !== null ? String(editStock.fee) : "0");
      setBuyDate(editStock.buy_date ?? new Date().toISOString().split("T")[0]);
      setNote(editStock.note ?? "");
      setTxType(editStock.type ?? "BUY");
    } else {
      resetForm();
      setTxType(defaultType);
    }
  }, [editStock, open, defaultType]);

  if (!open) return null;

  const handleCloseModal = () => {
    onClearEdit?.();
    resetForm();
    onClose();
  };

  async function handleSave(e?: React.FormEvent) {
    if (e) e.preventDefault();

    if (!symbol.trim() || !quantity || !buyPrice) {
      alert("กรุณากรอก Ticker, จำนวนหุ้น และราคาให้ครบถ้วน");
      return;
    }

    setSaving(true);

    try {
      // 🌟 เปลี่ยนมาใช้ getSession() แทน เพื่อให้อ่านค่าจากเครื่องมือถือได้ทันที ไม่หลุดบ่อย
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;

      if (!user) {
        alert("กรุณาเข้าสู่ระบบใหม่อีกครั้ง");
        setSaving(false);
        return;
      }

      const qty = Number(quantity);
      const price = Number(buyPrice);
      const txFee = Number(fee || 0);
      const totalAmount = (qty * price) + txFee;
      const targetCashCurrency = market === "US" ? "USD" : "THB";

      const payload = {
        user_id: user.id,
        market,
        symbol: symbol.toUpperCase().trim(),
        quantity: qty,
        buy_price: price,
        fee: txFee,
        buy_date: buyDate || null,
        note: note.trim(),
        type: txType,
      };

      let error;

      if (editStock) {
        const result = await supabase
          .from("portfolio")
          .update({
            market: payload.market,
            symbol: payload.symbol,
            quantity: payload.quantity,
            buy_price: payload.buy_price,
            fee: payload.fee,
            buy_date: payload.buy_date,
            note: payload.note,
            type: payload.type,
          })
          .eq("id", editStock.id)
          .eq("user_id", user.id);

        error = result.error;
      } else {
        const result = await supabase.from("portfolio").insert(payload);
        error = result.error;

        if (!error) {
          let { data: cashData } = await supabase
            .from("cash")
            .select("*")
            .eq("user_id", user.id)
            .eq("currency", targetCashCurrency)
            .order("updated_at", { ascending: false })
            .limit(1);

          let cashId = null;
          let currentCashAmount = 0;

          if (cashData && cashData.length > 0) {
            cashId = cashData[0].id;
            currentCashAmount = Number(cashData[0].amount || 0);
          } else if (targetCashCurrency === "USD") {
            const { data: thbCashData } = await supabase
              .from("cash")
              .select("*")
              .eq("user_id", user.id)
              .eq("currency", "THB")
              .order("updated_at", { ascending: false })
              .limit(1);

            if (thbCashData && thbCashData.length > 0) {
              cashId = thbCashData[0].id;
              currentCashAmount = Number(thbCashData[0].amount || 0);
            }
          }

          let updatedCashAmount = currentCashAmount;

          if (txType === "SELL") {
            updatedCashAmount += totalAmount; 
          } else if (txType === "BUY") {
            updatedCashAmount -= totalAmount; 
          }

          if (cashId) {
            await supabase
              .from("cash")
              .update({ amount: updatedCashAmount, updated_at: new Date() })
              .eq("id", cashId);
          } else {
            await supabase.from("cash").insert([
              {
                user_id: user.id,
                amount: txType === "SELL" ? totalAmount : -totalAmount,
                currency: targetCashCurrency,
                updated_at: new Date(),
              },
            ]);
          }
        }
      }

      if (error) {
        console.error(error);
        alert(`เกิดข้อผิดพลาด: ${error.message}`);
        return;
      }

      await onSuccess();
      handleCloseModal();
    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาดไม่คาดคิด");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl transition-all border border-gray-100">
        <div className="mb-6 flex items-center justify-between border-b pb-4 border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">
            {editStock 
              ? "✏️ แก้ไขรายการหุ้น" 
              : txType === "SELL" 
                ? `🔴 บันทึกขายหุ้นออก (${market === "US" ? "USD $" : "THB ฿"})` 
                : `🟢 บันทึกซื้อหุ้นเข้า (${market === "US" ? "USD $" : "THB ฿"})`}
          </h2>
          <button
            type="button"
            onClick={handleCloseModal}
            className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4">
          {!editStock && (
            <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
              <button
                type="button"
                onClick={() => setTxType("BUY")}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer ${txType === "BUY" ? "bg-emerald-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}
              >
                🟢 ซื้อเข้า (BUY)
              </button>
              <button
                type="button"
                onClick={() => setTxType("SELL")}
                className={`flex-1 py-2 rounded-lg font-bold text-sm transition cursor-pointer ${txType === "SELL" ? "bg-rose-600 text-white shadow-md" : "text-gray-600 hover:text-gray-900"}`}
              >
                🔴 ขายออก (SELL)
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ตลาด (Market)</label>
              <select
                value={market}
                onChange={(e) => setMarket(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-semibold"
              >
                <option value="US">🇺🇸 US Market (USD $)</option>
                <option value="TH">🇹🇭 TH Market (THB ฿)</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">ชื่อหุ้น / Ticker</label>
              <input
                type="text"
                value={symbol}
                onChange={(e) => setSymbol(e.target.value.trim())}
                placeholder="เช่น NVDA, PTT, JEPI"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 uppercase focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">จำนวนหุ้น</label>
              <input
                type="number"
                step="any"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ราคาต่อหน่วย ({currencySymbol}) 
                <span className="text-xs text-blue-600 ml-1 font-bold">({market === "US" ? "USD" : "THB"})</span>
              </label>
              <input
                type="number"
                step="any"
                value={buyPrice}
                onChange={(e) => setBuyPrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 font-bold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                ค่าธรรมเนียม ({currencySymbol})
              </label>
              <input
                type="number"
                step="any"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">วันที่ทำรายการ</label>
              <input
                type="date"
                value={buyDate}
                onChange={(e) => setBuyDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">หมายเหตุ (Optional)</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="บันทึกเพิ่มเติม..."
              className="w-full rounded-xl border border-gray-300 p-2.5 text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <div className="mt-6 flex justify-end gap-3 border-t border-gray-100 pt-4">
            <button
              type="button"
              onClick={handleCloseModal}
              className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              disabled={saving}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium text-white active:scale-95 disabled:opacity-50 transition-all shadow-md ${txType === "SELL" ? "bg-rose-600 hover:bg-rose-700 shadow-rose-500/20" : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/20"}`}
            >
              {saving ? "กำลังบันทึก..." : editStock ? "บันทึกการแก้ไข" : txType === "SELL" ? `🔴 บันทึกขาย (${currencySymbol})` : `💾 บันทึกซื้อ (${currencySymbol})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}