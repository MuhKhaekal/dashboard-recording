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
  kiln: { color: "#00f2ff", label: "", order: 1, id: "K-01" },
  mining: { color: "#39ff14", label: "Extraction", order: 2, id: "M-04" },
  raw_mill: { color: "#ffaa00", label: "Grinding", order: 3, id: "RM-02" },
  coal_mill: { color: "#fde047", label: "Fuel Processing", order: 4, id: "CM-05" },
  finish_mill: { color: "#ff00ff", label: "Processing", order: 4, id: "FM-07" },
  dispatch: { color: "#9d00ff", label: "Logistics", order: 5, id: "D-01" },
};

export default function MetricsGrid({ latest, previous }: { latest: MetricItem[]; previous: PreviousData | null | undefined }) {
  const kilnData = latest.find((d) => d.type === "kiln");
  const sortedOtherMetrics = latest.filter((d) => d.type !== "kiln").sort((a, b) => (UNIT_THEME[a.type]?.order || 0) - (UNIT_THEME[b.type]?.order || 0));

  // LOGIKA TREND BARU (UP, DOWN, FLAT)
  const getTrend = (currentValue: number, type: string) => {
    if (!previous || previous[type] === undefined) return { val: "0.00", status: "flat", percent: "0.00" };

    const prevValue = Number(previous[type]);
    const diff = currentValue - prevValue;

    let status = "flat";
    if (diff > 0) status = "up";
    else if (diff < 0) status = "down";

    const percent = prevValue !== 0 ? ((Math.abs(diff) / prevValue) * 100).toFixed(2) : "0.00";

    return {
      val: Math.abs(diff).toFixed(2),
      status, 
      percent: percent,
    };
  };

  const getTrendColor = (status: string, isSubtle = false) => {
    if (status === "up") return isSubtle ? "text-green-600/80 dark:text-green-500/60" : "text-green-600 dark:text-green-400";
    if (status === "down") return isSubtle ? "text-red-600/80 dark:text-red-500/60" : "text-red-600 dark:text-red-400";
    return isSubtle ? "text-slate-500/80 dark:text-slate-500/60" : "text-slate-500 dark:text-slate-400"; 
  };

  const getTrendIcon = (status: string) => {
    if (status === "up") return "▲";
    if (status === "down") return "▼";
    return "▬"; 
  };

  const getMathSymbol = (status: string) => {
    if (status === "up") return "+";
    if (status === "down") return "-";
    return ""; 
  };

  return (
    /* Grid Induk - Menggunakan min-height dinamis berdasarkan layar */
    <div className="grid grid-cols-1 md:grid-cols-7 gap-3 xl:gap-4 shrink-0 h-auto min-h-[160px] md:min-h-[180px] 2xl:min-h-[220px] w-full">
      
      {/* 1. KILN CARD */}
      {kilnData &&
        (() => {
          const trend = getTrend(kilnData.value, "kiln");
          return (
            <div className="md:col-span-2 relative overflow-hidden rounded-[2rem] 2xl:rounded-[2.5rem] p-4 xl:p-5 2xl:p-8 border-2 border-slate-200 dark:border-cyan-500/30 bg-white/80 dark:bg-slate-900/40 shadow-xl dark:shadow-none flex flex-col justify-between group transition-all duration-500 hover:border-cyan-500/60">
              <div className="relative z-10 flex justify-between items-start">
                <div>
                  <span className="text-[10px] xl:text-xs font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-[0.3em]">{UNIT_THEME.kiln.label}</span>
                  {/* Teks "Kiln" elastis: text-2xl di laptop kecil, membesar ke text-4xl di PC */}
                  <h2 className="text-2xl md:text-3xl 2xl:text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white transition-colors">Kiln</h2>
                </div>
              </div>

              <div className="relative z-10 flex items-end justify-between mt-2 xl:mt-4">
                <div className="gap-2 xl:gap-3">
                  {/* Angka persentase Kiln membesar menyesuaikan layar */}
                  <span className="text-4xl md:text-5xl xl:text-6xl 2xl:text-7xl font-black tracking-tighter text-slate-900 dark:text-white drop-shadow-[0_0_20px_rgba(0,242,255,0.4)] transition-colors">
                    {kilnData.value.toFixed(2)}%
                  </span>
                  <div className="flex flex-col pb-1 mt-1">
                    <p className={`text-[10px] xl:text-sm font-mono font-bold ${getTrendColor(trend.status, true)}`}>
                      {getMathSymbol(trend.status)}
                      {trend.val}% from yesterday
                    </p>
                  </div>
                </div>
                <div className="text-right pb-1">
                  <p className="text-[8px] xl:text-[10px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest">Growth</p>
                  <p className={`text-sm xl:text-lg font-black font-mono tracking-tighter ${getTrendColor(trend.status)}`}>
                    <span className="text-[10px] xl:text-sm me-1 font-bold">{getTrendIcon(trend.status)}</span>
                    {trend.percent}%
                  </p>
                </div>
              </div>
            </div>
          );
        })()}

      {/* 2. OTHER CARDS */}
      {sortedOtherMetrics.map((item) => {
        const theme = UNIT_THEME[item.type];
        const trend = getTrend(item.value, item.type);

        return (
          <div
            key={item.id}
            className="md:col-span-1 relative overflow-hidden rounded-[1.5rem] 2xl:rounded-[2.5rem] p-3 xl:p-4 2xl:p-6 border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/40 shadow-lg dark:shadow-none transition-all duration-500 hover:translate-y-[-4px] flex flex-col justify-between group"
          >
            <div className="relative z-10 flex justify-between items-start">
              {/* Nama Area */}
              <p className="text-[9px] xl:text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none pr-1">
                {item.type.replace("_", " ")}
              </p>
              {/* Persentase Kecil */}
              <div className={`text-[9px] xl:text-xs font-bold font-mono shrink-0 tracking-tighter ${getTrendColor(trend.status)}`}>
                {getTrendIcon(trend.status)} {trend.percent}%
              </div>
            </div>

            <div className="relative z-10 my-2 xl:my-4">
              <div className="flex items-baseline gap-1">
                {/* Angka persentase Area lain membesar dari 2xl (laptop) ke 5xl (monitor PC) */}
                <span className="text-2xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-black text-slate-900 dark:text-white transition-colors tracking-tighter">
                  {item.value.toFixed(2)}%
                </span>
              </div>
              <p className={`text-[8px] xl:text-[11px] mt-1 font-mono font-bold leading-tight ${getTrendColor(trend.status, true)}`}>
                {getMathSymbol(trend.status)}{trend.val}% from yesterday
              </p>
            </div>

            {/* Bar Indikator - Ketebalan dinamis */}
            <div className="relative z-10 h-1 2xl:h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
              <div
                className="h-full transition-all duration-1000"
                style={{
                  width: `${item.value}%`,
                  backgroundColor: theme?.color || "#cbd5e1",
                  boxShadow: theme ? `0 0 10px ${theme.color}` : "none",
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}