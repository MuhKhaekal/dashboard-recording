"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Sector } from "recharts";
import { useTheme } from "next-themes";

// 1. DEFINISI INTERFACE
interface MetricData {
  type: string;
  value: number;
}

interface ChartItem {
  name: string;
  value: number;
}

// Interface untuk data kemarin (mirip dengan MetricsGrid)
interface PreviousData {
  [key: string]: number | string | undefined;
}

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

// FIX: Tambahkan prop 'previous' untuk data tren
export default function DistributionChart({ data, previous }: { data: MetricData[]; previous?: PreviousData | null }) {
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
    return () => clearTimeout(timer);
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

  // ========================================================
  // KALKULASI TREND (NAIK / TURUN / STABIL)
  // ========================================================
  const trendInfo = useMemo(() => {
    if (!previous) return { val: "0.00", status: "flat", percent: "0.00" };

    let currentValue = 0;
    let prevValue = 0;

    if (activeIndex !== null && chartData[activeIndex]) {
      // 1. Mode SINGLE AREA
      const areaName = chartData[activeIndex].name.toLowerCase().replace(" ", "_");
      currentValue = chartData[activeIndex].value;
      prevValue = Number(previous[areaName]) || 0;
    } else {
      // 2. Mode ALL (Rata-rata Keseluruhan)
      currentValue = chartData.length > 0 ? totalValue / chartData.length : 0;
      
      // Ambil nilai kemarin untuk 6 area, lalu rata-ratakan
      const prevTotal = LEGEND_ORDER.reduce((acc, mode) => {
        const key = mode.toLowerCase().replace(" ", "_");
        return acc + (Number(previous[key]) || 0);
      }, 0);
      prevValue = prevTotal / (LEGEND_ORDER.length || 1);
    }

    const diff = currentValue - prevValue;
    let status = "flat";
    if (diff > 0) status = "up";
    else if (diff < 0) status = "down";

    const percent = prevValue !== 0 ? ((Math.abs(diff) / prevValue) * 100).toFixed(2) : "0.00";

    return {
      val: Math.abs(diff).toFixed(2),
      status,
      percent,
    };
  }, [activeIndex, chartData, previous, totalValue]);

  // Helper Warna Trend
  const getTrendColor = (status: string) => {
    if (status === "up") return "text-green-600 dark:text-green-400";
    if (status === "down") return "text-red-600 dark:text-red-400";
    return "text-slate-500 dark:text-slate-400";
  };

  // Helper Ikon Trend
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

  if (!isMounted || data.length === 0) {
    return <div className="h-full w-full bg-slate-200/40 dark:bg-slate-900/40 animate-pulse rounded-[2rem]" />;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const PieComponent = Pie as any;

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden group transition-colors duration-500">
      
      {/* HEADER SECTION */}
      <div className="shrink-0 mb-2">
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
                className="flex-grow basis-[22%] max-w-[24%] px-2 py-1.5 rounded-lg text-[8px] font-black transition-all duration-300 uppercase tracking-tighter border text-center"
              >
                {mode.replace("_", " ")}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mb-4 p-4 bg-cyan-500/5 dark:bg-cyan-500/10 border-l-4 border-cyan-500 rounded-r-2xl transition-all">
        <p className="text-[8px] font-mono text-slate-500 dark:text-cyan-500/60 uppercase tracking-widest">Leading Production Unit</p>
        <div className="flex justify-between items-center mt-1">
          <h4 className="text-lg font-black text-slate-800 dark:text-white uppercase tracking-tighter">{topUnit?.name}</h4>
          <span className="text-xs font-mono font-bold text-cyan-500">{((topUnit?.value / (totalValue || 1)) * 100).toFixed(1)}% Share</span>
        </div>
      </div>

      {/* JUDUL DINAMIS BERDASARKAN MODE */}
      <div className="text-center shrink-0 min-h-[40px]">
        {activeIndex === null ? (
          <>
            <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Total Progress KOH</h4>
            {/* KETERANGAN TAMBAHAN UNTUK AVERAGE */}
            <p className="text-[9px] font-mono text-purple-500/80 dark:text-purple-400/80 uppercase tracking-widest mt-1">
               *Average value from all 6 operational areas
            </p>
          </>
        ) : (
          <h4 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Area Performance</h4>
        )}
      </div>

      {/* DONUT CHART */}
      <div className="flex-1 w-full relative min-h-[220px]">
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10">
          <div className="flex flex-col items-center justify-center text-center">
            {activeIndex !== null ? (
              <>
                <span className="text-[10px] font-bold uppercase tracking-[0.3em] mb-1" style={{ color: NEON_COLOR_MAP[chartData[activeIndex].name] }}>
                  {chartData[activeIndex].name}
                </span>
                <span className="text-5xl font-black text-slate-900 dark:text-white leading-none mb-2">{chartData[activeIndex].value.toLocaleString()}%</span>
                <span className="text-slate-400 text-[8px] uppercase font-mono tracking-widest">Actual Value</span>
              </>
            ) : (
              <>
                <span className="text-5xl font-black text-slate-900 dark:text-white leading-none my-1">{(totalValue / (chartData.length || 1)).toFixed(2)}%</span>
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

      {/* FOOTER TREND INFORMASI (DI BAWAH CHART) */}
      <div className="mt-2 pt-3 border-t border-slate-100 dark:border-slate-800/50 flex justify-center items-center gap-4 shrink-0 bg-white/50 dark:bg-slate-900/50 rounded-xl pb-2">
        <div className="text-center">
          <p className="text-[9px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">From Yesterday</p>
          <div className="flex items-center justify-center gap-2">
            <span className={`text-lg font-black tracking-tighter ${getTrendColor(trendInfo.status)}`}>
              <span className="text-sm me-1">{getTrendIcon(trendInfo.status)}</span>
              {getMathSymbol(trendInfo.status)}{trendInfo.val}%
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}