"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/library/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface MetricRow {
  type: string;
  value: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState("");

  // 1. Tambahkan State untuk Tanggal yang dipilih (Default: Hari Ini)
  const getTodayString = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offset).toISOString().split("T")[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [isEditMode, setIsEditMode] = useState(false);

  const [values, setValues] = useState<Record<string, string>>({
    kiln: "",
    mining: "",
    raw_mill: "",
    finish_mill: "",
    dispatch: "",
  });

  const types = ["kiln", "mining", "raw_mill", "finish_mill", "dispatch"];

  // 2. Fungsi Fetch Data berdasarkan tanggal yang dipilih
  const fetchDataByDate = async (date: string) => {
    setLoading(true);
    const { data, error } = await supabase.from("metrics").select("type, value").eq("recorded_at", date);

    if (!error && data && data.length > 0) {
      const resultData = data as MetricRow[];
      const newValues: Record<string, string> = {};
      // Reset dulu ke kosong sebelum diisi data lama
      types.forEach((t) => (newValues[t] = ""));

      resultData.forEach((item) => {
        newValues[item.type] = item.value.toString();
      });
      setValues(newValues);
      setIsEditMode(true);
    } else {
      // Jika tidak ada data, kosongkan form untuk input baru
      setValues({ kiln: "", mining: "", raw_mill: "", finish_mill: "", dispatch: "" });
      setIsEditMode(false);
    }
    setLoading(false);
  };

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
  }, [router, selectedDate]); // Trigger ulang setiap selectedDate berubah

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const updates = types.map((type) => ({
        type: type,
        value: Number(values[type]) || 0,
        recorded_at: selectedDate, // Gunakan tanggal yang dipilih
      }));

      const { error } = await supabase.from("metrics").upsert(updates, { onConflict: "type,recorded_at" });

      if (error) throw error;
      setMessage(`✅ Data berhasil ${isEditMode ? "diperbarui" : "disimpan"} untuk tanggal ${selectedDate}`);
    } catch (error) {
      if (error instanceof Error) {
        setMessage("❌ Gagal: " + error.message);
      }
    } finally {
      setLoading(false);
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
            <p className="text-slate-500 font-mono text-[10px] mt-2 uppercase tracking-[0.3em]">Historical Record Management</p>
          </header>

          {/* DATE SELECTOR SECTION - CRITICAL FOR UX */}
          {/* DATE SELECTOR SECTION */}
          <div className="mb-10 p-6 bg-cyan-500/5 border border-cyan-500/20 rounded-3xl">
            <label className="block text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em] mb-3 ml-1">Select Target Date</label>
            <input
              type="date"
              value={selectedDate}
              // TAMBAHKAN BARIS INI
              max={getTodayString()}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500 outline-none font-mono font-bold transition-all cursor-pointer"
            />
            <div className="mt-3 flex items-center gap-2 ml-1">
              <div className={`w-2 h-2 rounded-full ${isEditMode ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}></div>
              <span className="text-[9px] font-mono uppercase text-slate-400">Status: {isEditMode ? "Editing Existing Record" : "Creating New Record"}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {types.map((type) => (
                <div key={type} className="group">
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-cyan-400 transition-colors">{type.replace("_", " ")} (%)</label>
                  <input
                    type="number"
                    required
                    step="any"
                    value={values[type]}
                    onChange={(e) => setValues({ ...values, [type]: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:border-cyan-500 outline-none transition-all font-mono font-bold"
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-lg flex items-center justify-center gap-3"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div> : "TRANSMIT UPDATE"}
            </button>

            {message && (
              <div
                className={`p-4 rounded-xl text-center text-[10px] font-mono font-bold tracking-widest border ${
                  message.includes("Gagal") ? "bg-red-500/10 border-red-500/50 text-red-500" : "bg-green-500/10 border-green-500/50 text-green-400"
                }`}
              >
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
    </main>
  );
}
