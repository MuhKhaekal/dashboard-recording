'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/library/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// 1. Definisikan Interface untuk Data Metric
interface MetricRow {
  type: string;
  value: number;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [message, setMessage] = useState('');
  
  // Gunakan Record<string, string> daripada any
  const [values, setValues] = useState<Record<string, string>>({
    kiln: '',
    mining: '',
    raw_mill: '',
    finish_mill: '',
    dispatch: '',
  });

  const types = ['kiln', 'mining', 'raw_mill', 'finish_mill', 'dispatch'];

  const getLocalDateString = () => {
    const date = new Date();
    const offset = date.getTimezoneOffset() * 60000; 
    const localISOTime = new Date(date.getTime() - offset).toISOString().split('T')[0];
    return localISOTime;
  };

  useEffect(() => {
    const initializeAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login');
        return;
      }

      const today = getLocalDateString();
      
      const { data, error } = await supabase
        .from('metrics')
        .select('type, value')
        .eq('recorded_at', today);

      // Cast data ke interface MetricRow[]
      if (data && !error && data.length > 0) {
        const resultData = data as MetricRow[];
        const newValues = { ...values };
        resultData.forEach((item) => {
          newValues[item.type] = item.value.toString();
        });
        setValues(newValues);
      }

      setCheckingAuth(false);
    };

    initializeAdmin();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const today = getLocalDateString();
      
      const updates = types.map((type) => ({
        type: type,
        value: Number(values[type]) || 0,
        recorded_at: today, 
      }));

      const { error } = await supabase
        .from('metrics')
        .upsert(updates, { onConflict: 'type,recorded_at' });

      if (error) throw error;
      setMessage('✅ Data berhasil diperbarui untuk hari ini!');
    } catch (error) {
      // 2. Perbaikan Catch Block: Periksa apakah error adalah instance dari Error
      if (error instanceof Error) {
        setMessage('❌ Gagal update: ' + error.message);
      } else {
        setMessage('❌ Terjadi kesalahan yang tidak diketahui');
      }
    } finally {
      setLoading(false);
    }
  };

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#020617]">
        <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-slate-400 font-mono text-sm animate-pulse tracking-widest">AUTHENTICATING...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="p-8 min-h-screen bg-[#020617] text-white transition-colors duration-500">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-10">
            <Link href="/" className="text-cyan-400/70 hover:text-cyan-400 transition-colors flex items-center gap-2 font-mono text-xs uppercase tracking-widest">
            <span className="text-lg">←</span> Back to Dashboard
            </Link>
            <button 
            onClick={async () => { await supabase.auth.signOut(); router.push('/login'); }}
            className="px-4 py-2 bg-red-500/10 border border-red-500/50 text-red-500 rounded-full text-xs font-bold hover:bg-red-500 hover:text-white transition-all"
            >
            TERMINATE SESSION
            </button>
        </div>

        <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 blur-[80px]"></div>

            <header className="mb-10">
                <h1 className="text-3xl font-black tracking-tighter uppercase leading-none">Daily <span className="text-cyan-400">Input</span></h1>
                <p className="text-slate-500 font-mono text-[10px] mt-3 uppercase tracking-[0.3em]">
                    Target_Date: <span className="text-slate-300 font-bold underline underline-offset-4 decoration-cyan-500/50">{new Date().toLocaleDateString('en-EN', { dateStyle: 'full' })}</span>
                </p>
            </header>
            
            <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {types.map((type) => (
                    <div key={type} className="group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-cyan-400 transition-colors">
                            {type.replace('_', ' ')} (%)
                        </label>
                        <div className="relative">
                            <input
                                type="number"
                                required
                                step="any"
                                value={values[type]}
                                onChange={(e) => setValues({ ...values, [type]: e.target.value })}
                                placeholder="0.00"
                                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl p-4 text-white focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500 outline-none transition-all font-mono font-bold"
                            />
                        </div>
                    </div>
                ))}
            </div>
            
            <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-3 active:scale-[0.98]"
            >
                {loading ? (
                   <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                ) : 'TRANSMIT DATA'}
            </button>

            {message && (
                <div className={`p-4 rounded-xl text-center text-[10px] font-mono font-bold tracking-widest border animate-in fade-in slide-in-from-top-2 duration-300 ${
                message.includes('Gagal') 
                    ? 'bg-red-500/10 border-red-500/50 text-red-500' 
                    : 'bg-green-500/10 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.1)]'
                }`}>
                {message}
                </div>
            )}
            </form>
        </div>
      </div>
    </main>
  );
}