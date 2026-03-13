import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { format, isSameDay, parseISO, getMonth, getDate } from 'date-fns';
import GameDetailsModal from './GameDetailsModal';
import { cn } from './Layout';
import TeamLogo from './TeamLogo';

function getSeasonPhase(date: Date) {
  const month = getMonth(date) + 1; // 1-12
  const day = getDate(date);

  if (month === 3) return '春訓 (Spring Training)';
  if (month >= 4 && month <= 6) return '例行賽 上半季 (Regular Season - 1st Half)';
  if (month === 7 && day <= 7) return '明星週 (All-Star Week)';
  if (month === 7 && day > 7 && day <= 14) return '下半季 整備週 (Break)';
  if ((month === 7 && day > 14) || month === 8 || month === 9) return '例行賽 下半季 (Regular Season - 2nd Half)';
  if (month === 10) return '季後賽 (Postseason)';
  if (month === 11 || month === 12 || month === 1) return '冬季香蕉聯盟 (Winter Banana League)';
  return '休賽季 (Offseason)';
}

export default function Dashboard() {
  const { currentDate, schedule, teams, standings } = useGameStore();
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);

  const todaysGames = schedule.filter(g => isSameDay(parseISO(g.date), currentDate));
  
  // Find top teams
  const rLeagueTeams = teams.filter(t => t.league === 'R+').map(t => standings[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);
  const pLeagueTeams = teams.filter(t => t.league === 'P1').map(t => standings[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);

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
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-100 tracking-tight">總覽 Dashboard</h2>
          <p className="text-zinc-400 mt-2 text-sm font-medium">檢視今日賽程與聯盟戰況</p>
        </div>
        <div className="px-6 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-2xl font-black text-sm shadow-[0_0_20px_rgba(16,185,129,0.15)] flex items-center gap-3 backdrop-blur-sm">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]"></div>
          {getSeasonPhase(currentDate)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Today's Games */}
        <div className="xl:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-md shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex items-center justify-between mb-8 relative z-10">
            <h3 className="text-2xl font-black text-zinc-100 flex items-center gap-4 tracking-tight">
              <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span>
              今日賽程
            </h3>
            <span className="text-sm font-mono font-bold text-zinc-400 bg-zinc-950/80 px-5 py-2 rounded-xl border border-zinc-800/80 shadow-inner">{format(currentDate, 'yyyy-MM-dd')}</span>
          </div>
          
          {todaysGames.length === 0 ? (
            <div className="text-zinc-600 py-20 text-center border-2 border-dashed border-zinc-800/60 rounded-3xl bg-zinc-950/30 font-black text-xl tracking-widest relative z-10">今日無賽程</div>
          ) : (
            <div className="space-y-5 relative z-10">
              {todaysGames.map(game => {
                const home = teams.find(t => t.id === game.homeTeamId);
                const away = teams.find(t => t.id === game.awayTeamId);
                
                return (
                  <button 
                    key={game.id} 
                    onClick={() => setSelectedGameId(game.id)}
                    className="w-full flex items-center justify-between bg-zinc-950/80 p-6 rounded-3xl border border-zinc-800/60 hover:bg-zinc-900/90 hover:border-zinc-700/80 transition-all cursor-pointer group shadow-sm hover:shadow-lg relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/5 via-transparent to-white/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                    <div className="flex items-center gap-6 flex-1 justify-end relative z-10">
                      <div className="text-right">
                        <div className="font-black text-2xl text-zinc-200 group-hover:text-white transition-colors tracking-tight">{getTeamName(game.awayTeamId, away)}</div>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">{away?.league || game.league}</div>
                      </div>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-900 border-2 border-zinc-800 shadow-inner group-hover:border-zinc-700 transition-colors">
                        <TeamLogo teamId={game.awayTeamId} className="w-10 h-10" />
                      </div>
                      <div className={cn(
                        "text-5xl font-black w-20 text-center font-mono tracking-tighter",
                        game.status === 'finished' && game.awayScore > game.homeScore ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "text-zinc-600"
                      )}>
                        {game.status === 'finished' ? game.awayScore : '-'}
                      </div>
                    </div>
                    
                    <div className="px-10 flex flex-col items-center justify-center relative z-10">
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-px h-full bg-gradient-to-b from-transparent via-zinc-700/50 to-transparent"></div>
                      </div>
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 bg-zinc-950 px-3 relative z-10">
                        {game.status === 'finished' ? 'FINAL' : 'VS'}
                      </div>
                      <div className="text-xs font-mono font-black text-zinc-400 bg-zinc-900 px-4 py-1.5 rounded-lg border border-zinc-800 shadow-inner relative z-10">
                        {game.status === 'finished' ? '結束' : format(parseISO(game.date), 'HH:mm')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6 flex-1 justify-start relative z-10">
                      <div className={cn(
                        "text-5xl font-black w-20 text-center font-mono tracking-tighter",
                        game.status === 'finished' && game.homeScore > game.awayScore ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]" : "text-zinc-600"
                      )}>
                        {game.status === 'finished' ? game.homeScore : '-'}
                      </div>
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center bg-zinc-900 border-2 border-zinc-800 shadow-inner group-hover:border-zinc-700 transition-colors">
                        <TeamLogo teamId={game.homeTeamId} className="w-10 h-10" />
                      </div>
                      <div className="text-left">
                        <div className="font-black text-2xl text-zinc-200 group-hover:text-white transition-colors tracking-tight">{getTeamName(game.homeTeamId, home)}</div>
                        <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1.5">{home?.league || game.league}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        
        {/* League Leaders */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-md shadow-xl flex flex-col relative overflow-hidden">
          <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -ml-20 -mt-20 pointer-events-none"></div>
          <h3 className="text-2xl font-black text-zinc-100 mb-8 flex items-center gap-4 tracking-tight relative z-10">
            <span className="w-2 h-8 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.5)]"></span>
            聯盟領先者
          </h3>
          
          <div className="space-y-10 flex-1 relative z-10">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)] inline-block">R+ 聯盟</h4>
              </div>
              <div className="space-y-3">
                {rLeagueTeams.slice(0, 3).map((record, idx) => {
                  const team = teams.find(t => t.id === record.teamId);
                  return (
                    <div key={record.teamId} className="flex items-center justify-between bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black font-mono shadow-inner",
                          idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]" : 
                          idx === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                          "bg-orange-700/20 text-orange-700 border border-orange-700/30"
                        )}>
                          {idx + 1}
                        </div>
                        <span className="font-black text-zinc-200 group-hover:text-white transition-colors text-lg tracking-tight">{team?.name}</span>
                      </div>
                      <div className="font-mono text-base font-black text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 shadow-inner">
                        {record.wins}W - {record.losses}L
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20 shadow-[0_0_10px_rgba(59,130,246,0.1)] inline-block">P1 聯盟</h4>
              </div>
              <div className="space-y-3">
                {pLeagueTeams.slice(0, 3).map((record, idx) => {
                  const team = teams.find(t => t.id === record.teamId);
                  return (
                    <div key={record.teamId} className="flex items-center justify-between bg-zinc-950/80 p-4 rounded-2xl border border-zinc-800/60 hover:border-zinc-700 hover:bg-zinc-900/80 transition-all group">
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black font-mono shadow-inner",
                          idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]" : 
                          idx === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                          "bg-orange-700/20 text-orange-700 border border-orange-700/30"
                        )}>
                          {idx + 1}
                        </div>
                        <span className="font-black text-zinc-200 group-hover:text-white transition-colors text-lg tracking-tight">{team?.name}</span>
                      </div>
                      <div className="font-mono text-base font-black text-zinc-400 bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800 shadow-inner">
                        {record.wins}W - {record.losses}L
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {selectedGameId && (
        <GameDetailsModal gameId={selectedGameId} onClose={() => setSelectedGameId(null)} />
      )}
    </div>
  );
}
