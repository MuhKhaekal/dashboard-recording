"use client";
import React, { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { useTheme } from "next-themes";

// 1. DEFINISI INTERFACE
interface HistoryData {
  date: string;
  kiln?: number;
  mining?: number;
  raw_mill?: number;
  coal_mill?: number;
  finish_mill?: number;
  dispatch?: number;
  planned_value?: number;
  total_actual?: number;
  average_actual?: number; // Tambahan untuk S-Curve Average
  [key: string]: string | number | undefined;
}

interface TooltipPayload {
  color: string;
  name: string;
  value: number;
  dataKey: string;
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
  activeMode: string;
  isSCurve?: boolean;
}

const NEON_COLORS: Record<string, string> = {
  kiln: "#00f2ff",
  mining: "#39ff14",
  raw_mill: "#ffaa00",
  coal_mill: "#fde047",
  finish_mill: "#ff00ff",
  dispatch: "#9d00ff",
};

// PERUBAHAN WARNA S-CURVE
const SCURVE_COLORS = {
  planned: "#3b82f6", // Biru (Untuk Planning)
  actual: "#ff003c", // Merah (Untuk Aktual)
};

const MODES = ["ALL", "KILN", "MINING", "RAW_MILL", "COAL_MILL", "FINISH_MILL", "DISPATCH"];

// 2. TOOLTIP KUSTOM
const CustomTooltip = ({ active, payload, label, activeMode, isSCurve }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    let filteredPayload = payload;

    if (!isSCurve && activeMode !== "ALL") {
      filteredPayload = payload.filter((item) => item.dataKey.toLowerCase() === activeMode.toLowerCase().replace(" ", "_"));
    }

    if (filteredPayload.length === 0) return null;

    return (
      <div className="bg-white/90 dark:bg-[#020617]/95 backdrop-blur-xl border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-2xl min-w-[160px] ring-1 ring-black/5 dark:ring-white/5 transition-colors">
        <p className="text-[10px] font-mono text-slate-400 dark:text-slate-500 mb-3 uppercase tracking-[0.2em] border-b border-slate-100 dark:border-slate-800 pb-2">
          {label ? new Date(label).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : ""}
        </p>
        <div className="space-y-2.5">
          {filteredPayload.map((item, index) => (
            <div key={index} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color, boxShadow: `0 0 8px ${item.color}` }} />
                <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase">{item.name}</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-mono font-black block" style={{ color: item.color }}>
                  {item.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
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

export default function TrendChart({ data }: { data: HistoryData[] }) {
  const scrollRef1 = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [activeMode, setActiveMode] = useState<string>("ALL");
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const { theme } = useTheme();

  const getModeKey = (mode: string) => mode.toLowerCase().replace(" ", "_");

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Filter Data Khusus Area Trends (Buang masa depan)
  const areaChartData = useMemo(() => {
    return data.filter((d) => d.total_actual !== undefined);
  }, [data]);

  // Transformasi Data Khusus S-Curve (Bagi total_actual dengan 6 untuk dapat Rata-rata)
  const sCurveData = useMemo(() => {
    return data.map((d) => ({
      ...d,
      average_actual: d.total_actual !== undefined ? d.total_actual / 6 : undefined,
    }));
  }, [data]);

  // Kalkulasi Stats Area
  const stats = useMemo(() => {
    if (!areaChartData || areaChartData.length === 0) return null;

    if (activeMode === "ALL") {
      const validDays = areaChartData.filter((d) => (d.total_actual || 0) > 0);
      const grandTotal = validDays.reduce((acc, curr) => acc + (curr.total_actual || 0), 0);
      const avg = validDays.length > 0 ? grandTotal / (validDays.length * 6) : 0;
      const allValues = validDays.flatMap((d) => Object.keys(NEON_COLORS).map((k) => Number(d[k]) || 0));

      return {
        max: allValues.length > 0 ? Math.max(...allValues) : 0,
        avg: avg,
        min: allValues.length > 0 ? Math.min(...allValues) : 0,
      };
    } else {
      const modeKey = getModeKey(activeMode);
      const validValues = areaChartData.map((d) => Number(d[modeKey]) || 0).filter((v) => v > 0);

      return {
        max: validValues.length > 0 ? Math.max(...validValues) : 0,
        avg: validValues.length > 0 ? validValues.reduce((a, b) => a + b, 0) / validValues.length : 0,
        min: validValues.length > 0 ? Math.min(...validValues) : 0,
      };
    }
  }, [areaChartData, activeMode]);

  // Kalkulasi Stats S-Curve (Menggunakan Rata-rata)
  // Kalkulasi Stats S-Curve (Menggunakan Rata-rata)
  const scurveStats = useMemo(() => {
    if (!sCurveData || sCurveData.length === 0) return { maxActual: 0, maxPlan: 0, latestActual: 0, latestPlan: 0 };

    const actuals = sCurveData.map((d) => Number(d.average_actual) || 0);
    const plans = sCurveData.map((d) => Number(d.planned_value) || 0);

    // 1. Ambil baris data TERAKHIR yang sudah ada nilai aktualnya (Progres Hari Terakhir)
    const lastActualRow = areaChartData.length > 0 ? areaChartData[areaChartData.length - 1] : null;

    return {
      maxActual: Math.max(...actuals),
      maxPlan: Math.max(...plans),

      // 2. Rata-rata aktual di hari terakhir
      latestActual: lastActualRow ? (lastActualRow.total_actual || 0) / 6 : 0,

      // 3. FIX: Ambil Planning PADA HARI YANG SAMA dengan hari aktual terakhir (BUKAN target akhir bulan)
      latestPlan: lastActualRow ? lastActualRow.planned_value || 0 : 0,
    };
  }, [sCurveData, areaChartData]);

  // Scroll otomatis (Hanya untuk Area Trends sekarang)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (scrollRef1.current) scrollRef1.current.scrollLeft = scrollRef1.current.scrollWidth;
    }, 200);
    return () => clearTimeout(timer);
  }, [data, activeMode, currentSlide]);

  if (!isMounted || !data || data.length === 0) return <div className="h-full w-full bg-slate-200/40 dark:bg-slate-900/40 animate-pulse rounded-[2rem]" />;

  // Y-Axis Area Trends
  const currentValues = activeMode === "ALL" ? areaChartData.flatMap((d) => Object.keys(NEON_COLORS).map((k) => Number(d[k]) || 0)) : areaChartData.map((d) => Number(d[getModeKey(activeMode)]) || 0);
  const rawMax = currentValues.length > 0 ? Math.max(...currentValues, 10) : 10;
  const maxValueWithBuffer = Math.ceil((rawMax * 1.2) / 10) * 10;
  const yTicksManual = [maxValueWithBuffer, Math.round(maxValueWithBuffer * 0.75), Math.round(maxValueWithBuffer * 0.5), Math.round(maxValueWithBuffer * 0.25), 0];

  // Y-Axis S-Curve
  const sCurveMaxRaw = Math.max(scurveStats.maxActual, scurveStats.maxPlan, 10);
  const sCurveMaxBuffer = Math.ceil((sCurveMaxRaw * 1.1) / 10) * 10;
  const sCurveTicks = [sCurveMaxBuffer, Math.round(sCurveMaxBuffer * 0.75), Math.round(sCurveMaxBuffer * 0.5), Math.round(sCurveMaxBuffer * 0.25), 0];

  // LEBAR CHART: Area = Bisa di-scroll, S-Curve = 100% (Terhimpit)
  const areaChartWidth = Math.max(100, (areaChartData.length * 100) / 10) + "%";
  const sCurveChartWidth = "100%"; // Memaksa grafik terhimpit tanpa scroll

  const gridStroke = theme === "dark" ? "#1e293b" : "#e2e8f0";
  const axisTickColor = theme === "dark" ? "#475569" : "#94a3b8";

  return (
    <div className="h-full w-full flex flex-col transition-colors duration-500 overflow-hidden relative">
      {/* HEADER PANEL (TOMBOL & FILTER) */}
      <div className="absolute top-0 w-full z-50 flex justify-between items-start pointer-events-none">
        <div
          className={`pointer-events-auto flex gap-1 p-1 bg-slate-100 dark:bg-black/40 rounded-xl border border-slate-200 dark:border-slate-800 transition-all duration-500 origin-top-left ${
            currentSlide === 0 ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"
          }`}
        >
          {MODES.map((mode) => (
            <button
              key={mode}
              onClick={() => setActiveMode(mode)}
              style={{
                backgroundColor: activeMode === mode ? `${NEON_COLORS[getModeKey(mode)] || "#00f2ff"}22` : "transparent",
                borderColor: activeMode === mode ? NEON_COLORS[getModeKey(mode)] || "#00f2ff" : "transparent",
                color: activeMode === mode ? NEON_COLORS[getModeKey(mode)] || "#00f2ff" : "#64748b",
              }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-black transition-all duration-300 uppercase border ${activeMode === mode ? "shadow-sm" : "border-transparent"}`}
            >
              {mode.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="pointer-events-auto flex gap-2">
          <button
            onClick={() => setCurrentSlide(0)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
              currentSlide === 0
                ? "bg-cyan-500/10 text-cyan-500 border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]"
                : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            Area Trends
          </button>
          <button
            onClick={() => setCurrentSlide(1)}
            className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all border ${
              currentSlide === 1
                ? "bg-purple-500/10 text-purple-400 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
                : "bg-slate-100 dark:bg-slate-800/50 text-slate-500 border-transparent hover:text-slate-700 dark:hover:text-slate-300"
            }`}
          >
            S-Curve Progress
          </button>
        </div>
      </div>

      {/* CAROUSEL TRACK */}
      <div className="flex-1 w-full h-full relative overflow-hidden mt-12">
        <div className="absolute inset-0 flex h-full transition-transform duration-700 ease-in-out" style={{ width: "200%", transform: `translateX(-${currentSlide * 50}%)` }}>
          {/* ==================================================== */}
          {/* SLIDE 1: AREA TRENDS                                 */}
          {/* ==================================================== */}
          <div className="w-1/2 h-full flex flex-col pr-2">
            <div className="flex flex-col gap-4 shrink-0">
              <div>
                <h3 className="text-xl font-black tracking-widest text-slate-800 dark:text-slate-200 uppercase">{activeMode === "ALL" ? "All Trends" : `Trend ${activeMode.replace("_", " ")}`}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-cyan-500 animate-pulse font-bold">● AREA METRICS</span>
                </div>
              </div>

              <div className="flex justify-between gap-8 border-y border-slate-100 dark:border-slate-800/50 py-3 px-2">
                <div>
                  <p className="text-[12px] font-mono text-slate-400 dark:text-slate-600 uppercase tracking-tighter">Peak Load</p>
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
                  <span key={i} className="leading-none">
                    {tick}
                  </span>
                ))}
              </div>
              <div ref={scrollRef1} className="flex-1 h-full overflow-x-auto overflow-y-hidden scrollbar-hide">
                <div style={{ width: areaChartWidth, minWidth: "100%" }} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={areaChartData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} opacity={0.2} />
                      {activeMode !== "ALL" && (
                        <ReferenceLine
                          y={stats?.avg}
                          stroke={NEON_COLORS[getModeKey(activeMode)]}
                          strokeDasharray="4 4"
                          opacity={0.4}
                          label={{ value: "AVG", position: "insideRight", fill: axisTickColor, fontSize: 8, fontWeight: "bold" }}
                        />
                      )}
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: axisTickColor, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tickFormatter={(str) => new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      />
                      <YAxis hide domain={[0, maxValueWithBuffer]} />
                      <Tooltip content={<CustomTooltip activeMode={activeMode} />} cursor={{ stroke: axisTickColor, strokeWidth: 1, strokeDasharray: "4 4" }} />

                      {Object.entries(NEON_COLORS).map(([key, color]) => {
                        const isVisible = activeMode === "ALL" || getModeKey(activeMode) === key;
                        return (
                          <Line
                            key={key}
                            type="monotone"
                            dataKey={key}
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

          {/* ==================================================== */}
          {/* SLIDE 2: S-CURVE CHART (COMPRESSED, NO SCROLL)       */}
          {/* ==================================================== */}
          <div className="w-1/2 h-full flex flex-col pl-2">
            <div className="flex flex-col gap-4 shrink-0">
              <div>
                <h3 className="text-xl font-black tracking-widest text-purple-500 dark:text-purple-400 uppercase">Master S-Curve</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-purple-400 animate-pulse font-bold">● PROGRESS TRACKING</span>
                </div>
              </div>

              <div className="flex justify-start gap-12 border-y border-slate-100 dark:border-slate-800/50 py-3 px-2">
                <div>
                  <p className="text-[12px] font-mono text-purple-400/80 uppercase tracking-tighter">Current Plan</p>
                  <p className="text-lg font-black text-purple-500 leading-none">{scurveStats.latestPlan.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-[12px] font-mono text-cyan-500/80 uppercase tracking-tighter">Current Actual</p>
                  {/* Menampilkan warna Merah jika aktual under planning */}
                  <p className={`text-lg font-black leading-none ${scurveStats.latestActual >= scurveStats.latestPlan ? "text-cyan-500" : "text-red-500"}`}>{scurveStats.latestActual.toFixed(2)}%</p>
                </div>
                <div>
                  <p className="text-[12px] font-mono text-slate-400 dark:text-slate-500 uppercase tracking-tighter">Deviation</p>
                  <p className={`text-lg font-black leading-none ${scurveStats.latestActual - scurveStats.latestPlan >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {scurveStats.latestActual - scurveStats.latestPlan > 0 ? "+" : ""}
                    {(scurveStats.latestActual - scurveStats.latestPlan).toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 min-h-0 flex relative w-full pr-4">
              <div className="flex-none w-10 h-full flex flex-col justify-between items-end pr-3 pb-8 text-[9px] font-mono font-bold text-slate-400 dark:text-slate-600 z-30 border-r border-slate-100 dark:border-slate-800 transition-colors">
                {sCurveTicks.map((tick, i) => (
                  <span key={i} className="leading-none">
                    {tick}
                  </span>
                ))}
              </div>
              {/* FIX: Menghapus overflow-x-auto agar tidak muncul scrollbar */}
              <div className="flex-1 h-full overflow-hidden">
                {/* FIX: width di set mati di 100% agar data terhimpit */}
                <div style={{ width: sCurveChartWidth, minWidth: "100%" }} className="h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={sCurveData} margin={{ top: 10, right: 10, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} opacity={0.2} />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 9, fill: axisTickColor, fontWeight: "bold" }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                        tickFormatter={(str) => new Date(str).toLocaleDateString("id-ID", { day: "numeric", month: "short" })}
                      />
                      <YAxis hide domain={[0, sCurveMaxBuffer]} />

                      <Tooltip content={<CustomTooltip activeMode="ALL" isSCurve={true} />} cursor={{ stroke: axisTickColor, strokeWidth: 1, strokeDasharray: "4 4" }} />

                      {/* GARIS BIRU PUTUS-PUTUS (PLANNING) */}
                      <Line
                        type="monotone"
                        dataKey="planned_value"
                        name="PLANNED PROGRESS"
                        stroke={SCURVE_COLORS.planned}
                        strokeWidth={3}
                        strokeDasharray="8 6"
                        dot={false}
                        activeDot={{ r: 6, stroke: theme === "dark" ? "#fff" : "#000", strokeWidth: 2 }}
                        isAnimationActive={true}
                      />

                      {/* GARIS MERAH TEGAS (ACTUAL AVERAGE) */}
                      <Line
                        type="monotone"
                        dataKey="average_actual"
                        name="ACTUAL PROGRESS"
                        stroke={SCURVE_COLORS.actual}
                        strokeWidth={2}
                        dot={{ r: 3, fill: SCURVE_COLORS.actual, strokeWidth: 0 }}
                        activeDot={{ r: 7, stroke: theme === "dark" ? "#fff" : "#000", strokeWidth: 1 }}
                        isAnimationActive={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
