'use client';

import React, { useState, useEffect } from 'react';
import { useTheme } from "next-themes";

export default function Header({ today }: { today: string }) {
  // 1. Berikan tipe eksplisit dan ganti nama agar unik
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // 2. Gunakan setTimeout agar update state menjadi asinkron
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);
    
    return () => clearTimeout(timer);
  }, []);

  // 3. Gunakan isMounted untuk pengecekan
  if (!isMounted) return null;

  return (
    <header className="flex justify-between items-center mb-6 shrink-0 border-b border-slate-200 dark:border-slate-800 pb-4 transition-colors duration-500">
      <div className="flex items-center gap-4">
        <div className="h-12 w-1.5 bg-cyan-500 shadow-[0_0_15px_#06b6d4] rounded-full hidden md:block"></div>
        
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-tight">
            PROGRESS KILN <span className="text-cyan-500 dark:text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.4)]">OVERHAUL</span>
            <span className="block text-[12px] md:text-xl font-mono text-slate-400 dark:text-slate-500 tracking-[0.4em] mt-1">
              ITP P12 TARJUN — 2026
            </span>
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="hidden lg:flex flex-col items-end mr-4 border-r border-slate-200 dark:border-slate-800 pr-4">
          <p className="text-[12px] font-mono text-slate-800 dark:text-slate-200 uppercase tracking-tighter">
            {today}
          </p>
          <p className="text-[12px] text-slate-500 font-mono uppercase">SYSTEM TIME: {currentTime.toLocaleTimeString()}</p>
        </div>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 hover:border-cyan-500 transition-all shadow-sm group"
          title="Toggle System Theme"
        >
          {theme === "dark" ? (
            <span className="text-lg group-hover:rotate-12 transition-transform block">🌙</span>
          ) : (
            <span className="text-lg group-hover:rotate-45 transition-transform block">☀️</span>
          )}
        </button>

        <div className="bg-slate-100 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
          <div className="flex flex-col items-end hidden sm:block">
            <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none">System </span>
            <span className="text-[9px] font-mono text-cyan-600 dark:text-cyan-400 font-bold uppercase">Online</span>
          </div>
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500 shadow-[0_0_10px_#06b6d4]"></span>
          </div>
        </div>
      </div>
    </header>
  );
}