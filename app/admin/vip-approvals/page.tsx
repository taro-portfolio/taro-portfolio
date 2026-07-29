"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminVipApprovalsPage() {
  const router = useRouter();
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [withdrawRequests, setWithdrawRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"pending" | "all" | "withdraw">("pending");
  
  const [referredInputs, setReferredInputs] = useState<{ [key: string]: string }>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadAdminData = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/admin/login");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (!profile || profile.role !== "admin") {
        alert("คุณไม่มีสิทธิ์เข้าถึงหน้าผู้ดูแลระบบ");
        router.replace("/admin/login");
        return;
      }

      // 1. ดึงรายการรออนุมัติจากตาราง profiles ที่ vip_status = 'pending' และมี slip_url
      const { data: pending, error: pendingError } = await supabase
        .from("profiles")
        .select("*")
        .eq("vip_status", "pending")
        .not("slip_url", "is", null)
        .order("created_at", { ascending: false });

      if (pendingError) {
        console.error("Error fetching pending users:", pendingError);
      } else if (pending) {
        setPendingUsers(pending);
      }

      // 2. ดึงรายชื่อสมาชิกทั้งหมด
      const { data: everyone } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (everyone) {
        setAllUsers(everyone);
        const initialInputs: { [key: string]: string } = {};
        everyone.forEach((u) => {
          initialInputs[u.id] = u.referred_by || "";
        });
        setReferredInputs(initialInputs);
      }

      // 3. ดึงข้อมูลคำขอถอนเงิน
      const { data: withdraws } = await supabase
        .from("withdraws")
        .select("*, profiles(first_name, last_name, email)")
        .order("created_at", { ascending: false });

      if (withdraws) setWithdrawRequests(withdraws);

    } catch (err: any) {
      console.error("Auth Error:", err);
      router.replace("/admin/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadAdminData();
  }, [loadAdminData]);

  async function handleAdminLogout() {
    await supabase.auth.signOut();
    router.replace("/admin/login");
  }

  async function handleApprove(userId: string, plan: string) {
    const now = new Date();
    let expireDate = new Date();

    if (plan === "99") {
      expireDate.setDate(now.getDate() + 30);
    } else if (plan === "499") {
      expireDate.setDate(now.getDate() + 180);
    } else if (plan === "899") {
      expireDate.setFullYear(now.getFullYear() + 1);
    } else {
      expireDate.setDate(now.getDate() + 30);
    }

    try {
      // ตรวจสอบหรือสร้างรหัสแนะนำ (Referral Code)
      const { data: profileCheck } = await supabase
        .from("profiles")
        .select("referral_code")
        .eq("id", userId)
        .single();

      let newReferralCode = profileCheck?.referral_code;

      if (!newReferralCode) {
        const { data: lastUser } = await supabase
          .from("profiles")
          .select("referral_code")
          .not("referral_code", "is", null)
          .order("created_at", { ascending: false })
          .limit(1)
          .single();

        let nextNumber = 1;
        if (lastUser && lastUser.referral_code) {
          const lastNumStr = lastUser.referral_code.replace("AF2026", "");
          nextNumber = parseInt(lastNumStr, 10) + 1;
        }

        const paddedNum = String(nextNumber).padStart(7, "0");
        newReferralCode = `AF2026${paddedNum}`;
      }

      // อัปเดตสถานะเป็น active และเคลียร์ slip_url ออก
      const { error } = await supabase
        .from("profiles")
        .update({
          is_vip: true,
          vip_status: "active",
          vip_start_date: now.toISOString(),
          vip_expire_date: expireDate.toISOString(),
          referral_code: newReferralCode,
          slip_url: null, 
        })
        .eq("id", userId);

      if (error) throw error;

      alert(`✅ อนุมัติ VIP สำเร็จ! สร้างรหัสแนะนำ ${newReferralCode} ให้สมาชิกเรียบร้อยแล้ว`);
      loadAdminData();
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }

  async function handleReject(userId: string) {
    const { error } = await supabase
      .from("profiles")
      .update({
        vip_status: "none",
        vip_plan: null,
        slip_url: null,
      })
      .eq("id", userId);

    if (error) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    } else {
      alert("❌ ปฏิเสธสลิปเรียบร้อยแล้ว");
      loadAdminData();
    }
  }

  async function handleUpdateReferredBy(userId: string) {
    const newRefCode = referredInputs[userId] || "";
    const cleanCode = newRefCode.trim();
    
    setSavingId(userId);
    
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ referred_by: cleanCode === "" ? null : cleanCode })
        .eq("id", userId);

      if (error) throw error;

      alert("✅ อัปเดตผู้แนะนำสำเร็จ!");
      
      setAllUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, referred_by: cleanCode === "" ? null : cleanCode } : user
        )
      );
    } catch (error: any) {
      alert("⚠️ บันทึกไม่สำเร็จ: " + error.message);
    } finally {
      setSavingId(null);
    }
  }

  async function handleUpdateWithdrawStatus(withdrawId: string, newStatus: string) {
    try {
      const { error } = await supabase
        .from("withdraws")
        .update({ status: newStatus })
        .eq("id", withdrawId);

      if (error) throw error;

      alert("✅ อัปเดตสถานะคำขอถอนเงินสำเร็จ!");
      loadAdminData();
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + error.message);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white text-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent"></div>
          กำลังตรวจสอบสิทธิ์แอดมิน...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4 border-b border-slate-800 pb-6">
          <h1 className="text-2xl font-extrabold text-white">🛡️ ระบบจัดการผู้ดูแลระบบและสมาชิก (Admin Panel)</h1>
          <button
            onClick={handleAdminLogout}
            className="bg-red-600/25 hover:bg-red-600/40 border border-red-500/50 text-red-400 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer w-fit"
          >
            🚪 ออกจากระบบแอดมิน
          </button>
        </div>

        {/* เมนูแท็บ */}
        <div className="flex gap-4 mb-6 border-b border-slate-800 pb-4 overflow-x-auto">
          <button
            onClick={() => setActiveTab("pending")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "pending"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            ⏳ รายการรออนุมัติสลิป ({pendingUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            👥 สมาชิกทั้งหมดในระบบ ({allUsers.length})
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`px-5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "withdraw"
                ? "bg-purple-600 text-white shadow-lg"
                : "bg-slate-900 text-slate-400 hover:bg-slate-800"
            }`}
          >
            💸 คำขอถอนเงิน ({withdrawRequests.length})
          </button>
        </div>

        {/* แท็บรออนุมัติสลิป */}
        {activeTab === "pending" && (
          <div>
            {pendingUsers.length === 0 ? (
              <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-8 text-center text-slate-400">
                ไม่มีรายการรออนุมัติในขณะนี้ 🎉
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pendingUsers.map((user) => (
                  <div key={user.id} className="rounded-2xl border border-slate-800 bg-[#0c101d] p-6 shadow-xl space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                      <div>
                        <div className="text-sm font-bold text-white">{user.first_name || "-"} {user.last_name || ""}</div>
                        <div className="text-xs text-slate-400">{user.email || user.id}</div>
                      </div>
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold">
                        แพ็กเกจ: {user.vip_plan === "99" ? "รายเดือน (99 ฿)" : user.vip_plan === "499" ? "6 เดือน (499 ฿)" : user.vip_plan === "899" ? "1 ปี (899 ฿)" : `${user.vip_plan || "99"} ฿`}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs font-bold text-slate-300 mb-2">หลักฐานการโอนเงิน (สลิป):</div>
                      {user.slip_url ? (
                        <a href={user.slip_url} target="_blank" rel="noopener noreferrer">
                          <img src={user.slip_url} alt="Slip" className="h-48 w-full object-cover rounded-xl border border-slate-700 hover:opacity-90 transition" />
                        </a>
                      ) : (
                        <div className="text-xs text-red-400">ไม่พบรูปสลิป</div>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => handleApprove(user.id, user.vip_plan || "99")}
                        className="flex-1 rounded-xl bg-green-600 hover:bg-green-500 py-2.5 text-xs font-bold text-white transition cursor-pointer shadow-lg"
                      >
                        ✅ อนุมัติ & สร้างรหัสแนะนำ
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="rounded-xl bg-red-600/20 hover:bg-red-600/30 border border-red-500/40 px-4 py-2.5 text-xs font-bold text-red-400 transition cursor-pointer"
                      >
                        ❌ ปฏิเสธ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* แท็บสมาชิกทั้งหมด */}
        {activeTab === "all" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">ชื่อ - นามสกุล</th>
                    <th className="px-4 py-3">อีเมล</th>
                    <th className="px-4 py-3">สิทธิ์ระบบ (Role)</th>
                    <th className="px-4 py-3">สถานะ VIP</th>
                    <th className="px-4 py-3">รหัสแนะนำตัว</th>
                    <th className="px-4 py-3">ผู้แนะนำ (Referred By)</th>
                    <th className="px-4 py-3">วันที่สมัคร</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {allUsers.map((u) => {
                    const currentInputValue = referredInputs[u.id] !== undefined ? referredInputs[u.id] : (u.referred_by || "");
                    const isChanged = currentInputValue !== (u.referred_by || "");

                    return (
                      <tr key={u.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-semibold text-white">
                          {u.first_name || "-"} {u.last_name || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{u.email || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${u.role === 'admin' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-slate-800 text-slate-300'}`}>
                            {u.role || "user"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {u.is_vip ? (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              ⭐ VIP Active
                            </span>
                          ) : (
                            <span className="bg-slate-800 text-slate-400 px-2.5 py-1 rounded-full text-[10px]">
                              Free
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 font-mono text-indigo-400 font-bold">
                          {u.referral_code || "-"}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="text"
                              value={currentInputValue}
                              placeholder="ไม่มีผู้แนะนำ"
                              onChange={(e) => {
                                setReferredInputs({
                                  ...referredInputs,
                                  [u.id]: e.target.value
                                });
                              }}
                              className="bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-indigo-300 font-mono w-32 focus:outline-none focus:border-purple-500"
                            />
                            {isChanged && (
                              <button
                                onClick={() => handleUpdateReferredBy(u.id)}
                                disabled={savingId === u.id}
                                className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition shadow-md whitespace-nowrap cursor-pointer"
                              >
                                {savingId === u.id ? "⏳..." : "💾 บันทึก"}
                              </button>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString("th-TH") : "-"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* แท็บคำขอถอนเงิน */}
        {activeTab === "withdraw" && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">ชื่อสมาชิก</th>
                    <th className="px-4 py-3">อีเมล</th>
                    <th className="px-4 py-3">จำนวนเงินที่ถอน</th>
                    <th className="px-4 py-3">สถานะคำขอ</th>
                    <th className="px-4 py-3">จัดการสถานะ</th>
                    <th className="px-4 py-3">วันที่ทำรายการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {withdrawRequests.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                        ยังไม่มีคำขอถอนเงินในขณะนี้ 💸
                      </td>
                    </tr>
                  ) : (
                    withdrawRequests.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/40 transition">
                        <td className="px-4 py-3 font-semibold text-white">
                          {item.profiles?.first_name || "-"} {item.profiles?.last_name || ""}
                        </td>
                        <td className="px-4 py-3 text-slate-400">{item.profiles?.email || "-"}</td>
                        <td className="px-4 py-3 font-mono text-emerald-400 font-bold text-sm">
                          ฿{Number(item.amount || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3">
                          {item.status === "pending" ? (
                            <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              ⏳ ตรวจสอบ
                            </span>
                          ) : item.status === "processing" ? (
                            <span className="bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              🔄 ตรวจสอบแล้วรอโอน
                            </span>
                          ) : (
                            <span className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              ✅ โอนสำเร็จ
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={item.status}
                            onChange={(e) => handleUpdateWithdrawStatus(item.id, e.target.value)}
                            className="bg-slate-950 border border-slate-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-purple-500 cursor-pointer"
                          >
                            <option value="pending">⏳ ตรวจสอบ</option>
                            <option value="processing">🔄 ตรวจสอบแล้วรอโอน</option>
                            <option value="completed">✅ โอนสำเร็จ</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          {item.created_at ? new Date(item.created_at).toLocaleDateString("th-TH") : "-"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}