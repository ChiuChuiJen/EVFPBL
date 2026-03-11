import React, { useEffect } from 'react';
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
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col font-sans">
      {/* Top Bar for Time Controls */}
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold tracking-tight text-emerald-400">EVFPBL 模擬器</h1>
          <div className="flex items-center gap-2 bg-zinc-800 px-4 py-2 rounded-lg">
            <Clock className="w-5 h-5 text-zinc-400" />
            <span className="font-mono text-lg font-medium">
              {format(currentDate, 'yyyy-MM-dd HH:mm')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => advanceTime(30)}
            className="p-2 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-100"
            title="+30 分鐘"
          >
            <FastForward className="w-5 h-5" />
          </button>
          
          <button
            onClick={togglePlay}
            className={cn(
              "p-2 rounded-md transition-colors flex items-center gap-2 px-4",
              isPlaying ? "bg-emerald-500/20 text-emerald-400" : "bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
            )}
          >
            {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
            <span className="font-medium">{isPlaying ? '暫停' : '自動模擬'}</span>
          </button>

          <div className="flex bg-zinc-800 rounded-md overflow-hidden ml-2">
            {[1, 5, 24].map((mult) => (
              <button
                key={mult}
                onClick={() => setMultiplier(mult)}
                className={cn(
                  "px-3 py-2 text-sm font-medium transition-colors",
                  timeMultiplier === mult ? "bg-emerald-500 text-zinc-950" : "text-zinc-400 hover:bg-zinc-700 hover:text-zinc-100"
                )}
              >
                {mult}x
              </button>
            ))}
          </div>

          <button
            onClick={advanceToNextDay}
            className="ml-2 p-2 bg-zinc-800 hover:bg-zinc-700 rounded-md transition-colors text-zinc-100 flex items-center gap-2 px-4"
          >
            <SkipForward className="w-5 h-5" />
            <span className="font-medium">下一日</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-64 bg-zinc-900 border-r border-zinc-800 flex flex-col">
          <div className="p-4 flex flex-col gap-2">
            <NavButton href="#dashboard" label="總覽 Dashboard" />
            <NavButton href="#standings" label="戰績 Standings" />
            <NavButton href="#teams" label="球隊 Teams" />
            <NavButton href="#schedule" label="賽程 Schedule" />
          </div>

          {/* News Section */}
          <div className="flex-1 min-h-0 overflow-y-auto border-t border-zinc-800 p-4 relative">
            <h3 className="text-sm font-bold text-emerald-400 mb-4 uppercase tracking-wider flex items-center gap-2 sticky top-0 bg-zinc-900 z-10 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              即時新聞與公告
            </h3>
            <div className="space-y-4">
              {useGameStore(state => state.news).slice(0, 15).map(item => (
                <div key={item.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <div className="text-xs text-zinc-500">{format(parseISO(item.date), 'MM/dd HH:mm')}</div>
                    {item.type === 'roster' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400 font-medium">異動</span>}
                    {item.type === 'game' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 font-medium">賽事</span>}
                    {item.type === 'league' && <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-medium">聯盟</span>}
                  </div>
                  <div className="font-bold text-zinc-200 text-sm mb-1 leading-tight">{item.title}</div>
                  <div className="text-xs text-zinc-400 line-clamp-3 whitespace-pre-wrap">{item.content}</div>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-950">
          {children}
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
        "px-4 py-3 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
          : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
      )}
    >
      {label}
    </a>
  );
}
