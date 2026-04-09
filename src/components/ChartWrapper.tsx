'use client';
import dynamic from "next/dynamic";

const TrendChart = dynamic(() => import("@/components/TrendChart"), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-900/40 animate-pulse rounded-[2rem]" />
});

const DistributionChart = dynamic(() => import("@/components/DistributionChart"), { 
    ssr: false,
    loading: () => <div className="h-full w-full bg-slate-900/40 animate-pulse rounded-[2rem]" />
});

export default function ChartWrapper({ history, latest }: { history: any[], latest: any[] }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-full min-h-0">
      <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden group hover:border-cyan-500/30 transition-colors duration-500">
        <TrendChart data={history} />
      </div>

      <div className="bg-slate-900/40 backdrop-blur-xl p-6 rounded-[2rem] border border-slate-800 shadow-2xl h-full flex flex-col overflow-hidden group hover:border-cyan-500/30 transition-colors duration-500">
        <DistributionChart data={latest} />
      </div>
    </div>
  );
} 