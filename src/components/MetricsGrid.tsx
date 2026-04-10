"use client";

// 1. Definisikan Interface untuk struktur data unit
interface MetricItem {
  id: string | number;
  type: string;
  value: number;
}

// 2. Definisikan tipe untuk data sebelumnya (Record kunci string dengan nilai angka/string)
interface PreviousData {
  [key: string]: number | string | undefined;
}

const UNIT_THEME: Record<string, { color: string; label: string; order: number; id: string }> = {
  kiln: { color: "#00f2ff", label: "Primary Reactor", order: 1, id: "K-01" },
  mining: { color: "#39ff14", label: "Extraction", order: 2, id: "M-04" },
  raw_mill: { color: "#ffaa00", label: "Grinding", order: 3, id: "RM-02" },
  finish_mill: { color: "#ff00ff", label: "Processing", order: 4, id: "FM-07" },
  dispatch: { color: "#9d00ff", label: "Logistics", order: 5, id: "D-01" },
};

export default function MetricsGrid({ 
  latest, 
  previous 
}: { 
  latest: MetricItem[]; 
  previous: PreviousData | null | undefined 
}) {
  const kilnData = latest.find((d) => d.type === "kiln");
  const sortedOtherMetrics = latest
    .filter((d) => d.type !== "kiln")
    .sort((a, b) => (UNIT_THEME[a.type]?.order || 0) - (UNIT_THEME[b.type]?.order || 0));

  const getTrend = (currentValue: number, type: string) => {
    if (!previous || previous[type] === undefined) return { val: "0.0", isUp: true, percent: "0" };

    const prevValue = Number(previous[type]);
    const diff = currentValue - prevValue;
    const isUp = diff >= 0;
    const percent = prevValue !== 0 ? ((diff / prevValue) * 100).toFixed(1) : "0";

    return {
      val: Math.abs(diff).toFixed(1),
      isUp,
      percent: Math.abs(Number(percent)),
    };
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 shrink-0 h-[28%] min-h-[180px]">
      {/* KILN CARD */}
      {kilnData &&
        (() => {
          const trend = getTrend(kilnData.value, "kiln");
          return (
            <div className="md:col-span-2 relative overflow-hidden rounded-[2.5rem] p-5 border-2 border-slate-200 dark:border-cyan-500/20 bg-white/80 dark:bg-slate-900/40 shadow-xl dark:shadow-none flex flex-col justify-between group transition-all duration-500 hover:border-cyan-500/50">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em]">{UNIT_THEME.kiln.label}</span>
                  <h2 className="text-3xl font-black tracking-tighter uppercase text-slate-900 dark:text-white transition-colors">Kiln Unit</h2>
                </div>
              </div>

              <div className="relative z-10 flex items-end justify-between">
                <div className="flex items-baseline gap-3">
                  <span className="text-6xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-colors">
                    {kilnData.value}%
                  </span>
                  <div className="flex flex-col pb-2">
                    <p className={`text-[13px] font-mono font-bold ${trend.isUp ? "text-green-600 dark:text-green-500/50" : "text-red-600 dark:text-red-500/50"}`}>
                      {trend.isUp ? "+" : "-"}
                      {trend.val} % from the previous day
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[8px] font-mono text-slate-400 dark:text-slate-500 uppercase">Percentage</p>
                  <p className={`text-sm font-black font-mono ${trend.isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                    <span className="text-xs me-1 font-bold">{trend.isUp ? "▲" : "▼"}</span>
                    {trend.percent}%
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* OTHER CARDS */}
      <div className="md:col-span-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        {sortedOtherMetrics.map((item) => {
          const theme = UNIT_THEME[item.type];
          const trend = getTrend(item.value, item.type);

          return (
            <div key={item.id} className="relative overflow-hidden rounded-[2rem] p-5 border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 shadow-lg dark:shadow-none transition-all duration-500 hover:translate-y-[-4px] flex flex-col justify-between group">
              <div className="relative z-10 flex justify-between items-start">
                <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">{item.type.replace("_", " ")}</p>
                <div className={`text-[10px] font-bold font-mono ${trend.isUp ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
                  {trend.isUp ? "▲" : "▼"}
                  {trend.percent}%
                </div>
              </div>

              <div className="relative z-10 my-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900 dark:text-white transition-colors">{item.value}%</span>
                </div>
                <p className={`text-[12px] font-mono font-bold ${trend.isUp ? "text-green-600/60 dark:text-green-500/50" : "text-red-600/60 dark:text-red-500/50"}`}>
                  {trend.isUp ? "+" : "-"}
                  {trend.val}% from the previous day
                </p>
              </div>

              <div className="relative z-10 h-1 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                <div className="h-full transition-all duration-1000" style={{ width: `${item.value}%`, backgroundColor: theme?.color || "#cbd5e1", boxShadow: theme ? `0 0 10px ${theme.color}` : "none" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}