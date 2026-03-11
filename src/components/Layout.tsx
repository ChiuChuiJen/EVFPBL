import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { format, parseISO } from 'date-fns';
import { Play, Pause, FastForward, SkipForward, Clock } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function Layout({ children }: { children: React.ReactNode }) {
  const { currentDate, isPlaying, timeMultiplier, togglePlay, advanceTime, advanceToNextDay, setMultiplier } = useGameStore();
  const [newsFilter, setNewsFilter] = useState<'all' | 'game' | 'roster' | 'league'>('all');

  useEffect(() => {
    let interval: number;
    if (isPlaying) {
      interval = window.setInterval(() => {
        advanceTime(30 * timeMultiplier);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, timeMultiplier, advanceTime]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-zinc-50 flex flex-col font-sans selection:bg-emerald-500/30">
      {/* Top Bar for Time Controls */}
      <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/50 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <span className="font-black text-zinc-950 text-sm tracking-tighter">EV</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-zinc-100">EVFPBL <span className="text-zinc-500 font-medium text-sm ml-1">Simulator</span></h1>
          </div>
          <div className="h-6 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/50 px-4 py-2 rounded-full shadow-inner">
            <Clock className="w-4 h-4 text-emerald-500" />
            <span className="font-mono text-sm font-medium tracking-wide text-zinc-300">
              {format(currentDate, 'yyyy-MM-dd HH:mm')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => advanceTime(30)}
            className="p-2.5 rounded-full transition-all text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/80 active:scale-95"
            title="+30 分鐘"
          >
            <FastForward className="w-4 h-4" />
          </button>
          
          <button
            onClick={togglePlay}
            className={cn(
              "p-2.5 rounded-full transition-all flex items-center justify-center shadow-lg active:scale-95",
              isPlaying 
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" 
                : "bg-zinc-100 text-zinc-900 hover:bg-white"
            )}
            title={isPlaying ? '暫停' : '自動模擬'}
          >
            {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
          </button>

          <div className="flex bg-zinc-900/80 border border-zinc-800/50 rounded-full overflow-hidden ml-2 p-0.5 shadow-inner">
            {[1, 5, 24].map((mult) => (
              <button
                key={mult}
                onClick={() => setMultiplier(mult)}
                className={cn(
                  "px-3 py-1.5 text-xs font-mono font-medium transition-all rounded-full",
                  timeMultiplier === mult 
                    ? "bg-zinc-700 text-zinc-100 shadow-sm" 
                    : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                {mult}x
              </button>
            ))}
          </div>

          <button
            onClick={advanceToNextDay}
            className="ml-2 px-4 py-2 bg-zinc-900/80 border border-zinc-800/50 hover:bg-zinc-800 hover:border-zinc-700 rounded-full transition-all text-zinc-300 flex items-center gap-2 text-sm font-medium active:scale-95 shadow-sm"
          >
            <SkipForward className="w-4 h-4 text-zinc-400" />
            <span>下一日</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-72 bg-zinc-950 border-r border-zinc-800/50 flex flex-col relative z-40">
          <div className="p-4 flex flex-col gap-1.5">
            <NavButton href="#dashboard" label="總覽 Dashboard" />
            <NavButton href="#standings" label="戰績 Standings" />
            <NavButton href="#teams" label="球隊 Teams" />
            <NavButton href="#schedule" label="賽程 Schedule" />
            <NavButton href="#awards" label="個人獎項 Awards" />
          </div>

          {/* News Section */}
          <div className="flex-1 min-h-0 flex flex-col border-t border-zinc-800/50 p-5 relative bg-gradient-to-b from-zinc-950 to-[#050505]">
            <h3 className="text-xs font-bold text-zinc-400 mb-4 uppercase tracking-widest flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              即時新聞與公告
            </h3>
            
            <div className="flex flex-wrap gap-1.5 mb-4">
              <button 
                onClick={() => setNewsFilter('all')}
                className={cn("px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold transition-all", newsFilter === 'all' ? "bg-zinc-200 text-zinc-900" : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300")}
              >全部 ALL</button>
              <button 
                onClick={() => setNewsFilter('game')}
                className={cn("px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold transition-all", newsFilter === 'game' ? "bg-orange-500/20 text-orange-400 border border-orange-500/30" : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300")}
              >賽事 GAME</button>
              <button 
                onClick={() => setNewsFilter('roster')}
                className={cn("px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold transition-all", newsFilter === 'roster' ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300")}
              >異動 ROSTER</button>
              <button 
                onClick={() => setNewsFilter('league')}
                className={cn("px-2.5 py-1 text-[10px] uppercase tracking-wider rounded-full font-bold transition-all", newsFilter === 'league' ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-zinc-900 border border-zinc-800 text-zinc-500 hover:text-zinc-300")}
              >聯盟 LEAGUE</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 -mr-2 custom-scrollbar">
              {useGameStore(state => state.news)
                .filter(item => newsFilter === 'all' || item.type === newsFilter)
                .slice(0, 15)
                .map(item => (
                <div key={item.id} className="group bg-zinc-900/40 p-3.5 rounded-xl border border-zinc-800/40 hover:bg-zinc-900 hover:border-zinc-700/50 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[10px] font-mono text-zinc-500 tracking-wider">{format(parseISO(item.date), 'MM/dd HH:mm')}</div>
                    {item.type === 'roster' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 font-bold uppercase tracking-wider border border-blue-500/20">異動</span>}
                    {item.type === 'game' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400 font-bold uppercase tracking-wider border border-orange-500/20">賽事</span>}
                    {item.type === 'league' && <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-bold uppercase tracking-wider border border-emerald-500/20">聯盟</span>}
                  </div>
                  <div className="font-bold text-zinc-200 text-sm mb-1.5 leading-snug group-hover:text-emerald-400 transition-colors">{item.title}</div>
                  <div className="text-xs text-zinc-500 line-clamp-3 whitespace-pre-wrap leading-relaxed">{item.content}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-[#0a0a0a] relative">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

function NavButton({ href, label }: { href: string; label: string }) {
  // Simple hash routing for standalone app
  const isActive = window.location.hash === href || (window.location.hash === '' && href === '#dashboard');
  
  return (
    <a
      href={href}
      className={cn(
        "px-4 py-3 rounded-xl text-sm font-medium transition-all flex items-center gap-3",
        isActive 
          ? "bg-zinc-900 text-zinc-100 shadow-sm border border-zinc-800/60" 
          : "text-zinc-500 hover:bg-zinc-900/50 hover:text-zinc-300 border border-transparent"
      )}
    >
      <div className={cn("w-1.5 h-1.5 rounded-full", isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" : "bg-transparent")} />
      {label}
    </a>
  );
}
