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
  votedFor: number | null;
}

interface Room {
  id: number;
  code: string;
  status: "lobby" | "playing" | "finished";
  character: string | null;
  spyId: number | null;
  startTime: string | null;
  duration: number;
  winner: string | null; // Changed to string for easier message handling
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
  const [guess, setGuess] = useState("");
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
      setGuess("");
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const voteForPlayer = async (targetId: number) => {
    if (!room || !me || room.status !== "playing") return;
    try {
      await fetch("/api/room/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, playerId: me.id, targetId }),
      });
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const submitGuess = async () => {
    if (!room || !me || !me.isSpy || !guess) return;
    try {
      await fetch("/api/room/guess", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: room.id, playerId: me.id, guess }),
      });
      fetchState();
    } catch (err) {
      console.error(err);
    }
  };

  const leaveRoom = () => {
    localStorage.removeItem(`room-${code}-player`);
    router.push("/");
  };

  if (loading) return <div className="min-h-screen bg-[#120c1f] text-white flex items-center justify-center font-mono">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#a855f7] border-t-transparent rounded-full animate-spin"></div>
      <p className="uppercase tracking-widest text-xs animate-pulse">Establishing Connection...</p>
    </div>
  </div>;
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
    <div className="min-h-screen bg-[#0a0812] text-slate-100 flex flex-col selection:bg-[#a855f7] font-sans overflow-x-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a855f7]/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#ec4899]/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
      </div>

      {/* Header */}
      <header className="bg-[#120c1f]/60 backdrop-blur-xl border-b border-white/5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
             <div className="p-2.5 bg-gradient-to-br from-[#a855f7] to-[#ec4899] rounded-xl text-white shadow-lg shadow-[#a855f7]/20">
               <Ghost size={24} />
             </div>
             <div className="hidden sm:block">
               <h1 className="font-black text-xl uppercase italic tracking-tighter leading-none text-white">Deadlock Spy</h1>
               <div className="flex items-center gap-2 text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1">
                 <span className="flex items-center gap-1"><Users size={10} /> {players.length} Heroes</span>
                 <span>•</span>
                 <span className="text-[#a855f7]">Sector: {code}</span>
               </div>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={copyCode}
              className="flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-all border border-white/10 group"
            >
              {copied ? <CheckCircle2 size={16} className="text-green-400" /> : <Copy size={16} className="text-slate-400 group-hover:text-white transition-colors" />}
              <span className="font-mono text-[#a855f7]">{code}</span>
            </button>
            
            <button 
              onClick={leaveRoom}
              className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl border border-red-500/20 transition-all title='Выйти'"
            >
              <XCircle size={22} />
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-4xl w-full mx-auto p-4 space-y-6 pb-20">
        
        {room?.status === "lobby" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="bg-[#120c1f]/40 backdrop-blur-md p-8 rounded-[2rem] border border-white/5 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <Users size={120} />
              </div>
              
              <div className="relative">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                  <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-1">Лобби</h2>
                    <p className="text-slate-500 text-xs uppercase tracking-[0.2em]">Ожидание героев для начала вылазки</p>
                  </div>
                  {me?.isHost && (
                    <div className="flex items-center gap-2 bg-[#a855f7]/10 px-4 py-2 rounded-full border border-[#a855f7]/20">
                      <div className="w-2 h-2 bg-[#a855f7] rounded-full animate-pulse"></div>
                      <span className="text-[10px] font-bold text-[#a855f7] uppercase tracking-widest">Вы Лидер</span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {players.map((p) => (
                    <div key={p.id} className={cn(
                      "flex items-center justify-between p-4 rounded-2xl border transition-all duration-300 group",
                      p.id === me?.id 
                        ? "bg-gradient-to-r from-[#a855f7]/20 to-transparent border-[#a855f7]/40 shadow-lg shadow-[#a855f7]/5" 
                        : "bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black border transition-all duration-300",
                          p.id === me?.id ? "bg-[#a855f7] border-[#a855f7] text-white" : "bg-white/5 border-white/10 text-slate-400 group-hover:border-[#a855f7]/50"
                        )}>
                          {p.name[0].toUpperCase()}
                        </div>
                        <div>
                          <span className={cn(
                            "block font-bold text-lg leading-none",
                            p.id === me?.id ? "text-white" : "text-slate-300"
                          )}>
                            {p.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-1 block">
                            {p.id === me?.id ? "Вы подключены" : "В сети"}
                          </span>
                        </div>
                      </div>
                      {p.isHost && (
                        <div className="bg-white/10 p-2 rounded-lg text-white/60" title="Хост">
                          <LayoutGrid size={16} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {me?.isHost && (
                  <div className="mt-12 flex flex-col items-center gap-6">
                    <button 
                      onClick={startGame}
                      disabled={players.length < 3}
                      className="group relative w-full sm:w-80"
                    >
                      <div className="absolute inset-0 bg-[#a855f7] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity"></div>
                      <div className="relative bg-[#a855f7] hover:bg-[#9333ea] disabled:bg-white/5 disabled:text-slate-600 text-white font-black py-5 rounded-2xl transition-all flex items-center justify-center gap-3 text-xl uppercase italic tracking-tighter overflow-hidden">
                        <Play size={24} fill="currentColor" />
                        Начать Матч
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                      </div>
                    </button>
                    {players.length < 3 ? (
                      <p className="text-[10px] text-red-400/80 font-bold uppercase tracking-[0.2em] bg-red-400/5 px-4 py-2 rounded-full border border-red-400/10">
                        Необходимо минимум 3 героя для начала
                      </p>
                    ) : (
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] animate-pulse">
                        Все герои готовы к высадке
                      </p>
                    )}
                  </div>
                )}
              </div>
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
            {/* Voting & Players */}
            <div className="bg-[#1a142e] p-6 rounded-2xl border border-[#3c2f5a]">
              <h3 className="text-sm font-bold uppercase tracking-widest text-[#a855f7] mb-4">Голосование за шпиона</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {players.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => p.id !== me?.id && voteForPlayer(p.id)}
                    disabled={p.id === me?.id}
                    className={cn(
                      "flex items-center justify-between p-3 rounded-xl border transition-all relative group",
                      me?.votedFor === p.id ? "bg-[#a855f7]/20 border-[#a855f7]" : "bg-[#0f0a1a] border-[#3c2f5a] hover:border-[#a855f7]/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#1a142e] flex items-center justify-center text-sm font-bold border border-[#3c2f5a]">
                        {p.name[0].toUpperCase()}
                      </div>
                      <div className="text-left">
                        <span className="block font-medium text-sm">{p.name}</span>
                        <div className="flex gap-1 mt-1">
                          {players.filter(v => v.votedFor === p.id).map((_, i) => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#a855f7]" />
                          ))}
                        </div>
                      </div>
                    </div>
                    {me?.votedFor === p.id && <CheckCircle2 size={16} className="text-[#a855f7]" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Spy Guessing */}
            {me?.isSpy && (
              <div className="bg-red-900/10 p-6 rounded-2xl border border-red-500/30">
                <h3 className="text-sm font-bold uppercase tracking-widest text-red-400 mb-4">Угадать героя (Победа шпиона)</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={guess}
                    onChange={(e) => setGuess(e.target.value)}
                    placeholder="Введите имя героя..."
                    className="flex-1 bg-[#0f0a1a] border border-red-500/20 rounded-xl px-4 py-2 focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <button 
                    onClick={submitGuess}
                    className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-xl font-bold text-sm transition-all"
                  >
                    Угадать
                  </button>
                </div>
              </div>
            )}

            {/* Reference List */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-[#a855f7]">Все Герои Deadlock</h3>
                <span className="text-[10px] text-slate-500 uppercase">{DEADLOCK_CHARACTERS.length} ГЕРОЕВ</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {DEADLOCK_CHARACTERS.map((char) => (
                  <div 
                    key={char.name} 
                    onClick={() => me?.isSpy && setGuess(char.name)}
                    className={cn(
                      "group cursor-pointer rounded-xl border p-2 transition-all flex flex-col items-center gap-2 text-center",
                      !me?.isSpy && char.name === room.character ? "bg-[#2d214d] border-[#a855f7] shadow-lg shadow-[#a855f7]/10" : "bg-[#0f0a1a] border-[#3c2f5a] hover:border-[#a855f7]/30"
                    )}
                  >
                    <div 
                      className="w-full aspect-[3/4] rounded-lg flex items-center justify-center text-3xl transition-transform group-hover:scale-105 overflow-hidden bg-[#0f0a1a]"
                      style={{ border: `1px solid ${char.color}40` }}
                    >
                      <img 
                        src={char.image} 
                        alt={char.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${char.name}&background=1a142e&color=a855f7`;
                        }}
                      />
                    </div>
                    <span className={cn(
                      "text-[11px] font-bold uppercase tracking-wider",
                      !me?.isSpy && char.name === room.character ? "text-white" : "text-slate-400"
                    )}>{char.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {room?.status === "finished" && (
          <div className="bg-[#1a142e] p-10 rounded-3xl border border-[#3c2f5a] text-center space-y-8 animate-in zoom-in duration-500 relative overflow-hidden">
            <div className={cn(
              "absolute inset-0 opacity-10 pointer-events-none",
              room.winner === "spy" ? "bg-red-500" : "bg-[#a855f7]"
            )}></div>
            
            <div className="relative space-y-4">
              <h2 className={cn(
                "text-5xl font-black italic uppercase tracking-tighter",
                room.winner === "spy" ? "text-red-500" : "text-[#a855f7]"
              )}>
                {room.winner === "spy" ? "ШПИОН ПОБЕДИЛ!" : "МИРНЫЕ ПОБЕДИЛИ!"}
              </h2>
              <p className="text-slate-400 text-sm uppercase tracking-[0.3em]">Раунд Окончен</p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg mx-auto relative">
               <div className="bg-[#0f0a1a]/80 backdrop-blur-sm p-6 rounded-2xl border border-[#3c2f5a]">
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-widest">Шпион был</p>
                  <p className="text-2xl font-black text-white">{players.find(p => p.id === room.spyId)?.name}</p>
               </div>
               <div className="bg-[#0f0a1a]/80 backdrop-blur-sm p-6 rounded-2xl border border-[#3c2f5a]">
                  <p className="text-[10px] uppercase text-slate-500 font-bold mb-2 tracking-widest">Герой был</p>
                  <p className="text-2xl font-black text-white">{room.character}</p>
               </div>
            </div>

            <div className="pt-8 relative">
              {me?.isHost ? (
                <button 
                  onClick={resetRoom}
                  className="bg-white text-black hover:bg-slate-200 font-black py-4 px-12 rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2 mx-auto uppercase italic tracking-tighter"
                >
                  Следующий раунд
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-bounce"></div>
                    <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-bounce [animation-delay:-0.15s]"></div>
                    <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-bounce [animation-delay:-0.3s]"></div>
                  </div>
                  <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Ожидание хоста...</p>
                </div>
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
