"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Ghost, Users, Play, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const savedName = localStorage.getItem("deadlock-spy-name");
    if (savedName) setName(savedName);
  }, []);

  const handleCreate = async () => {
    if (!name) return setError("Enter your name first");
    setLoading(true);
    setError("");
    try {
      localStorage.setItem("deadlock-spy-name", name);
      const res = await fetch("/api/room/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.details || data.error);
      
      localStorage.setItem(`room-${data.room.code}-player`, JSON.stringify(data.player));
      router.push(`/room/${data.room.code}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!name) return setError("Enter your name first");
    if (!code) return setError("Enter room code");
    setLoading(true);
    setError("");
    try {
      localStorage.setItem("deadlock-spy-name", name);
      const res = await fetch("/api/room/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.details || data.error);

      localStorage.setItem(`room-${data.room.code}-player`, JSON.stringify(data.player));
      router.push(`/room/${data.room.code}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#0c0c14] text-white flex flex-col items-center justify-center p-4 selection:bg-[#5fffe0] selection:text-[#0c0c14] overflow-hidden relative">
      {/* Tactical Background Elements */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[#5fffe0]/5 blur-[120px] rounded-full"></div>
      </div>

      <div className="max-w-md w-full space-y-8 bg-[#12121a]/80 backdrop-blur-xl p-10 rounded-[2.5rem] border-2 border-white/5 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative z-10 overflow-hidden group">
        {/* Neon Accents */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#5fffe0] to-transparent opacity-50"></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#a855f7] to-transparent opacity-30"></div>

        <div className="text-center space-y-3">
          <div className="flex justify-center relative">
            <div className="p-5 bg-white/5 rounded-3xl text-[#5fffe0] mb-4 border border-white/10 group-hover:border-[#5fffe0]/50 transition-colors shadow-inner">
              <Ghost size={56} className="drop-shadow-[0_0_10px_rgba(95,255,224,0.5)]" />
            </div>
            <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-[#5fffe0]"></div>
            <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-[#5fffe0]"></div>
          </div>
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white drop-shadow-lg">
            DEADLOCK <span className="text-[#5fffe0]">SPY</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.4em]">Tactical Hero Infiltration</p>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 group/input">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5fffe0] ml-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[#5fffe0] rounded-full animate-pulse"></span>
              Hero Alias
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ENTER YOUR NAME..."
              className="w-full bg-black/40 border-2 border-white/5 rounded-2xl px-6 py-4 focus:outline-none focus:border-[#5fffe0]/50 focus:bg-black/60 transition-all placeholder:text-slate-700 font-bold tracking-wider text-white italic"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="relative group/btn h-14"
            >
              <div className="absolute inset-0 bg-[#5fffe0] rounded-2xl blur-md opacity-20 group-hover/btn:opacity-40 transition-opacity"></div>
              <div className="relative h-full flex items-center justify-center gap-2 bg-[#5fffe0] hover:bg-[#4de6c9] disabled:opacity-50 text-[#0c0c14] font-black py-3 px-4 rounded-2xl transition-all uppercase italic tracking-tighter">
                <Play size={20} fill="currentColor" />
                Host Room
              </div>
            </button>
            <button
              onClick={handleJoin}
              disabled={loading}
              className="h-14 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 border-2 border-white/10 hover:border-[#5fffe0]/30 disabled:opacity-50 text-white font-black py-3 px-4 rounded-2xl transition-all uppercase italic tracking-tighter"
            >
              <Users size={20} />
              Join Squad
            </button>
          </div>

          <div className="relative">
             <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                <span className="text-[#5fffe0] font-mono font-bold text-lg">#</span>
             </div>
             <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="SECTOR CODE"
                maxLength={6}
                className="w-full bg-black/40 border-2 border-white/5 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:border-[#5fffe0]/50 transition-all placeholder:text-slate-700 font-mono text-center tracking-[0.8em] font-bold text-xl text-[#5fffe0]"
              />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
              <p className="text-red-500 text-[10px] text-center font-black uppercase tracking-widest">{error}</p>
            </div>
          )}
        </div>

        <div className="pt-6 border-t border-white/5 mt-6">
          <div className="bg-white/5 p-5 rounded-3xl border border-white/5 space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-[#5fffe0] flex items-center gap-2">
              <Info size={14} /> Intelligence Briefing
            </h3>
            <div className="space-y-2">
              {[
                "Random Hero assigned to the squad.",
                "One Infiltrator (Spy) among you.",
                "Spy must identify the Hero's identity.",
                "Expose the Spy before they escape."
              ].map((text, i) => (
                <div key={i} className="flex gap-3 text-[11px] text-slate-400 font-medium">
                  <span className="text-[#5fffe0] font-mono">0{i+1}</span>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-12 flex flex-col items-center gap-2 z-10">
        <p className="text-slate-600 text-[10px] uppercase tracking-[0.5em] font-bold">Protocol v2.4.0</p>
        <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden">
          <div className="w-1/3 h-full bg-[#5fffe0]/40 rounded-full animate-infinite-scroll"></div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes infinite-scroll {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(300%); }
        }
        .animate-infinite-scroll {
          animation: infinite-scroll 2s linear infinite;
        }
      `}</style>
    </main>
  );
}
