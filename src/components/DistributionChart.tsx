"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { useTheme } from "next-themes";

// 1. DEFINISI INTERFACE YANG KETAT
interface MetricData {
  type: string;
  value: number;
}

interface ChartItem {
  name: string;
  value: number;
}

// Interface ini mengikuti struktur internal Recharts tanpa menggunakan 'any'
interface ActiveShapeProps {
  cx?: number;
  cy?: number;
  innerRadius?: number;
  outerRadius?: number;
  startAngle?: number;
  endAngle?: number;
  fill?: string;
  payload?: Record<string, unknown>;
  percent?: number;
  value?: number;
}

const NEON_COLOR_MAP: Record<string, string> = {
  KILN: "#00f2ff",
  MINING: "#39ff14",
  "RAW MILL": "#ffaa00",
  "COAL MILL": "#fde047",
  "FINISH MILL": "#ff00ff",
  DISPATCH: "#9d00ff",
};

const MODES = ["ALL", "KILN", "MINING", "RAW MILL", "COAL MILL", "FINISH MILL", "DISPATCH"];
const LEGEND_ORDER = ["KILN", "MINING", "RAW MILL", "COAL MILL", "FINISH MILL", "DISPATCH"];

const renderActiveShape = (props: ActiveShapeProps) => {
  const { cx = 0, cy = 0, innerRadius = 0, outerRadius = 0, startAngle = 0, endAngle = 0, fill = "#00f2ff" } = props;

  return (
    <g>
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 12} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.2} />
      <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 4} startAngle={startAngle} endAngle={endAngle} fill={fill} />
    </g>
  );
};

export default function DistributionChart({ data }: { data: MetricData[] }) {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<string>("ALL");
  const [manualHoverIndex, setManualHoverIndex] = useState<number | null>(null);
  const { theme } = useTheme();

  const nextMode = useCallback(() => {
    setActiveMode((prev) => {
      const currentIndex = MODES.indexOf(prev);
      return MODES[(currentIndex + 1) % MODES.length];
    });
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
  }, [nextMode]);

  const chartData = useMemo<ChartItem[]>(() => {
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
    const idx = chartData.findIndex((item) => item.name === activeMode);
    return idx === -1 ? null : idx;
  };

  const activeIndex = getActiveIndex();

  if (!isMounted || data.length === 0) {
    return <div className="h-full w-full bg-slate-200/40 dark:bg-slate-900/40 animate-pulse rounded-[2rem]" />;
  }

  // Gunakan eslint-disable untuk baris ini saja agar linter membolehkan casting any
  // karena ini adalah satu-satunya cara mengatasi bug type definition Recharts
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieComponent = Pie as any;

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden group transition-colors duration-500">
      <div className="shrink-0 mb-4">
        <div className="flex justify-between items-end mb-4">
          <div>
            <h3 className="text-xl font-black tracking-widest text-slate-900 dark:text-white uppercase transition-colors">Distribution</h3>
            <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono uppercase tracking-[0.2em]">ITP P12 Telemetri</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-mono text-cyan-500 animate-pulse font-bold">● LIVE SYNC</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors">
          {MODES.map((mode) => {
            const isSelected = activeMode === mode;
            // Normalisasi key untuk mengambil warna dari map
            const colorKey = mode.toUpperCase().replace("_", " ");
            const themeColor = NEON_COLOR_MAP[colorKey] || "#00f2ff";

            return (
              <button
                key={mode}
                onClick={() => setActiveMode(mode)}
                style={{
                  backgroundColor: isSelected ? `${themeColor}22` : "transparent",
                  borderColor: isSelected ? themeColor : "transparent",
                  color: isSelected ? themeColor : theme === "dark" ? "#475569" : "#94a3b8",
                }}
                /* Gunakan basis-1/5 (sekitar 21-22%) agar muat 4 di atas. 
           flex-grow akan memastikan tombol mengisi ruang.
        */
                className="flex-grow basis-[22%] max-w-[24%] px-2 py-1.5 rounded-lg text-[8px] font-black transition-all duration-300 uppercase tracking-tighter border text-center"
              >
                {mode.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-6 p-4 bg-cyan-500/5 dark:bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-2xl transition-all">
        <p className="text-[8px] font-mono text-slate-500 dark:text-cyan-500/60 uppercase tracking-widest">Leading Production Unit</p>
        <div className="flex justify-between items-center mt-1">
          <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">{topUnit?.name}</h4>
          <span className="text-xs font-mono font-bold text-cyan-500">{((topUnit?.value / (totalValue || 1)) * 100).toFixed(1)}% Share</span>
        </div>
      </div>

      <div className="flex-1 w-full relative min-h-[300px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center justify-center text-center">
            {activeIndex !== null ? (
              <>
                {/* MODE: SINGLE AREA (Menampilkan Nilai Asli) */}
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: NEON_COLOR_MAP[chartData[activeIndex].name] }}>
                  {chartData[activeIndex].name}
                </span>

                {/* Tampilkan Nilai Asli Tanpa Persen */}
                <span className="text-5xl font-black text-slate-900 dark:text-white leading-none mb-2">{chartData[activeIndex].value.toLocaleString()}</span>

                <span className="text-slate-400 text-[8px] uppercase font-mono tracking-widest">Actual Value</span>
              </>
            ) : (
              <>
                {/* MODE: ALL (Menampilkan Rata-rata Keseluruhan) */}
                <span className="text-slate-400 dark:text-slate-600 text-[8px] font-bold uppercase tracking-[0.2em]">System Average Load</span>

                {/* Rumus Rata-rata: Total dibagi jumlah elemen chartData */}
                <span className="text-4xl font-black text-slate-900 dark:text-white leading-none my-1">{(totalValue / (chartData.length || 1)).toFixed(1)}</span>

                <span className="text-cyan-500/40 text-[9px] font-mono uppercase font-bold tracking-widest">Avg Unit Performance</span>
              </>
            )}
          </div>
        </div>

        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <PieComponent
              activeIndex={activeIndex !== null ? activeIndex : undefined}
              activeShape={renderActiveShape}
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="68%"
              outerRadius="88%"
              paddingAngle={5}
              dataKey="value"
              stroke="none"
              cornerRadius={6}
              // Gunakan unknown dan casting untuk event handler
              onMouseEnter={(_: unknown, index: number) => setManualHoverIndex(index)}
              onMouseLeave={() => setManualHoverIndex(null)}
            >
              {chartData.map((entry: ChartItem, index: number) => (
                <Cell key={`cell-${index}`} fill={NEON_COLOR_MAP[entry.name]} style={{ opacity: activeIndex === null || activeIndex === index ? 1 : 0.2, transition: "all 0.5s ease" }} />
              ))}
            </PieComponent>
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
