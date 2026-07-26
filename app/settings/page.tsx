"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Navbar from "@/components/Navbar";
import { Language } from "@/lib/i18n";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [isVip, setIsVip] = useState(false);
  const [referredBy, setReferredBy] = useState("");

  const [lang, setLang] = useState<Language>("th");

  // ฟังก์ชันดึงข้อมูลล่าสุดจาก Supabase (รองรับการอัปเดตทันทีเมื่อแอดมินเปลี่ยนค่า)
  async function loadUserData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      setFirstName(profile.first_name || "");
      setLastName(profile.last_name || "");
      setPhone(profile.phone || "");
      setAddress(profile.address || "");
      setIsVip(!!profile.is_vip);
      setReferredBy(profile.referred_by || ""); // โหลดรหัสผู้แนะนำล่าสุดจากฐานข้อมูล
    }
    setLoading(false);
  }

  useEffect(() => {
    loadUserData();
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        phone: phone.trim(),
        address: address.trim(),
      })
      .eq("id", user.id);

    setSaving(false);

    if (error) {
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล: " + error.message);
    } else {
      alert("บันทึกการเปลี่ยนแปลงข้อมูลส่วนตัวสำเร็จ!");
      loadUserData(); // โหลดข้อมูลใหม่หลังบันทึก
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white text-sm">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
          กำลังโหลดข้อมูลบัญชี...
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar lang={lang} setLang={setLang} />

      <div className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-3xl border border-indigo-500/20 bg-gradient-to-b from-slate-900/90 to-[#0c101d] p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-800/80 pb-6 mb-8 gap-4">
            <div>
              <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                🔒 ข้อมูลยืนยันตัวตน
              </span>
              <h1 className="text-2xl md:text-3xl font-extrabold text-white mt-2 flex items-center gap-3">
                ตั้งค่าบัญชีและข้อมูลส่วนตัว
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                จัดการข้อมูลการติดต่อของคุณ ชื่อจริงและนามสกุลถูกล็อกไว้ถาวรเพื่อความปลอดภัย
              </p>
            </div>
            
            {isVip ? (
              <span className="bg-purple-600/20 text-purple-300 border border-purple-500/40 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shadow-lg w-fit">
                ⭐ VIP Member
              </span>
            ) : (
              <span className="bg-slate-800 text-slate-300 border border-slate-700 px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 w-fit">
                👤 Free Member
              </span>
            )}
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5 rounded-2xl bg-slate-950/60 border border-slate-800">
              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>ชื่อจริง (ล็อกถาวร)</span>
                  <span>🔒</span>
                </label>
                <input
                  type="text"
                  value={firstName}
                  disabled
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-400 cursor-not-allowed shadow-inner select-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider flex items-center justify-between">
                  <span>นามสกุล (ล็อกถาวร)</span>
                  <span>🔒</span>
                </label>
                <input
                  type="text"
                  value={lastName}
                  disabled
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-slate-400 cursor-not-allowed shadow-inner select-none"
                />
              </div>
              <div className="md:col-span-2">
                <p className="text-[11px] text-slate-400 bg-slate-900/50 p-2.5 rounded-xl border border-slate-800">
                  ℹ️ ชื่อและนามสกุลจริงถูกดึงมาจากข้อมูลที่คุณลงทะเบียนไว้ครั้งแรก ไม่สามารถเปลี่ยนแปลงได้ หากต้องการความช่วยเหลือกรุณาติดต่อแอดมิน
                </p>
              </div>
            </div>

            {/* แสดงรหัสผู้แนะนำที่อัปเดตจากระบบ/แอดมิน */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-indigo-400 uppercase tracking-wider">
                  🤝 รหัสผู้แนะนำของคุณ (Referral Sponsor)
                </label>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-bold">
                  🔒 ล็อกถาวรโดยระบบ
                </span>
              </div>
              <input
                type="text"
                value={referredBy || "ไม่มีผู้แนะนำ ( สมัครโดยตรง )"}
                disabled
                className="w-full rounded-xl border border-slate-800 bg-slate-900/80 px-4 py-3 text-sm text-indigo-300 font-mono cursor-not-allowed shadow-inner select-none"
              />
              <p className="text-[11px] text-slate-400">
                ℹ️ รหัสนี้แสดงตามข้อมูลที่บันทึกในระบบ (หากแอดมินทำการเปลี่ยนแปลงในระบบ ข้อมูลจะอัปเดตแสดงผลที่นี่ทันที)
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
                เบอร์โทรศัพท์สำหรับติดต่อ
              </label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0812345678"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none shadow-inner transition"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-2 uppercase tracking-wide">
                ที่อยู่จัดส่งเอกสาร / ข้อมูล
              </label>
              <textarea
                rows={3}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="บ้านเลขที่, ถนน, ตำบล, อำเภอ, จังหวัด, รหัสไปรษณีย์"
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white focus:border-indigo-500 focus:outline-none shadow-inner transition"
              />
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-5 space-y-3">
              <h3 className="text-xs font-extrabold text-indigo-400 uppercase tracking-wider">
                📜 เงื่อนไขและข้อตกลงการใช้บริการพอร์ตการลงทุน
              </h3>
              <div className="max-h-32 overflow-y-auto text-[11px] text-slate-400 leading-relaxed space-y-2 pr-2 border border-slate-900 p-3 rounded-xl bg-slate-900/40">
                <p>1. ข้อมูลทั้งหมดที่คุณได้ลงทะเบียนไว้เป็นหลักฐานยืนยันตัวตนในการเข้าใช้งานระบบพอร์ตการลงทุน</p>
                <p>2. เครื่องมือและข้อมูลในเว็บไซต์นี้จัดทำขึ้นเพื่อประกอบการวิเคราะห์ส่วนบุคคลเท่านั้น มิใช่คำแนะนำทางการเงินหรือการชักชวนลงทุนแต่อย่างใด</p>
                <p>3. ผู้พัฒนาเว็บไซต์ได้รับความคุ้มครองและไม่มีส่วนรับผิดชอบต่อความเสียหายใดๆ จากการลงทุนของผู้ใช้งาน</p>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-800/80">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-8 py-3.5 text-sm font-bold text-white transition flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer"
              >
                <span>💾</span> {saving ? "กำลังบันทึก..." : "บันทึกการเปลี่ยนแปลง"}
              </button>
            </div>

          </form>
        </div>
      </div>
    </main>
  );
}