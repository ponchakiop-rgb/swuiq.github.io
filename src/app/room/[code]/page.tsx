"use client";

import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { Ghost, Users, Play, XCircle, Timer, Copy, CheckCircle2, LayoutGrid, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { DEADLOCK_CHARACTERS } from "@/constants";

interface Player {
  id: number;
  name: string;
  isHost: boolean;
  isSpy: boolean;
}

interface Room {
  id: number;
  code: string;
  status: "lobby" | "playing" | "finished";
  character: string | null;
  spyId: number | null;
  startTime: string | null;
  duration: number;
}

export default function RoomPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [room, setRoom] = useState<Room | null>(null);
  const [players, setPlayers] = useState<Player[]>([]);
  const [me, setMe] = useState<Player | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showRole, setShowRole] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const router = useRouter();

  const fetchState = useCallback(async () => {
    try {
      const res = await fetch(`/api/room/${code}`);
      if (!res.ok) throw new Error("Room not found");
      const data = await res.json();
      setRoom(data.room);
      setPlayers(data.players);

      const savedPlayer = localStorage.getItem(`room-${code}-player`);
      if (savedPlayer) {
        const parsed = JSON.parse(savedPlayer);
        const actualMe = data.players.find((p: Player) => p.id === parsed.id);
        if (actualMe) setMe(actualMe);
      }
      setLoading(false);
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  }, [code]);

  useEffect(() => {
    fetchState();
    const interval = setInterval(fetchState, 3000);
    return () => clearInterval(interval);
  }, [fetchState]);

  useEffect(() => {
    if (room?.status === "playing" && room.startTime) {
      const start = new Date(room.startTime).getTime();
      const duration = room.duration * 1000;
      
      const timer = setInterval(() => {
        const now = Date.now();
        const elapsed = now - start;
        const remaining = Math.max(0, Math.floor((duration - elapsed) / 1000));
        setTimeLeft(remaining);
        if (remaining === 0) clearInterval(timer);
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [room?.status, room?.startTime, room?.duration]);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const startGame = async () => {
    if (!me?.isHost || !room) return;
    try {
      const res = await fetch("/api/room/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, playerId: me.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        alert(data.error);
      }
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const endGame = async () => {
    if (!room || !me) return;
    try {
      await fetch("/api/room/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, playerId: me.id }),
      });
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const resetRoom = async () => {
    if (!room || !me?.isHost) return;
    try {
      await fetch("/api/room/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id }),
      });
      setShowRole(false);
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#120c1f] text-white flex items-center justify-center">Загрузка...</div>;
  if (error) return <div className="min-h-screen bg-[#120c1f] text-white flex flex-col items-center justify-center gap-4">
    <p className="text-red-500">{error}</p>
    <button onClick={() => router.push("/")} className="bg-[#a855f7] px-4 py-2 rounded-lg">На главную</button>
  </div>;

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#120c1f] text-slate-100 flex flex-col selection:bg-[#a855f7]">
      {/* Header */}
      <header className="bg-[#1a142e]/80 backdrop-blur-md border-b border-[#3c2f5a] sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-[#2d214d] rounded-lg text-[#a855f7]">
               <Ghost size={24} />
             </div>
             <div>
               <h1 className="font-black text-lg uppercase italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#a855f7] to-[#ec4899]">Deadlock Spy</h1>
               <div className="flex items-center gap-2 text-[10px] text-slate-400 uppercase tracking-widest">
                 <span className="flex items-center gap-1"><Users size={10} /> {players.length} Игроков</span>
                 <span>•</span>
                 <span>ROOM: {code}</span>
               </div>
             </div>
          </div>
          <button 
            onClick={copyCode}
            className="flex items-center gap-2 bg-[#2d214d] hover:bg-[#3c2f5a] px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border border-[#a855f7]/20"
          >
            {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} />}
            <span className="font-mono">{code}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-6 pb-20">
        
        {room?.status === "lobby" && (
          <div className="space-y-6">
            <div className="bg-[#1a142e] p-6 rounded-2xl border border-[#3c2f5a] shadow-xl">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Users className="text-[#a855f7]" /> Ожидание игроков
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p) => (
                  <div key={p.id} className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    p.id === me?.id ? "bg-[#2d214d] border-[#a855f7]/50" : "bg-[#0f0a1a] border-[#3c2f5a]"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a142e] flex items-center justify-center text-sm font-bold border border-[#3c2f5a]">
                        {p.name[0].toUpperCase()}
                      </div>
                      <span className="font-medium">{p.name} {p.id === me?.id && "(Вы)"}</span>
                    </div>
                    {p.isHost && <span className="text-[10px] bg-[#a855f7]/20 text-[#a855f7] px-2 py-0.5 rounded-full font-bold border border-[#a855f7]/30">HOST</span>}
                  </div>
                ))}
              </div>

              {me?.isHost && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <button 
                    onClick={startGame}
                    disabled={players.length < 3}
                    className="w-full sm:w-64 bg-[#a855f7] hover:bg-[#9333ea] disabled:bg-[#3c2f5a] disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-[#a855f7]/20 flex items-center justify-center gap-2 text-lg"
                  >
                    <Play size={20} />
                    Начать Игру
                  </button>
                  {players.length < 3 && <p className="text-xs text-slate-500 uppercase tracking-widest">Минимум 3 игрока</p>}
                </div>
              )}
            </div>
          </div>
        )}

        {room?.status === "playing" && (
          <div className="space-y-6 animate-in fade-in zoom-in duration-300">
            {/* Role Card */}
            <div className="bg-[#1a142e] overflow-hidden rounded-2xl border border-[#3c2f5a] shadow-2xl relative">
              <div className="h-2 bg-gradient-to-r from-[#a855f7] via-[#ec4899] to-[#a855f7] bg-[length:200%_100%] animate-gradient"></div>
              <div className="p-8 text-center space-y-6">
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#a855f7] font-bold">Твоя Роль</p>
                  <div 
                    onClick={() => setShowRole(!showRole)}
                    className="cursor-pointer group relative inline-block"
                  >
                    <div className={cn(
                      "text-5xl font-black italic uppercase tracking-tighter transition-all duration-500 filter",
                      !showRole && "blur-xl select-none opacity-20"
                    )}>
                      {me?.isSpy ? "ШПИОН" : room.character}
                    </div>
                    {!showRole && (
                      <div className="absolute inset-0 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <div className="flex flex-col items-center gap-1">
                          <EyeOff size={32} />
                          <span className="text-[10px] font-bold uppercase tracking-widest">Нажми, чтобы увидеть</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-center items-center gap-8">
                  <div className="text-center">
                    <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Время</p>
                    <div className={cn("text-3xl font-mono font-bold flex items-center gap-2", timeLeft < 60 ? "text-red-500 animate-pulse" : "text-slate-200")}>
                      <Timer size={24} />
                      {formatTime(timeLeft)}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-center gap-4">
                  <button 
                    onClick={endGame}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-6 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
                  >
                    <XCircle size={18} />
                    Завершить
                  </button>
                </div>
              </div>
            </div>

            {/* Reference List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#a855f7]">Все Герои Deadlock</h3>
                <span className="text-[10px] text-slate-500 uppercase">{DEADLOCK_CHARACTERS.length} ГЕРОЕВ</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {DEADLOCK_CHARACTERS.map((char) => (
                  <div key={char} className={cn(
                    "p-3 rounded-lg border text-sm font-medium transition-all",
                    !me?.isSpy && char === room.character ? "bg-[#2d214d] border-[#a855f7] text-white shadow-lg shadow-[#a855f7]/10" : "bg-[#0f0a1a] border-[#3c2f5a] text-slate-400"
                  )}>
                    {char}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {room?.status === "finished" && (
          <div className="bg-[#1a142e] p-8 rounded-2xl border border-[#3c2f5a] text-center space-y-6 animate-in zoom-in duration-300">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#a855f7]">Раунд Окончен!</h2>
            
            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
               <div className="bg-[#0f0a1a] p-4 rounded-xl border border-[#3c2f5a]">
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Шпион был</p>
                  <p className="text-xl font-bold text-white">{players.find(p => p.id === room.spyId)?.name}</p>
               </div>
               <div className="bg-[#0f0a1a] p-4 rounded-xl border border-[#3c2f5a]">
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-1">Герой был</p>
                  <p className="text-xl font-bold text-white">{room.character}</p>
               </div>
            </div>

            <div className="pt-6">
              {me?.isHost ? (
                <button 
                  onClick={resetRoom}
                  className="bg-[#a855f7] hover:bg-[#9333ea] text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg shadow-[#a855f7]/20 flex items-center justify-center gap-2 mx-auto"
                >
                  Вернуться в лобби
                </button>
              ) : (
                <p className="text-sm text-slate-500 animate-pulse uppercase tracking-widest font-bold">Ожидание хоста...</p>
              )}
            </div>
          </div>
        )}

      </main>

      {/* Footer Info for Spy */}
      {room?.status === "playing" && me?.isSpy && (
        <div className="fixed bottom-0 left-0 right-0 bg-red-900/20 border-t border-red-500/30 backdrop-blur-sm p-3 text-center z-10">
          <p className="text-xs text-red-400 font-bold uppercase tracking-widest">Ты — Шпион! Твоя задача — узнать героя, не выдав себя.</p>
        </div>
      )}
      
      <style jsx global>{`
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .animate-gradient {
          animation: gradient 3s ease infinite;
        }
      `}</style>
    </div>
  );
}
