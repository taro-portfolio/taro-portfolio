"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function RegisterPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [refCode, setRefCode] = useState<string | null>(null);

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // ดึงรหัสแนะนำจาก URL (เช่น ?ref=AF20260000001) ตอนโหลดหน้าเว็บ
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      setRefCode(ref);
      localStorage.setItem("referred_by_code", ref);
    } else {
      const savedRef = localStorage.getItem("referred_by_code");
      if (savedRef) {
        setRefCode(savedRef);
      }
    }
  }, []);

  async function handleRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      alert("กรุณากรอกอีเมล");
      return;
    }

    if (password.length < 6) {
      alert("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      alert("กรุณากรอกชื่อจริงและนามสกุลจริงให้ครบถ้วน (ไม่สามารถแก้ไขได้ภายหลัง)");
      return;
    }

    if (!agreedToTerms) {
      alert("กรุณาอ่านและกดยอมรับข้อตกลงและเงื่อนไขทางกฎหมายก่อนสมัครใช้งาน");
      return;
    }

    try {
      setLoading(true);

      // 1. สมัครสมาชิกผ่าน Supabase Auth
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
      });

      if (error) throw error;

      const user = data.user;
      if (user) {
        // ดึงรหัสแนะนำจาก state หรือ localStorage
        const finalRefCode = refCode || localStorage.getItem("referred_by_code");

        // 2. บันทึกข้อมูลส่วนตัว ชื่อ-นามสกุลจริง และรหัสผู้แนะนำ (referred_by) ลงตาราง profiles
        const { error: profileError } = await supabase
          .from("profiles")
          .update({
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            phone: phone.trim(),
            address: address.trim(),
            name_locked: true,
            referred_by: finalRefCode || null, // ฝังรหัสผู้แนะนำทันทีแม้จะเป็นสมาชิกฟรี
          })
          .eq("id", user.id);

        if (profileError) {
          console.error("Profile update error:", profileError.message);
        } else {
          // ลบข้อมูล ref ออกจากเครื่องหลังบันทึกเสร็จ
          localStorage.removeItem("referred_by_code");
        }
      }

      alert("สมัครสมาชิกสำเร็จ 🎉 กรุณาเข้าสู่ระบบ");
      router.push("/login");
    } catch (error: any) {
      alert(error.message ?? "เกิดข้อผิดพลาดในการสมัครสมาชิก");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-950 px-4 py-12">
      <form
        onSubmit={handleRegister}
        className="w-full max-w-xl rounded-3xl border border-slate-800 bg-[#0c101d] p-8 shadow-2xl"
      >
        <h1 className="mb-2 text-center text-3xl font-extrabold text-white">
          สร้างบัญชีผู้ใช้งานใหม่
        </h1>
        <p className="mb-8 text-center text-xs text-slate-400">
          กรอกข้อมูลจริงเพื่อความถูกต้องและปลอดภัยในการใช้งานระบบพอร์ต
        </p>

        {/* แสดงแถบแจ้งเตือนหากสมัครผ่านลิงก์แนะนำเพื่อน */}
        {refCode && (
          <div className="mb-6 rounded-2xl border border-purple-500/30 bg-purple-500/10 p-3 text-center text-xs text-purple-300 font-semibold">
            ✨ คุณกำลังสมัครสมาชิกผ่านลิงก์แนะนำเพื่อน (รหัสผู้แนะนำ: <span className="text-white font-mono">{refCode}</span>)
          </div>
        )}

        <div className="space-y-4">
          {/* ชื่อจริง & นามสกุลจริง */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                ชื่อจริง
              </label>
              <input
                type="text"
                placeholder="ชื่อจริง (ภาษาไทยหรืออังกฤษ)"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-green-500 shadow-inner"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">
                นามสกุล
              </label>
              <input
                type="text"
                placeholder="นามสกุลจริง"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-green-500 shadow-inner"
              />
            </div>
          </div>

          <p className="text-[11px] text-amber-400/90 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-xl leading-relaxed">
            💡 กรุณากรอกชื่อจริงและนามสกุลจริง เพื่อประโยชน์ของท่านในการทำธุรกรรม ฝาก-ถอน หรือเข้าร่วมกิจกรรมพิเศษ โดยข้อมูลนี้จะไม่สามารถเปลี่ยนแปลงได้หลังจากสมัครสมาชิกเรียบร้อยแล้ว
          </p>

          {/* อีเมล */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">อีเมล</label>
            <input
              type="email"
              placeholder="name@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-green-500 shadow-inner"
            />
          </div>

          {/* รหัสผ่าน */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">รหัสผ่าน</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="อย่างน้อย 6 ตัวอักษร"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 pr-16 text-sm text-white outline-none focus:border-green-500 shadow-inner"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blue-400 hover:text-blue-300"
              >
                {showPassword ? "ซ่อน" : "แสดง"}
              </button>
            </div>
          </div>

          {/* เบอร์โทรศัพท์ */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">เบอร์โทรศัพท์</label>
            <input
              type="text"
              placeholder="0812345678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-green-500 shadow-inner"
            />
          </div>

          {/* ที่อยู่ */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1 uppercase tracking-wide">ที่อยู่</label>
            <textarea
              rows={2}
              placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-green-500 shadow-inner"
            />
          </div>

          {/* ส่วนข้อกฎหมายการลงทุนและเงื่อนไข (Disclaimer) */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 p-4 space-y-2 mt-4">
            <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
              📜 ข้อตกลงการใช้บริการและคำเตือนความเสี่ยงการลงทุน (Disclaimer)
            </h3>
            <div className="max-h-28 overflow-y-auto text-[11px] text-slate-400 leading-relaxed space-y-1 pr-2 border border-slate-900 p-2.5 rounded-xl bg-slate-900/40">
              <p>
                1. แพลตฟอร์มนี้เป็นเครื่องมือช่วยบันทึกพอร์ตและวิเคราะห์เบื้องต้นเท่านั้น <strong>มิใช่คำแนะนำทางการเงินหรือการชี้นำการซื้อขาย</strong>
              </p>
              <p>
                2. ผู้พัฒนาเว็บไซต์ <strong>จะไม่รับผิดชอบต่อความเสียหายใดๆ ทั้งสิ้น</strong> ที่เกิดจากการตัดสินใจลงทุนของผู้ใช้งาน ไม่ว่าในทางตรงหรือทางอ้อม
              </p>
              <p>
                3. ผู้ใช้งานตกลงสละสิทธิ์การเรียกร้องทางกฎหมายต่อผู้พัฒนาในทุกกรณี และรับทราบว่าการลงทุนมีความเสี่ยง
              </p>
            </div>

            <div className="flex items-start gap-2.5 pt-1">
              <input
                type="checkbox"
                id="terms"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                className="mt-1 h-4 w-4 rounded border-slate-700 bg-slate-900 text-green-600 focus:ring-green-500 cursor-pointer"
              />
              <label htmlFor="terms" className="text-xs text-slate-300 cursor-pointer select-none">
                ข้าพเจ้าอ่านและยอมรับเงื่อนไขการใช้บริการ นโยบายความเป็นส่วนตัว และข้อจำกัดความรับผิดทางกฎหมายของผู้พัฒนาทุกประการ
              </label>
            </div>
          </div>
        </div>

        {/* ปุ่มสมัครสมาชิก (จะกดได้ก็ต่อเมื่อกดยอมรับข้อตกลงแล้วเท่านั้น) */}
        <button
          type="submit"
          disabled={!agreedToTerms || loading}
          className={`mt-6 w-full rounded-xl p-3.5 text-sm font-bold text-white transition shadow-lg ${
            !agreedToTerms || loading
              ? "cursor-not-allowed bg-slate-800 text-slate-500 border border-slate-700 shadow-none"
              : "bg-green-600 hover:bg-green-500 cursor-pointer shadow-green-600/30"
          }`}
        >
          {loading ? "กำลังบันทึกข้อมูล..." : "สมัครสมาชิกและยอมรับเงื่อนไข"}
        </button>

        <p className="mt-6 text-center text-xs text-slate-400">
          มีบัญชีอยู่แล้ว?{" "}
          <button
            type="button"
            onClick={() => router.push("/login")}
            className="font-bold text-green-400 hover:underline cursor-pointer"
          >
            เข้าสู่ระบบ
          </button>
        </p>
      </form>
    </main>
  );
}