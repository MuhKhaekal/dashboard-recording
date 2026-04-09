"use client";
import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTheme } from "next-themes";

const NEON_COLORS: Record<string, string> = {
  kiln: "#00f2ff",
  mining: "#39ff14",
  raw_mill: "#ffaa00",
  finish_mill: "#ff00ff",
  dispatch: "#9d00ff",
};

const MODES = ["ALL", "KILN", "MINING", "RAW_MILL", "FINISH_MILL", "DISPATCH"];

const CustomTooltip = ({ active, payload, label, activeMode }: any) => {
  if (active && payload && payload.length) {
    const filteredPayload = activeMode === "ALL" ? payload : payload.filter((item: any) => item.dataKey.toLowerCase() === activeMode.toLowerCase());
    if (filteredPayload.length === 0) return null;

    return (
      <div className="bg-white/90 dark:bg-[#020617]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[160px] ring-1 ring-black/5 dark:ring-white/5 transition-colors">
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 pb-2">
          {new Date(label).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
        </p>
        <div className="space-y-2.5">
          {filteredPayload.map((item: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-black block" style={{ color: item.color }}>{item.value.toLocaleString()}</span>
                <span className="text-[8px] font-mono text-slate-400 dark:text-slate-600 uppercase block -mt-1">%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return null;
};

export default function TrendChart({ data }: { data: any[] }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [activeMode, setActiveMode] = useState("ALL");
  const { theme } = useTheme();

  useEffect(() => { setMounted(true); }, []);

  const stats = useMemo(() => {
    if (!data || data.length === 0) return null;
    const mode = activeMode.toLowerCase();
    let values = activeMode === 'ALL' 
      ? data.flatMap(d => Object.keys(NEON_COLORS).map(k => Number(d[k]) || 0))
      : data.map(d => Number(d[mode]) || 0);

    return {
      max: Math.max(...values),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
      min: Math.min(...values)
    };
  }, [data, activeMode]);

  const nextMode = useCallback(() => {
    setActiveMode((prev) => MODES[(MODES.indexOf(prev) + 1) % MODES.length]);
  }, []);

  useEffect(() => {
    const interval = setInterval(nextMode, 10000);
    return () => clearInterval(interval);
  }, [nextMode]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef.current) scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }, 200);
    return () => clearTimeout(timer);
  }, [data, activeMode]);

  if (!mounted || !data || data.length === 0) return <div className="h-full w-full bg-slate-200/40 dark:bg-slate-900/40 animate-pulse rounded-[2rem]" />;

  const currentValues = activeMode === "ALL" 
    ? data.flatMap((d) => Object.keys(NEON_COLORS).map((k) => Number(d[k]) || 0))
    : data.map((d) => Number(d[activeMode.toLowerCase()]) || 0);

  const rawMax = Math.max(...currentValues, 10);
  const maxValueWithBuffer = Math.ceil((rawMax * 1.2) / 10) * 10; 
  
  const yTicksManual = [
    maxValueWithBuffer, 
    Math.round(maxValueWithBuffer * 0.75), 
    Math.round(maxValueWithBuffer * 0.5), 
    Math.round(maxValueWithBuffer * 0.25), 
    0
  ];
  
  const chartWidth = Math.max(100, (data.length * 100) / 10) + "%";
  const gridStroke = theme === "dark" ? "#1e293b" : "#e2e8f0";
  const axisTickColor = theme === "dark" ? "#475569" : "#94a3b8";

  return (
    <div className="h-full w-full flex flex-col transition-colors duration-500 overflow-hidden">
      
      <div className="flex flex-col gap-4 mb-6 shrink-0">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-xl font-black tracking-widest text-slate-800 dark:text-slate-200 uppercase">
              {activeMode === "ALL" ? "System Global Trend" : `${activeMode.replace("_", " ")} Analysis`}
            </h3>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-[10px] font-mono text-cyan-500 animate-pulse">● LIVE SYNC</span>
            </div>
          </div>

          <div className="flex gap-1 p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-slate-800">
            {MODES.map((mode) => (
              <button
                key={mode} onClick={() => setActiveMode(mode)}
                style={{
                  backgroundColor: activeMode === mode ? `${NEON_COLORS[mode.toLowerCase()] || "#00f2ff"}22` : "transparent",
                  borderColor: activeMode === mode ? (NEON_COLORS[mode.toLowerCase()] || "#00f2ff") : "transparent",
                  color: activeMode === mode ? (NEON_COLORS[mode.toLowerCase()] || "#00f2ff") : "#64748b",
                }}
                className={`px-3 py-1.5 rounded-lg text-[12px] font-black transition-all duration-300 uppercase border ${activeMode === mode ? 'shadow-sm' : 'border-transparent'}`}
              >
                {mode.replace("_", " ")}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between gap-8 border-y border-slate-100 dark:border-slate-800/50 py-3 px-2">
           <div>
              <p className="text-[12px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Peak_Load</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">{stats?.max.toLocaleString()}%</p>
           </div>
           <div>
              <p className="text-[12px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Average</p>
              <p className="text-lg font-black text-cyan-500 leading-none">{stats?.avg.toFixed(1)}%</p>
           </div>
           <div>
              <p className="text-[12px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Lowest</p>
              <p className="text-lg font-black text-slate-800 dark:text-slate-200 leading-none">{stats?.min.toLocaleString()}%</p>
           </div>
        </div>
      </div>

      <div className="flex-1 min-h-0 flex relative w-full pr-4">
        <div className="flex-none w-10 h-full flex flex-col justify-between items-end pr-3 pb-8 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-600 z-30 border-r border-slate-100 dark:border-slate-800 transition-colors">
          {yTicksManual.map((tick, i) => (
            <span key={i} className="leading-none">{tick}</span>
          ))}
        </div>

        <div ref={scrollRef} className="flex-1 h-full overflow-x-auto overflow-y-hidden scrollbar-hide">
          <div style={{ width: chartWidth, minWidth: "100%" }} className="h-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} opacity={0.2} />
                
                {activeMode !== "ALL" && (
                   <ReferenceLine 
                     y={stats?.avg} 
                     stroke={NEON_COLORS[activeMode.toLowerCase()]} 
                     strokeDasharray="4 4" 
                     opacity={0.4}
                     label={{ value: 'AVG', position: 'insideRight', fill: axisTickColor, fontSize: 8, fontWeight: 'bold' }} 
                   />
                )}

                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 9, fill: axisTickColor, fontWeight: "bold" }}
                  axisLine={false} tickLine={false} dy={10}
                  tickFormatter={(str) => new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                />
                
                <YAxis hide domain={[0, maxValueWithBuffer]} />

                <Tooltip content={<CustomTooltip activeMode={activeMode} />} cursor={{ stroke: axisTickColor, strokeWidth: 1, strokeDasharray: "4 4" }} />

                {Object.entries(NEON_COLORS).map(([key, color]) => {
                  const isVisible = activeMode === "ALL" || activeMode.toLowerCase() === key;
                  return (
                    <Line
                      key={key} type="monotone" dataKey={key}
                      name={key.replace("_", " ").toUpperCase()}
                      stroke={color}
                      strokeWidth={isVisible ? (activeMode === "ALL" ? 2.5 : 4) : 0}
                      opacity={isVisible ? 1 : 0}
                      dot={isVisible ? { r: 3, fill: color, strokeWidth: 0 } : false}
                      activeDot={isVisible ? { r: 6, stroke: theme === "dark" ? "#fff" : "#000", strokeWidth: 2 } : false}
                      isAnimationActive={true}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}