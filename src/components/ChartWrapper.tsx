'use client';
import dynamic from "next/dynamic";

// 1. Definisikan Interface agar TypeScript tidak protes
interface MetricData {
  type: string;
  value: number;
  recorded_at?: string;
}

interface HistoryData {
  date: string;
  [key: string]: string | number; // Memungkinkan key dinamis seperti kiln, mining, dll
}

const TrendChart = dynamic(() => import("@/components/TrendChart"), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-900/40 animate-pulse rounded-[2rem]" />
});

const DistributionChart = dynamic(() => import("@/components/DistributionChart"), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-100 dark:bg-slate-900/40 animate-pulse rounded-[2rem]" />
});

// 2. Gunakan Interface pada Props
export default function ChartWrapper({ history, latest }: { history: HistoryData[], latest: MetricData[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
      
      {/* TREND CHART CONTAINER */}
      <div className="lg:col-span-2 bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl h-full flex flex-col overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
        <TrendChart data={history} />
      </div>

      {/* DISTRIBUTION CHART CONTAINER */}
      <div className="bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl dark:shadow-2xl h-full flex flex-col overflow-hidden group hover:border-cyan-500/30 transition-all duration-500">
        <DistributionChart data={latest} />
      </div>

    </div>
  );
}