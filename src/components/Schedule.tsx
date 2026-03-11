import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './Layout';
import GameDetailsModal from './GameDetailsModal';

export default function Schedule() {
  const { schedule, teams, currentDate } = useGameStore();
  const [viewDate, setViewDate] = useState(currentDate);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const weekStart = startOfWeek(viewDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  const weekGames = schedule.filter(g => {
    const gameDate = parseISO(g.date);
    return gameDate >= weekStart && gameDate < addDays(weekStart, 7);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100">賽程 Schedule</h2>
        
        <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
          <button
            onClick={() => setViewDate(addDays(viewDate, -7))}
            className="p-2 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-mono font-medium text-zinc-200 px-4">
            {format(weekStart, 'yyyy-MM-dd')} ~ {format(addDays(weekStart, 6), 'MM-dd')}
          </span>
          <button
            onClick={() => setViewDate(addDays(viewDate, 7))}
            className="p-2 hover:bg-zinc-800 rounded-md transition-colors text-zinc-400 hover:text-zinc-100"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
        {weekDays.map(day => {
          const dayGames = weekGames.filter(g => isSameDay(parseISO(g.date), day));
          const isToday = isSameDay(day, currentDate);

          return (
            <div key={day.toISOString()} className={cn(
              "bg-zinc-900 border rounded-xl overflow-hidden flex flex-col h-[600px]",
              isToday ? "border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.1)]" : "border-zinc-800"
            )}>
              <div className={cn(
                "p-3 text-center border-b font-medium",
                isToday ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-950 text-zinc-400 border-zinc-800"
              )}>
                <div className="text-sm uppercase">{format(day, 'EEE')}</div>
                <div className="text-lg font-bold">{format(day, 'MM/dd')}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {dayGames.length === 0 ? (
                  <div className="text-center text-zinc-600 text-sm py-4">無賽程</div>
                ) : (
                  dayGames.map(game => {
                    const home = teams.find(t => t.id === game.homeTeamId);
                    const away = teams.find(t => t.id === game.awayTeamId);
                    
                    return (
                      <button 
                        key={game.id} 
                        onClick={() => setSelectedGameId(game.id)}
                        className="w-full text-left bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-sm flex flex-col gap-2 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all cursor-pointer"
                      >
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                          <span>{game.league}</span>
                          <span className={cn(
                            "px-1.5 py-0.5 rounded",
                            game.status === 'finished' ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/10 text-emerald-400"
                          )}>
                            {game.status === 'finished' ? '結束' : format(parseISO(game.date), 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-300 truncate">{away?.name || game.awayTeamId}</span>
                          <span className="font-mono font-bold text-zinc-400">{game.status === 'finished' ? game.awayScore : '-'}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-300 truncate">{home?.name || game.homeTeamId}</span>
                          <span className="font-mono font-bold text-zinc-400">{game.status === 'finished' ? game.homeScore : '-'}</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>

      {selectedGameId && (
        <GameDetailsModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}
    </div>
  );
}
