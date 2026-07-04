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
      if (data.error) throw new Error(data.error);
      
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
      if (data.error) throw new Error(data.error);

      localStorage.setItem(`room-${data.room.code}-player`, JSON.stringify(data.player));
      router.push(`/room/${data.room.code}`);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#120c1f] text-white flex flex-col items-center justify-center p-4 selection:bg-[#a855f7] selection:text-white">
      <div className="max-w-md w-full space-y-8 bg-[#1a142e] p-8 rounded-2xl border border-[#3c2f5a] shadow-2xl">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <div className="p-4 bg-[#2d214d] rounded-full text-[#a855f7] mb-2 border border-[#a855f7]/30">
              <Ghost size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#ec4899]">
            Deadlock Spy
          </h1>
          <p className="text-[#94a3b8] text-sm">Найди шпиона среди героев</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-[#a855f7]/70 ml-1">Твое Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Введите имя..."
              className="w-full bg-[#0f0a1a] border border-[#3c2f5a] rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a855f7] transition-all placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={handleCreate}
              disabled={loading}
              className="flex items-center justify-center gap-2 bg-[#a855f7] hover:bg-[#9333ea] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[#a855f7]/20"
            >
              <Play size={18} />
              Создать
            </button>
            <div className="relative group">
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-transparent border-2 border-[#3c2f5a] hover:border-[#a855f7] disabled:opacity-50 text-white font-bold py-3 px-4 rounded-xl transition-all"
              >
                <Users size={18} />
                Войти
              </button>
            </div>
          </div>

          <div className="relative">
             <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="text-[#a855f7] font-mono font-bold">#</span>
             </div>
             <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="КОД КОМНАТЫ"
                maxLength={6}
                className="w-full bg-[#0f0a1a] border border-[#3c2f5a] rounded-xl pl-8 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-[#a855f7] transition-all placeholder:text-gray-600 font-mono text-center tracking-[0.5em]"
              />
          </div>

          {error && <p className="text-red-500 text-xs text-center font-medium">{error}</p>}
        </div>

        <div className="pt-4 border-t border-[#3c2f5a] mt-6 space-y-4">
          <div className="bg-[#2d214d]/30 p-4 rounded-xl border border-[#3c2f5a]">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#a855f7] mb-2 flex items-center gap-2">
              <Info size={14} /> Как играть
            </h3>
            <ul className="text-[11px] text-[#94a3b8] space-y-1 list-disc pl-4">
              <li>Всем игрокам, кроме одного, выпадает случайный герой Deadlock.</li>
              <li>Один игрок становится <span className="text-red-400 font-bold uppercase">Шпионом</span>.</li>
              <li>Шпион не знает героя, но должен его вычислить.</li>
              <li>Задавайте друг другу вопросы, чтобы найти шпиона, но не выдайте героя!</li>
            </ul>
          </div>
        </div>
      </div>
      
      <p className="mt-8 text-[#4b4461] text-xs uppercase tracking-[0.2em]">Based on Valve's Deadlock</p>
    </main>
  );
}
