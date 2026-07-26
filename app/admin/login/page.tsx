"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleAdminLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail || !password) {
      alert("กรุณากรอกอีเมลและรหัสผ่านให้ครบถ้วน");
      return;
    }

    try {
      setLoading(true);

      // 1. ทำการล็อกอินผ่าน Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (authError) throw authError;

      const user = authData.user;
      if (!user) throw new Error("ไม่พบข้อมูลผู้ใช้งาน");

      // 2. ตรวจสอบสิทธิ์ในตาราง profiles ว่าเป็น admin หรือไม่
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError || !profile || profile.role !== "admin") {
        await supabase.auth.signOut();
        alert("❌ ปฏิเสธการเข้าถึง: บัญชีนี้ไม่ใช่ผู้ดูแลระบบ (Admin)");
        return;
      }

      // 3. ล็อกอินสำเร็จ พาไปหน้าจัดการสมาชิกทันที
      router.replace("/admin/vip-approvals");
    } catch (error: any) {
      alert("เกิดข้อผิดพลาด: " + (error.message ?? "ไม่สามารถเข้าสู่ระบบได้"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <form
        onSubmit={handleAdminLogin}
        className="w-full max-w-md rounded-3xl border border-purple-500/30 bg-[#0c101d] p-8 shadow-2xl space-y-6"
      >
        <div className="text-center space-y-2">
          <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
            🛡️ Admin Security Gate
          </span>
          <h1 className="text-2xl font-extrabold text-white">
            เข้าสู่ระบบผู้ดูแลระบบ
          </h1>
          <p className="text-xs text-slate-400">
            เฉพาะบัญชีที่ได้รับสิทธิ์ Admin เท่านั้นจึงจะสามารถเข้าใช้งานได้
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
              อีเมลแอดมิน
            </label>
            <input
              type="email"
              placeholder="admin@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-purple-500 shadow-inner"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
              รหัสผ่าน
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 pr-16 text-sm text-white outline-none focus:border-purple-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-purple-400 hover:text-purple-300 cursor-pointer"
              >
                {showPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-purple-600 hover:bg-purple-500 p-3.5 text-sm font-bold text-white transition shadow-lg shadow-purple-600/30 cursor-pointer disabled:opacity-50"
        >
          {loading ? "กำลังตรวจสอบสิทธิ์..." : "🔐 เข้าสู่ระบบ Admin"}
        </button>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => router.push("/")}
            className="text-xs text-slate-500 hover:text-slate-400 underline cursor-pointer"
          >
            ← กลับสู่หน้าหลักเว็บไซต์
          </button>
        </div>
      </form>
    </main>
  );
}