import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { format, parseISO, startOfWeek, addDays, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from './Layout';
import GameDetailsModal from './GameDetailsModal';
import TeamLogo from './TeamLogo';

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

  const getTeamName = (id: string, team?: { name: string }) => {
    if (team) return team.name;
    const map: Record<string, string> = {
      'R_SEED1': 'R+ 第一種子',
      'R_SEED2': 'R+ 第二種子',
      'R_SEED3': 'R+ 第三種子',
      'P_SEED1': 'P1 第一種子',
      'P_SEED2': 'P1 第二種子',
      'P_SEED3': 'P1 第三種子',
      'R_WINNER_R1': 'R+ 首輪勝隊',
      'P_WINNER_R1': 'P1 首輪勝隊',
      'R_CHAMP': 'R+ 冠軍',
      'P_CHAMP': 'P1 冠軍',
      'R_ALLSTAR': 'R+ 明星隊',
      'P_ALLSTAR': 'P1 明星隊',
      'WB_TEAM1': '香蕉聯隊',
      'WB_TEAM2': '猴子聯隊',
      'WB_TEAM3': '猩猩聯隊',
      'WB_TEAM4': '社會人聯隊',
      'WB_TEAM5': '業餘紅隊',
      'WB_TEAM6': '業餘藍隊',
    };
    return map[id] || id;
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">賽程 Schedule</h2>
          <p className="text-zinc-500 mt-1">檢視每週賽事安排與結果</p>
        </div>
        
        <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800/50 rounded-full p-1 shadow-inner backdrop-blur-sm">
          <button
            onClick={() => setViewDate(addDays(viewDate, -7))}
            className="p-2 hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-zinc-100 active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-mono font-bold text-zinc-200 px-4 tracking-wider">
            {format(weekStart, 'yyyy-MM-dd')} <span className="text-zinc-600 font-sans mx-1">至</span> {format(addDays(weekStart, 6), 'MM-dd')}
          </span>
          <button
            onClick={() => setViewDate(addDays(viewDate, 7))}
            className="p-2 hover:bg-zinc-800 rounded-full transition-all text-zinc-400 hover:text-zinc-100 active:scale-95"
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
              "bg-zinc-900/40 border rounded-2xl overflow-hidden flex flex-col h-[650px] backdrop-blur-sm transition-all",
              isToday ? "border-emerald-500/50 shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/20" : "border-zinc-800/50"
            )}>
              <div className={cn(
                "p-4 text-center border-b font-medium",
                isToday ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-zinc-950/80 text-zinc-400 border-zinc-800/50"
              )}>
                <div className="text-xs uppercase tracking-widest font-bold mb-1">{format(day, 'EEE')}</div>
                <div className="text-2xl font-black font-mono">{format(day, 'MM/dd')}</div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
                {dayGames.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-600 text-sm py-8 border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/20">
                    <span className="font-medium">無賽程</span>
                  </div>
                ) : (
                  dayGames.map(game => {
                    const home = teams.find(t => t.id === game.homeTeamId);
                    const away = teams.find(t => t.id === game.awayTeamId);
                    
                    return (
                      <button 
                        key={game.id} 
                        onClick={() => setSelectedGameId(game.id)}
                        className="w-full text-left bg-zinc-950/80 border border-zinc-800/60 rounded-xl p-4 text-sm flex flex-col gap-3 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group shadow-sm"
                      >
                        <div className="flex justify-between items-center text-xs text-zinc-500">
                          <span className="font-bold tracking-wider uppercase">{game.league}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded font-mono font-bold",
                            game.status === 'finished' ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          )}>
                            {game.status === 'finished' ? 'FINAL' : format(parseISO(game.date), 'HH:mm')}
                          </span>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <TeamLogo teamId={game.awayTeamId} className="w-4 h-4 flex-shrink-0" />
                              <span className="font-bold text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{getTeamName(game.awayTeamId, away)}</span>
                            </div>
                            <span className={cn(
                              "font-mono font-bold text-lg",
                              game.status === 'finished' && game.awayScore > game.homeScore ? "text-zinc-100" : "text-zinc-500"
                            )}>{game.status === 'finished' ? game.awayScore : '-'}</span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2 overflow-hidden">
                              <TeamLogo teamId={game.homeTeamId} className="w-4 h-4 flex-shrink-0" />
                              <span className="font-bold text-zinc-300 truncate group-hover:text-zinc-100 transition-colors">{getTeamName(game.homeTeamId, home)}</span>
                            </div>
                            <span className={cn(
                              "font-mono font-bold text-lg",
                              game.status === 'finished' && game.homeScore > game.awayScore ? "text-zinc-100" : "text-zinc-500"
                            )}>{game.status === 'finished' ? game.homeScore : '-'}</span>
                          </div>
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
