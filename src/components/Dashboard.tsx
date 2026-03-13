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
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">總覽 Dashboard</h2>
          <p className="text-zinc-500 mt-1">檢視今日賽程與聯盟戰況</p>
        </div>
        <div className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(16,185,129,0.1)] flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          {getSeasonPhase(currentDate)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Games */}
        <div className="lg:col-span-2 bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-zinc-200 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-blue-500 rounded-full"></span>
              今日賽程
            </h3>
            <span className="text-sm font-mono text-zinc-500 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">{format(currentDate, 'yyyy-MM-dd')}</span>
          </div>
          
          {todaysGames.length === 0 ? (
            <div className="text-zinc-500 py-12 text-center border border-dashed border-zinc-800 rounded-xl bg-zinc-900/20">今日無賽程</div>
          ) : (
            <div className="space-y-3">
              {todaysGames.map(game => {
                const home = teams.find(t => t.id === game.homeTeamId);
                const away = teams.find(t => t.id === game.awayTeamId);
                
                return (
                  <button 
                    key={game.id} 
                    onClick={() => setSelectedGameId(game.id)}
                    className="w-full flex items-center justify-between bg-zinc-950/80 p-5 rounded-xl border border-zinc-800/60 hover:bg-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group shadow-sm"
                  >
                    <div className="flex items-center gap-4 flex-1 justify-end">
                      <div className="text-right">
                        <div className="font-bold text-lg text-zinc-200 group-hover:text-zinc-100 transition-colors">{getTeamName(game.awayTeamId, away)}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{away?.league || game.league}</div>
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-inner">
                        <TeamLogo teamId={game.awayTeamId} className="w-8 h-8" />
                      </div>
                      <div className="text-3xl font-black w-12 text-center text-zinc-300 font-mono">
                        {game.status === 'finished' ? game.awayScore : '-'}
                      </div>
                    </div>
                    
                    <div className="px-6 flex flex-col items-center justify-center">
                      <div className="text-xs font-bold text-zinc-600 uppercase tracking-widest mb-1">
                        {game.status === 'finished' ? 'FINAL' : 'VS'}
                      </div>
                      <div className="text-sm font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                        {game.status === 'finished' ? '結束' : format(parseISO(game.date), 'HH:mm')}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 flex-1 justify-start">
                      <div className="text-3xl font-black w-12 text-center text-zinc-300 font-mono">
                        {game.status === 'finished' ? game.homeScore : '-'}
                      </div>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center bg-zinc-900 border border-zinc-800 shadow-inner">
                        <TeamLogo teamId={game.homeTeamId} className="w-8 h-8" />
                      </div>
                      <div className="text-left">
                        <div className="font-bold text-lg text-zinc-200 group-hover:text-zinc-100 transition-colors">{getTeamName(game.homeTeamId, home)}</div>
                        <div className="text-xs text-zinc-500 uppercase tracking-wider mt-0.5">{home?.league || game.league}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* League Leaders */}
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-6 backdrop-blur-sm flex flex-col">
          <h3 className="text-lg font-bold text-zinc-200 mb-6 flex items-center gap-2">
            <span className="w-1.5 h-6 bg-emerald-500 rounded-full"></span>
            聯盟領先者
          </h3>
          
          <div className="space-y-8 flex-1">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-1 rounded inline-block">R+ 聯盟</h4>
              </div>
              <div className="space-y-2">
                {rLeagueTeams.slice(0, 3).map((record, idx) => {
                  const team = teams.find(t => t.id === record.teamId);
                  return (
                    <div key={record.teamId} className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono",
                          idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                          idx === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                          "bg-orange-700/20 text-orange-700 border border-orange-700/30"
                        )}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-zinc-200">{team?.name}</span>
                      </div>
                      <div className="font-mono text-sm font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
                        {record.wins}W - {record.losses}L
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-1 rounded inline-block">P1 聯盟</h4>
              </div>
              <div className="space-y-2">
                {pLeagueTeams.slice(0, 3).map((record, idx) => {
                  const team = teams.find(t => t.id === record.teamId);
                  return (
                    <div key={record.teamId} className="flex items-center justify-between bg-zinc-950/80 p-3 rounded-xl border border-zinc-800/60 hover:border-zinc-700 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono",
                          idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                          idx === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                          "bg-orange-700/20 text-orange-700 border border-orange-700/30"
                        )}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-zinc-200">{team?.name}</span>
                      </div>
                      <div className="font-mono text-sm font-medium text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded">
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
