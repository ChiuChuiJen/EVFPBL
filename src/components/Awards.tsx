import React from 'react';
import { useGameStore } from '../store/gameStore';
import { Player } from '../types';
import { cn } from './Layout';

export default function Awards() {
  const { players, teams } = useGameStore();

  const getTeamName = (teamId: string) => teams.find(t => t.id === teamId)?.name || teamId;
  const getTeamLogoColor = (teamId: string) => teams.find(t => t.id === teamId)?.logoColor || '#3f3f46';

  // Batters
  const batters = players.filter(p => p.position !== 'P' && p.seasonStats && p.seasonStats.atBats > 0);
  const avgLeaders = [...batters].filter(p => p.seasonStats!.atBats >= 30).sort((a, b) => (b.seasonStats!.hits / b.seasonStats!.atBats) - (a.seasonStats!.hits / a.seasonStats!.atBats)).slice(0, 5);
  const hrLeaders = [...batters].sort((a, b) => b.seasonStats!.homeRuns - a.seasonStats!.homeRuns).slice(0, 5);
  const rbiLeaders = [...batters].sort((a, b) => b.seasonStats!.rbi - a.seasonStats!.rbi).slice(0, 5);
  const sbLeaders = [...batters].sort((a, b) => b.seasonStats!.stolenBases - a.seasonStats!.stolenBases).slice(0, 5);

  // Pitchers
  const pitchers = players.filter(p => p.position === 'P' && p.seasonStats && p.seasonStats.inningsPitched > 0);
  const winLeaders = [...pitchers].sort((a, b) => b.seasonStats!.wins - a.seasonStats!.wins).slice(0, 5);
  const soLeaders = [...pitchers].sort((a, b) => b.seasonStats!.strikeouts - a.seasonStats!.strikeouts).slice(0, 5);
  const eraLeaders = [...pitchers].filter(p => p.seasonStats!.inningsPitched >= 10).sort((a, b) => {
    const eraA = (a.seasonStats!.earnedRuns * 9) / a.seasonStats!.inningsPitched;
    const eraB = (b.seasonStats!.earnedRuns * 9) / b.seasonStats!.inningsPitched;
    return eraA - eraB;
  }).slice(0, 5);

  const injuredPlayers = players.filter(p => p.status === 'injured');

  const renderLeaderboard = (title: string, playersList: Player[], getValue: (p: Player) => string | number, colorClass: string) => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm flex flex-col h-full">
      <div className="p-4 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center justify-between">
        <h3 className={cn("font-bold tracking-wide", colorClass)}>{title}</h3>
      </div>
      <div className="p-3 flex-1">
        {playersList.length === 0 ? (
          <div className="text-zinc-500 text-sm text-center py-8 border-2 border-dashed border-zinc-800/50 rounded-xl bg-zinc-900/20 h-full flex items-center justify-center">尚無數據</div>
        ) : (
          <div className="space-y-2">
            {playersList.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-3 bg-zinc-950/50 hover:bg-zinc-800/50 rounded-xl border border-zinc-800/30 transition-all group">
                <div className="flex items-center gap-4">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold font-mono",
                    idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                    idx === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                    idx === 2 ? "bg-orange-700/20 text-orange-700 border border-orange-700/30" : "text-zinc-600"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-zinc-700/50 shadow-inner flex items-center justify-center bg-zinc-900 overflow-hidden">
                      <div className="w-full h-full" style={{ backgroundColor: getTeamLogoColor(p.teamId) }}></div>
                    </div>
                    <div>
                      <div className="font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">{p.name}</div>
                      <div className="text-[10px] uppercase tracking-wider text-zinc-500 font-medium">{getTeamName(p.teamId)}</div>
                    </div>
                  </div>
                </div>
                <div className={cn("font-mono font-black text-lg", colorClass)}>
                  {getValue(p)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div>
        <div className="mb-8">
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">個人獎項 Awards</h2>
          <p className="text-zinc-500 mt-1">檢視聯盟各項數據領先者</p>
        </div>
        
        <div className="space-y-10">
          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-8 bg-blue-500 rounded-full"></span>
              <h3 className="text-xl font-bold text-zinc-100">打擊排行榜</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
              {renderLeaderboard('打擊率 (AVG)', avgLeaders, p => (p.seasonStats!.hits / p.seasonStats!.atBats).toFixed(3), 'text-blue-400')}
              {renderLeaderboard('全壘打 (HR)', hrLeaders, p => p.seasonStats!.homeRuns, 'text-blue-400')}
              {renderLeaderboard('打點 (RBI)', rbiLeaders, p => p.seasonStats!.rbi, 'text-blue-400')}
              {renderLeaderboard('盜壘 (SB)', sbLeaders, p => p.seasonStats!.stolenBases, 'text-blue-400')}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-6">
              <span className="w-2 h-8 bg-red-500 rounded-full"></span>
              <h3 className="text-xl font-bold text-zinc-100">投手排行榜</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {renderLeaderboard('勝投 (W)', winLeaders, p => p.seasonStats!.wins, 'text-red-400')}
              {renderLeaderboard('防禦率 (ERA)', eraLeaders, p => ((p.seasonStats!.earnedRuns * 9) / p.seasonStats!.inningsPitched).toFixed(2), 'text-red-400')}
              {renderLeaderboard('三振 (SO)', soLeaders, p => p.seasonStats!.strikeouts, 'text-red-400')}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-6 border-t border-zinc-800/50">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center text-red-500 font-bold">✚</div>
          <h2 className="text-2xl font-black text-zinc-100 tracking-tight">聯盟傷兵名單</h2>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
          {injuredPlayers.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center mb-4">
                <span className="text-2xl">🏥</span>
              </div>
              <div className="text-zinc-300 font-bold text-lg mb-1">目前聯盟無傷兵</div>
              <div className="text-zinc-500 text-sm">所有球員皆健康出賽</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/60 text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800/60">
                    <th className="p-4 pl-6 font-medium">球隊</th>
                    <th className="p-4 font-medium">球員</th>
                    <th className="p-4 font-medium">守位</th>
                    <th className="p-4 pr-6 font-medium">受傷日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {injuredPlayers.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full border border-zinc-700/50 shadow-inner flex items-center justify-center bg-zinc-900 overflow-hidden">
                            <div className="w-full h-full" style={{ backgroundColor: getTeamLogoColor(p.teamId) }}></div>
                          </div>
                          <span className="text-zinc-300 font-medium">{getTeamName(p.teamId)}</span>
                        </div>
                      </td>
                      <td className="p-4 font-bold text-zinc-100 group-hover:text-red-400 transition-colors">{p.name}</td>
                      <td className="p-4">
                        <span className={cn(
                          "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                          p.position === 'P' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          p.position === 'C' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                          {p.position}
                        </span>
                      </td>
                      <td className="p-4 pr-6 text-zinc-400 font-mono text-sm">{p.lastMovedDate ? new Date(p.lastMovedDate).toLocaleDateString() : '未知'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
