export default function DashboardLayout() {
  return (
    <section className="bg-slate-950 py-24">
      <div className="mx-auto max-w-7xl px-8">

        <div className="rounded-3xl border border-slate-800 bg-slate-900 p-8">

          <div className="mb-8">
            <h2 className="text-4xl font-bold text-white">
              Dashboard
            </h2>

            <p className="mt-2 text-slate-400">
              ภาพรวมการลงทุนของคุณ
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-4">

            <div className="rounded-2xl bg-slate-800 p-6">
              <p className="text-slate-400">Cash</p>
              <h3 className="mt-2 text-3xl font-bold text-white">
                ฿150,000
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-800 p-6">
              <p className="text-slate-400">Investment</p>
              <h3 className="mt-2 text-3xl font-bold text-white">
                ฿380,000
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-800 p-6">
              <p className="text-slate-400">Profit</p>
              <h3 className="mt-2 text-3xl font-bold text-green-400">
                +18.42%
              </h3>
            </div>

            <div className="rounded-2xl bg-slate-800 p-6">
              <p className="text-slate-400">Alerts</p>
              <h3 className="mt-2 text-3xl font-bold text-yellow-400">
                3
              </h3>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}