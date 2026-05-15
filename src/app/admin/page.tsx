"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/library/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MetricRow {
  type: string;
  value: number;
}

interface HistoryRow {
  date: string;
  planning?: number;
  kiln?: number;
  mining?: number;
  raw_mill?: number;
  coal_mill?: number;
  finish_mill?: number;
  dispatch?: number;
  [key: string]: string | number | undefined;
  // ^ Baris ini penting agar kamu tetap bisa memanggil data dengan cara dinamis seperti row[t] di dalam perulangan map()
}

export default function AdminPage() {
  const router = useRouter();

  // ==========================================
  // 1. DEKLARASI SEMUA STATE DI PALING ATAS
  // ==========================================
  const [loadingPlanning, setLoadingPlanning] = useState(false);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState(""); // <-- message sudah aman di sini!
  const [historyData, setHistoryData] = useState<HistoryRow[]>([]);

  const getTodayString = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isEditMode, setIsEditMode] = useState(false);
  const [planningValue, setPlanningValue] = useState<string>("");
  const [values, setValues] = useState<Record<string, string>>({
    kiln: "",
    mining: "",
    raw_mill: "",
    coal_mill: "",
    finish_mill: "",
    dispatch: "",
  });

  const types = ["kiln", "mining", "raw_mill", "coal_mill", "finish_mill", "dispatch"];

  // ==========================================
  // 2. SEMUA FUNGSI FETCH
  // ==========================================
  const fetchAllHistory = async () => {
    const [mRes, pRes] = await Promise.all([supabase.from("metrics").select("*").order("recorded_at", { ascending: false }), supabase.from("daily_planning").select("*").order("recorded_at", { ascending: false })]);

    const mData = mRes.data || [];
    const pData = pRes.data || [];
    const merged: Record<string, HistoryRow> = {};

    mData.forEach((item) => {
      if (!merged[item.recorded_at]) merged[item.recorded_at] = { date: item.recorded_at };
      merged[item.recorded_at][item.type] = item.value;
    });

    pData.forEach((item) => {
      if (!merged[item.recorded_at]) merged[item.recorded_at] = { date: item.recorded_at };
      merged[item.recorded_at].planning = item.planned_value;
    });

    setHistoryData(Object.values(merged).sort((a, b) => b.date.localeCompare(a.date)));
  };

  const fetchDataByDate = async (date: string) => {
    setLoadingPlanning(true);
    setLoadingMetrics(true);
    setMessage(""); // Reset pesan saat ganti tanggal

    // 1. Fetch Metrics (Aktual)
    const { data: metricsData, error: metricsError } = await supabase.from("metrics").select("type, value").eq("recorded_at", date);

    // 2. Fetch Planning (S-Curve)
    const { data: planningData, error: planningError } = await supabase.from("daily_planning").select("planned_value").eq("recorded_at", date).maybeSingle();

    const initialValues: Record<string, string> = {};
    types.forEach((t) => (initialValues[t] = ""));

    let dataExists = false;

    if (!metricsError && metricsData && metricsData.length > 0) {
      const resultData = metricsData as MetricRow[];
      resultData.forEach((item) => {
        if (initialValues.hasOwnProperty(item.type)) {
          initialValues[item.type] = item.value.toString();
        }
      });
      dataExists = true;
    }
    setValues(initialValues);

    if (!planningError && planningData) {
      setPlanningValue(planningData.planned_value.toString());
      dataExists = true;
    } else {
      setPlanningValue("");
    }

    setIsEditMode(dataExists);
    setLoadingPlanning(false);
    setLoadingMetrics(false);
  };

  // ==========================================
  // 3. SEMUA USE-EFFECT (Sekarang aman memanggil state)
  // ==========================================
  useEffect(() => {
    fetchAllHistory();
  }, [message]); // Sekarang aman karena 'message' sudah diinisialisasi di atas

  useEffect(() => {
    const initializeAdmin = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }
      await fetchDataByDate(selectedDate);
      setCheckingAuth(false);
    };
    initializeAdmin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, selectedDate]);

  // ==========================================
  // HANDLER 1: KHUSUS SUBMIT PLANNING (S-CURVE)
  // ==========================================
  const handlePlanningSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingPlanning(true);
    setMessage("");

    try {
      const rawPlanValue = planningValue.toString().replace(",", ".") || "0";
      const planningUpdate = {
        recorded_at: selectedDate,
        planned_value: parseFloat(rawPlanValue) || 0,
      };

      const { error: planningError } = await supabase.from("daily_planning").upsert(planningUpdate, { onConflict: "recorded_at" });

      if (planningError) throw new Error(planningError.message);

      setMessage(`✅ Data PLANNING berhasil diperbarui untuk tanggal ${selectedDate}`);
      setIsEditMode(true);
    } catch (error) {
      if (error instanceof Error) {
        setMessage("❌ Gagal Simpan Planning: " + error.message);
      }
    } finally {
      setLoadingPlanning(false);
    }
  };

  // ==========================================
  // HANDLER 2: KHUSUS SUBMIT METRICS (AKTUAL)
  // ==========================================
  const handleMetricsSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingMetrics(true);
    setMessage("");

    try {
      const updates = types.map((type) => {
        const rawValue = values[type]?.toString().replace(",", ".") || "0";
        return {
          type: type,
          value: parseFloat(rawValue) || 0,
          recorded_at: selectedDate,
        };
      });

      const { error: metricsError } = await supabase.from("metrics").upsert(updates, { onConflict: "type,recorded_at" });

      if (metricsError) throw new Error(metricsError.message);

      setMessage(`✅ Data ACTUAL METRICS berhasil diperbarui untuk tanggal ${selectedDate}`);
      setIsEditMode(true);
    } catch (error) {
      if (error instanceof Error) {
        setMessage("❌ Gagal Simpan Metrics: " + error.message);
      }
    } finally {
      setLoadingMetrics(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <main className="p-4 md:p-8 min-h-screen bg-[#020617] text-white">
      <div className="max-w-2xl mx-auto">
        {/* TOP NAVIGATION */}
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-cyan-400/70 hover:text-cyan-400 transition-colors font-mono text-xs uppercase tracking-[0.2em]">
            ← Dashboard
          </Link>
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              router.push("/login");
            }}
            className="text-[10px] font-bold text-red-500/70 hover:text-red-500 uppercase tracking-widest"
          >
            Sign Out
          </button>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-6 md:p-10 rounded-[2.5rem] shadow-2xl relative">
          <header className="mb-10 text-center md:text-left">
            <h1 className="text-3xl font-black tracking-tighter uppercase">
              Data <span className="text-cyan-400">Editor</span>
            </h1>
            <p className="text-slate-500 font-mono text-[10px] mt-2 uppercase tracking-[0.3em]">Historical & Planning Record Management</p>
          </header>

          {/* DATE SELECTOR SECTION */}
          <div className="mb-10 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl">
            <label className="block text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-3 ml-1">Select Target Date</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none font-mono font-bold transition-all cursor-pointer"
            />
            <div className="mt-3 flex items-center gap-2 ml-1">
              <div className={`w-2 h-2 rounded-full ${isEditMode ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}></div>
              <span className="text-[9px] font-mono uppercase text-slate-400">Status: {isEditMode ? "Editing Existing Record" : "Creating New Record"}</span>
            </div>
          </div>

          {/* GLOBAL MESSAGE ALERT */}
          {message && (
            <div
              className={`p-4 mb-8 rounded-xl text-center text-[10px] font-mono font-bold tracking-widest border ${
                message.includes("Gagal") ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-green-500/10 border-green-500/50 text-green-400"
              }`}
            >
              {message}
            </div>
          )}

          {/* ==================================================== */}
          {/* FORM 1: PLANNING (S-CURVE)                           */}
          {/* ==================================================== */}
          <form onSubmit={handlePlanningSubmit} className="mb-12 border-b border-slate-800/80 pb-12">
            <div className="p-6 bg-purple-500/5 border border-purple-500/30 rounded-3xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
              <label className="block text-[12px] font-black text-purple-400 uppercase tracking-[0.2em] mb-2 ml-1">TOTAL PLANNING S-CURVE (%)</label>
              <p className="text-[9px] font-mono text-slate-500 mb-4 ml-1">Input target akumulasi progress untuk tanggal yang dipilih.</p>
              <input
                type="number"
                required
                step="any"
                inputMode="decimal"
                lang="en-US"
                value={planningValue}
                onChange={(e) => setPlanningValue(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950/80 border border-purple-500/50 rounded-2xl p-4 text-purple-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all font-mono font-black text-xl"
              />
              <button
                type="submit"
                disabled={loadingPlanning || loadingMetrics}
                className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 text-xs"
              >
                {loadingPlanning ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "TRANSMIT PLANNING"}
              </button>
            </div>
          </form>

          {/* ==================================================== */}
          {/* FORM 2: ACTUAL METRICS                               */}
          {/* ==================================================== */}
          <form onSubmit={handleMetricsSubmit} className="space-y-6">
            <h3 className="text-sm font-black text-cyan-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500"></div>
              Actual Metrics Input
            </h3>
            <p className="text-[9px] font-mono text-slate-500 mb-6 -mt-3 ml-3">Jangan diisi/dikirim jika data aktual untuk tanggal ini belum ada.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {types.map((type) => (
                <div key={type} className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-cyan-400 transition-colors">{type.replace("_", " ")} (%)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    inputMode="decimal"
                    lang="en-US"
                    value={values[type] ?? ""} // Dikembalikan ke string kosong ("") agar tidak otomatis nol
                    onChange={(e) => setValues({ ...values, [type]: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-cyan-500 outline-none transition-all font-mono font-bold"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loadingMetrics || loadingPlanning}
              className="w-full mt-4 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] transition-all shadow-lg flex items-center justify-center gap-3 text-xs"
            >
              {loadingMetrics ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "TRANSMIT ACTUAL METRICS"}
            </button>
          </form>

          {/* ==================================================== */}
          {/* SECTION 3: DATA LOG TABLE                            */}
          {/* ==================================================== */}
          <div className="mt-16 pt-10 border-t border-slate-800">
            <header className="mb-6 flex justify-between items-end">
              <div>
                <h3 className="text-xl font-black uppercase tracking-tighter">
                  Master <span className="text-cyan-400">Data Log</span>
                </h3>
                <p className="text-[9px] font-mono text-slate-500 uppercase tracking-widest mt-1">Full database synchronization records</p>
              </div>
            </header>

            <div className="overflow-x-auto rounded-3xl border border-slate-800 bg-slate-950/50 backdrop-blur-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-900/80 border-b border-slate-800">
                    <th className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-tighter">Date</th>
                    {types.map((t) => (
                      <th key={t} className="p-4 text-[10px] font-black uppercase text-slate-400 tracking-tighter">
                        {t.replace("_", " ")}
                      </th>
                    ))}
                    <th className="p-4 text-[10px] font-black uppercase text-purple-400 tracking-tighter">Planning</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {historyData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-cyan-500/5 transition-colors group">
                      <td className="p-4 font-mono text-[11px] text-cyan-500 font-bold">{new Date(row.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "2-digit" })}</td>
                      {types.map((t) => (
                        <td key={t} className="p-4 font-mono text-[11px] text-slate-300">
                          {row[t] !== undefined ? `${Number(row[t]).toFixed(2)}%` : "-"}
                        </td>
                      ))}
                      <td className="p-4 font-mono text-[11px] text-purple-400 font-bold">{row.planning !== undefined ? `${Number(row.planning).toFixed(2)}%` : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {historyData.length === 0 && <div className="p-20 text-center text-slate-600 font-mono text-xs italic">No data records found in database.</div>}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
