'use client';

import { useState } from 'react';
import { supabase } from '@/library/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setErrorMsg(error.message);
    } else {
      router.push('/admin');
    }
    setLoading(false);
  };

  return (
    <main className="relative flex items-center justify-center min-h-screen bg-[#020617] overflow-hidden p-6">
      
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-5%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] animate-blob-slow"></div>
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[120px] animate-blob-medium"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
              System <span className="text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]">Access</span>
            </h1>
            <p className="text-slate-500 font-mono text-[10px] mt-3 uppercase tracking-[0.4em]">ADMINISTRATOR PROGRESS KLIN OVERHAUL ITP P12 TARJUN - 2026</p>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-2xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
          
          <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-cyan-500/20 rounded-tl-[2.5rem]"></div>
          <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-cyan-500/20 rounded-br-[2.5rem]"></div>

          <form onSubmit={handleLogin} className="space-y-6 relative z-10">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Operator Email</label>
              <input
                type="email"
                placeholder="name@system.com"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all font-mono"
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Access Cipher</label>
              <input
                type="password"
                placeholder="••••••••"
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white placeholder:text-slate-700 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all font-mono"
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/50 p-3 rounded-xl text-red-500 text-[10px] font-mono font-bold uppercase tracking-tight text-center animate-shake">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] active:scale-95 flex items-center justify-center gap-3 group"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  <span className="group-hover:translate-x-1 transition-transform">Initialize Sync</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/50 flex justify-between items-center">
             <Link href="/" className="text-[9px] font-mono text-slate-600 hover:text-cyan-400 uppercase tracking-widest transition-colors">
                ← Return to monitoring
             </Link>
             <span className="text-[9px] font-mono text-slate-800 uppercase">Secure Node 01</span>
          </div>
        </div>
        
        <p className="text-center mt-8 text-[9px] font-mono text-slate-700 uppercase tracking-[0.5em]">
          Unauth Access Prohibited
        </p>
      </div>
    </main>
  );
}