"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { useTheme } from "next-themes";

const NEON_COLOR_MAP: Record<string, string> = {
  KILN: "#00f2ff",
  MINING: "#39ff14",
  "RAW MILL": "#ffaa00",
  "FINISH MILL": "#ff00ff",
  DISPATCH: "#9d00ff",
};

const MODES = ["ALL", "KILN", "MINING", "RAW MILL", "FINISH MILL", "DISPATCH"];
const LEGEND_ORDER = ["KILN", "MINING", "RAW MILL", "FINISH MILL", "DISPATCH"];

const renderActiveShape = (props: any) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.2} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function DistributionChart({ data }: { data: any[] }) {
  const [mounted, setMounted] = useState(false);
  const [activeMode, setActiveMode] = useState("ALL");
  const [manualHoverIndex, setManualHoverIndex] = useState<number | null>(null);
  const { theme } = useTheme();

  const nextMode = useCallback(() => {
    setActiveMode((prev) => {
      const currentIndex = MODES.indexOf(prev);
      return MODES[(currentIndex + 1) % MODES.length];
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(nextMode, 10000);
    return () => clearInterval(interval);
  }, [nextMode]);

  const chartData = useMemo(() => {
    return data
      .map((d) => ({
        name: d.type.replace("_", " ").toUpperCase(),
        value: Number(d.value),
      }))
      .sort((a, b) => LEGEND_ORDER.indexOf(a.name) - LEGEND_ORDER.indexOf(b.name));
  }, [data]);

  const totalValue = chartData.reduce((acc, curr) => acc + curr.value, 0);
  const topUnit = [...chartData].sort((a, b) => b.value - a.value)[0];

  const getActiveIndex = () => {
    if (manualHoverIndex !== null) return manualHoverIndex;
    if (activeMode === "ALL") return null;
    return chartData.findIndex((item) => item.name === activeMode);
  };

  const activeIndex = getActiveIndex();

  if (!mounted || data.length === 0) return <div className="h-full w-full bg-slate-200/50 dark:bg-slate-900/50 animate-pulse rounded-[2rem]" />;

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden group transition-colors duration-500">
      <div className="shrink-0 mb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xl font-black tracking-widest text-slate-900 dark:text-white uppercase transition-colors">Distribution</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-[0.2em]">ITP P12 Telemetri</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-cyan-500 animate-pulse">● LIVE SYNC</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          {MODES.map((mode) => {
            const isSelected = activeMode === mode;
            const themeColor = NEON_COLOR_MAP[mode] || "#00f2ff";
            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                style={{
                  backgroundColor: isSelected ? `${themeColor}22` : "transparent",
                  borderColor: isSelected ? themeColor : "transparent",
                  color: isSelected ? themeColor : theme === "dark" ? "#475569" : "#94a3b8",
                }}
                className="px-2 py-1 rounded-lg text-[9px] font-black transition-all duration-500 uppercase tracking-tighter border"
              >
                {mode}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-4 bg-cyan-500/5 dark:bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-2xl">
        <p className="text-[8px] font-mono text-slate-500 dark:text-cyan-500/60 uppercase tracking-widest">Leading Production Unit</p>
        <div className="flex justify-between items-center mt-1">
          <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase">{topUnit?.name}</h4>
          <span className="text-xs font-mono font-bold text-cyan-500">{((topUnit?.value / totalValue) * 100).toFixed(1)}% Contribution</span>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[300px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center justify-center text-center">
            {activeIndex !== null ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: NEON_COLOR_MAP[chartData[activeIndex].name] }}>
                  {chartData[activeIndex].name}
                </span>
                <span className="text-5xl font-black text-slate-900 dark:text-white leading-none mb-2">{((chartData[activeIndex].value / totalValue) * 100).toFixed(1)}%</span>
                <div className="flex items-center gap-1">
                  <span className="text-slate-400 text-[8px] uppercase">Contribution of all</span>
                </div>
              </>
            ) : (
              <>
                <span className="text-slate-400 dark:text-slate-600 text-[8px] font-bold uppercase tracking-[0.2em]">Net Summary</span>
                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none my-1">{totalValue.toLocaleString()}</span>
                <span className="text-cyan-500/40 text-[9px] font-mono uppercase font-bold tracking-widest">Total TN/H</span>
              </>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              activeIndex={activeIndex ?? undefined}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="65%"
              outerRadius="85%"
              paddingAngle={4}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
              onMouseEnter={(_, index) => setManualHoverIndex(index)}
              onMouseLeave={() => setManualHoverIndex(null)}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={NEON_COLOR_MAP[entry.name]} style={{ opacity: activeIndex === null || activeIndex === index ? 1 : 0.3, transition: "all 0.5s ease" }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-auto border-t border-slate-200 dark:border-slate-800 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-y-4 gap-x-2 mb-4">
          {chartData.map((item, index) => {
            const isSelected = activeIndex === index;
            const color = NEON_COLOR_MAP[item.name];
            return (
              <div
                key={item.name}
                onMouseEnter={() => setManualHoverIndex(index)}
                onMouseLeave={() => setManualHoverIndex(null)}
                className={`flex items-center gap-2.5 cursor-pointer transition-all duration-300 ${
                  isSelected 
                    ? "opacity-100 translate-x-1" 
                    : "opacity-40 hover:opacity-100"
                }`}
              >
                <div 
                  className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px]" 
                  style={{ 
                    backgroundColor: color, 
                    boxShadow: isSelected ? `0 0 12px ${color}` : "none" 
                  }} 
                />
                
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter leading-none truncate">
                    {item.name}
                  </span>
                </div>
              </div>

            );
          })}
        </div>
      </div>
    </div>
  );
}
