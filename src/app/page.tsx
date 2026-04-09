import { supabase } from "@/library/supabase";
import TrendChart from "@/components/TrendChart";
import DistributionChart from "@/components/DistributionChart";
import MetricsGrid from "@/components/MetricsGrid";
import Header from "@/components/Header";

// 1. Definisikan Interface untuk Data Supabase
interface RawMetric {
  id: number;
  recorded_at: string;
  type: string;
  value: number;
}

interface GroupedData {
  date: string;
  [key: string]: string | number; // Memungkinkan akses dynamic key seperti 'kiln', 'mining', dll
}

async function getDashboardData() {
  const { data, error } = await supabase.from("metrics").select("*").order("recorded_at", { ascending: true }).limit(150);

  if (error || !data || data.length === 0) return { latest: [], history: [] };

  // Cast data ke interface RawMetric
  const metrics = data as RawMetric[];

  const latestDate = metrics[metrics.length - 1].recorded_at;
  const latestMetrics = metrics.filter((d) => d.recorded_at === latestDate);

  // 2. Perbaikan 'any' pada reduce
  const groupedData = metrics.reduce<Record<string, GroupedData>>((acc, curr) => {
    const date = curr.recorded_at;
    if (!acc[date]) {
      acc[date] = { date };
    }
    acc[date][curr.type] = curr.value;
    return acc;
  }, {});

  return { latest: latestMetrics, history: Object.values(groupedData) };
}

export default async function DashboardPage() {
  const { latest, history } = await getDashboardData();
  const today = new Intl.DateTimeFormat("en-EN", { dateStyle: "full" }).format(new Date());
  const previousData = history.length > 1 ? history[history.length - 2] : null;

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
        <Header today={today} />

        <div className="shrink-0 mb-6 overflow-x-auto pb-2 scrollbar-hide">
          <MetricsGrid latest={latest} previous={previousData} />
        </div>

        <div className="h-[450px] lg:flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-4 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl overflow-hidden transition-all duration-500">
          <TrendChart data={history} />
        </div>
      </div>

      <div className="relative z-10 w-full lg:w-[420px] flex flex-col gap-4">
        <div className="relative flex overflow-x-hidden bg-white/70 dark:bg-slate-900/40 backdrop-blur-md border border-slate-200 dark:border-slate-800 p-3 rounded-2xl gap-3">
          <div className="flex shrink-0 items-center gap-2 px-2 border-r border-slate-200 dark:border-slate-800 z-10 bg-inherit">
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]"></div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Logs</span>
          </div>

          {/* Pengganti Marquee dengan Animasi CSS */}
          <div className="animate-marquee whitespace-nowrap flex gap-4 text-[10px] font-mono text-slate-500 dark:text-slate-400">
            <span>System Sync Complete ...</span>
            <span>Database Latency: 24ms ...</span>
            <span>Kiln Overhaul Phase 2 Initiated ...</span>
            <span>Monitoring P12 Tarjun Node ...</span>
          </div>
        </div>

        <div className="md:h-[600px] h-[800px] mt-3 md:mt-0 lg:flex-1 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl flex flex-col overflow-hidden group hover:border-cyan-500/30 transition-all duration-700">
          <DistributionChart data={latest} />
        </div>
      </div>
    </main>
  );
}
