import { supabase } from "@/library/supabase";
import TrendChart from "@/components/TrendChart";
import DistributionChart from "@/components/DistributionChart";
import MetricsGrid from "@/components/MetricsGrid";
import Header from "@/components/Header";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// 1. Definisikan Interface untuk Data Supabase
interface RawMetric {
  id: number;
  recorded_at: string;
  type: string;
  value: number;
}

interface DailyPlanningRow {
  recorded_at: string;
  planned_value: number;
}

interface GroupedData {
  date: string;
  total_actual?: number;
  planned_value?: number;
  [key: string]: string | number | undefined;
}

async function getDashboardData() {
  // Ambil data Metrics (Aktual) dan Planning secara paralel agar lebih cepat
  const [metricsResponse, planningResponse] = await Promise.all([
    supabase.from("metrics").select("*").order("recorded_at", { ascending: true }).limit(500),
    supabase.from("daily_planning").select("recorded_at, planned_value").order("recorded_at", { ascending: true }),
  ]);

  const metrics = (metricsResponse.data || []) as RawMetric[];
  const plannings = (planningResponse.data || []) as DailyPlanningRow[];

  if (metrics.length === 0 && plannings.length === 0) {
    return { latest: [], history: [], lastUpdated: null };
  }

  // Objek penampung untuk menggabungkan data berdasarkan tanggal
  const dataMap: Record<string, GroupedData> = {};

  // 1. Olah Data Metrics Aktual
  metrics.forEach((curr) => {
    const date = curr.recorded_at.split("T")[0];
    if (!dataMap[date]) {
      dataMap[date] = { date };
    }

    // Masukkan nilai per unit (kiln, mining, dll)
    dataMap[date][curr.type] = curr.value;

    // Kalkulasi total_actual (penjumlahan otomatis 6 area)
    dataMap[date].total_actual = (dataMap[date].total_actual || 0) + curr.value;
  });

  // 2. Olah Data Planning (S-Curve)
  plannings.forEach((curr) => {
    const date = curr.recorded_at.split("T")[0];
    if (!dataMap[date]) {
      // Jika tanggal ini ada di planning tapi belum ada di aktual (tanggal masa depan)
      dataMap[date] = { date };
    }
    // Masukkan nilai planning
    dataMap[date].planned_value = curr.planned_value;
  });

  // Konversi Map kembali ke Array dan urutkan berdasarkan tanggal
  const historyArray = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date));

  // 3. Ambil Data 'Latest' HANYA dari Metrics yang sudah terisi (untuk Grid & Pie Chart)
  let latestMetrics: RawMetric[] = [];
  let latestDate: string | null = null;

  if (metrics.length > 0) {
    // Cari tanggal terakhir dari data metrik aktual, bukan dari planning masa depan
    latestDate = metrics[metrics.length - 1].recorded_at;
    latestMetrics = metrics.filter((d) => d.recorded_at === latestDate);
  }

  return {
    latest: latestMetrics,
    history: historyArray,
    lastUpdated: latestDate,
  };
}

export default async function DashboardPage() {
  const { latest, history, lastUpdated } = await getDashboardData();
  const todayRaw = new Date();
  const todayFormatted = new Intl.DateTimeFormat("en-EN", { dateStyle: "full" }).format(todayRaw);

  // Ambil data previous HANYA dari tanggal yang memiliki metrik aktual (bukan sekadar planning)
  const actualHistory = history.filter((h) => h.total_actual !== undefined);
  const previousData = actualHistory.length > 1 ? actualHistory[actualHistory.length - 2] : null;

  return (
    <main className="relative bg-slate-50 dark:bg-[#020617] min-h-screen lg:h-screen w-full text-slate-900 dark:text-white flex flex-col lg:flex-row p-4 md:p-6 gap-6 transition-colors duration-500 overflow-y-auto lg:overflow-hidden">
      {/* ENGINEERING GRID OVERLAY */}
      <div
        className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)`, backgroundSize: "30px 30px" }}
      ></div>

      {/* BACKGROUND BLOBS */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-100">
        <div className="absolute top-[-10%] left-[-5%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-purple-400/20 dark:bg-purple-600/20 rounded-full blur-[100px] md:blur-[120px] animate-blob-slow"></div>
        <div className="absolute top-[20%] right-[-10%] w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-cyan-400/20 dark:bg-cyan-600/15 rounded-full blur-[110px] md:blur-[130px] animate-blob-medium"></div>
      </div>

      <div className="relative z-10 flex flex-col flex-1 min-w-0">
        <Header today={todayFormatted} lastUpdated={lastUpdated} />

        <div className="shrink-0 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <MetricsGrid latest={latest} previous={previousData} />
        </div>

        <div className="h-[450px] lg:flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-500">
          <TrendChart data={history} />
        </div>
      </div>

      <div className="relative z-10 w-full lg:w-[420px] flex flex-col gap-4">
        <div className="relative flex overflow-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-2xl">
          <div className="flex shrink-0 items-center gap-2 px-3 pr-4 border-r border-slate-200 dark:border-slate-800 z-20 bg-white dark:bg-[#0f172a] relative">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-[9px] font-black uppercase tracking-tighter text-slate-700 dark:text-slate-300">Logs</span>
            <div className="absolute top-0 -right-8 w-8 h-full bg-gradient-to-r from-white dark:from-[#0f172a] to-transparent pointer-events-none"></div>
          </div>

          <div className="relative flex-1 overflow-hidden">
            <div className="animate-marquee whitespace-nowrap flex gap-10 text-[10px] font-mono text-slate-500 dark:text-slate-400 py-0.5">
              <span>System Sync Complete ...</span>
              <span>Database Latency: 24ms ...</span>
              <span>Kiln Overhaul Phase 2 Initiated ...</span>
              <span>Monitoring P12 Tarjun Node ...</span>
              <span>System Sync Complete ...</span>
              <span>Database Latency: 24ms ...</span>
            </div>
          </div>
        </div>

        <div className="md:h-[600px] h-[800px] mt-3 md:mt-0 lg:flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl flex flex-col overflow-hidden group hover:border-cyan-500/30 transition-all duration-700">
          <DistributionChart data={latest} />
        </div>
      </div>
    </main>
  );
}
