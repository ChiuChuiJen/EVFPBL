import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { format, isSameDay, parseISO, getMonth, getDate } from 'date-fns';
import GameDetailsModal from './GameDetailsModal';

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-zinc-100">總覽 Dashboard</h2>
        <div className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-bold">
          {getSeasonPhase(currentDate)}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Games */}
        <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">今日賽程 ({format(currentDate, 'yyyy-MM-dd')})</h3>
          
          {todaysGames.length === 0 ? (
            <div className="text-zinc-500 py-8 text-center">今日無賽程</div>
          ) : (
            <div className="space-y-3">
              {todaysGames.map(game => {
                const home = teams.find(t => t.id === game.homeTeamId);
                const away = teams.find(t => t.id === game.awayTeamId);
                
                return (
                  <button 
                    key={game.id} 
                    onClick={() => setSelectedGameId(game.id)}
                    className="w-full flex items-center justify-between bg-zinc-950 p-4 rounded-lg border border-zinc-800 hover:bg-zinc-800/50 hover:border-zinc-600 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-right flex-1">
                        <div className="font-bold text-lg text-zinc-100">{away?.name || game.awayTeamId}</div>
                        <div className="text-sm text-zinc-500">{away?.league}</div>
                      </div>
                      <div className="text-2xl font-black w-12 text-center text-zinc-300">
                        {game.status === 'finished' ? game.awayScore : '-'}
                      </div>
                    </div>
                    
                    <div className="px-4 text-sm font-medium text-zinc-600">
                      {game.status === 'finished' ? '結束' : format(parseISO(game.date), 'HH:mm')}
                    </div>
                    
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-2xl font-black w-12 text-center text-zinc-300">
                        {game.status === 'finished' ? game.homeScore : '-'}
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-bold text-lg text-zinc-100">{home?.name || game.homeTeamId}</div>
                        <div className="text-sm text-zinc-500">{home?.league}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* League Leaders */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-zinc-200 mb-4">聯盟領先者</h3>
          
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">R+ 聯盟</h4>
              <div className="space-y-2">
                {rLeagueTeams.slice(0, 3).map((record, idx) => {
                  const team = teams.find(t => t.id === record.teamId);
                  return (
                    <div key={record.teamId} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono">{idx + 1}</span>
                        <span className="font-medium text-zinc-200">{team?.name}</span>
                      </div>
                      <div className="font-mono text-sm text-zinc-400">
                        {record.wins}W - {record.losses}L
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-bold text-emerald-400 mb-2 uppercase tracking-wider">P1 聯盟</h4>
              <div className="space-y-2">
                {pLeagueTeams.slice(0, 3).map((record, idx) => {
                  const team = teams.find(t => t.id === record.teamId);
                  return (
                    <div key={record.teamId} className="flex items-center justify-between bg-zinc-950 p-3 rounded-lg border border-zinc-800">
                      <div className="flex items-center gap-3">
                        <span className="text-zinc-500 font-mono">{idx + 1}</span>
                        <span className="font-medium text-zinc-200">{team?.name}</span>
                      </div>
                      <div className="font-mono text-sm text-zinc-400">
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
