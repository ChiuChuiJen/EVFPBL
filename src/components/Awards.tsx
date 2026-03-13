import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { Player } from '../types';
import { cn } from './Layout';

export default function Awards() {
  const { players, teams, historicalStats, currentDate } = useGameStore();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState<'regular' | 'minor' | 'spring' | 'winter'>('regular');

  const isCurrentYear = selectedYear === currentDate.getFullYear();
  const historicalData = historicalStats.find(h => h.year === selectedYear);

  const getTeamName = (teamId: string) => {
    if (teamId.startsWith('WB_TEAM')) {
      const wbNames: Record<string, string> = {
        'WB_TEAM1': '香蕉一隊', 'WB_TEAM2': '香蕉二隊', 'WB_TEAM3': '香蕉三隊',
        'WB_TEAM4': '香蕉四隊', 'WB_TEAM5': '香蕉五隊', 'WB_TEAM6': '香蕉六隊'
      };
      return wbNames[teamId] || teamId;
    }
    return teams.find(t => t.id === teamId)?.name || teamId;
  };

  const getTeamLogoColor = (teamId: string) => {
    if (teamId.startsWith('WB_TEAM')) return '#eab308';
    return teams.find(t => t.id === teamId)?.logoColor || '#3f3f46';
  };

  const getPlayerStats = (p: Player) => {
    if (isCurrentYear) {
      if (activeTab === 'minor') return p.minorStats;
      if (activeTab === 'spring') return p.springStats;
      if (activeTab === 'winter') return p.winterStats;
      return p.seasonStats;
    } else {
      if (activeTab === 'minor') return historicalData?.minorPlayerStats?.[p.id];
      if (activeTab === 'spring') return historicalData?.springPlayerStats?.[p.id];
      if (activeTab === 'winter') return historicalData?.winterPlayerStats?.[p.id];
      return historicalData?.playerStats?.[p.id];
    }
  };

  // Batters
  const batters = players.filter(p => p.position !== 'P' && getPlayerStats(p) && getPlayerStats(p)!.atBats > 0);
  const avgLeaders = [...batters].filter(p => getPlayerStats(p)!.atBats >= 30).sort((a, b) => (getPlayerStats(b)!.hits / getPlayerStats(b)!.atBats) - (getPlayerStats(a)!.hits / getPlayerStats(a)!.atBats)).slice(0, 5);
  const hrLeaders = [...batters].sort((a, b) => getPlayerStats(b)!.homeRuns - getPlayerStats(a)!.homeRuns).slice(0, 5);
  const rbiLeaders = [...batters].sort((a, b) => getPlayerStats(b)!.rbi - getPlayerStats(a)!.rbi).slice(0, 5);
  const sbLeaders = [...batters].sort((a, b) => getPlayerStats(b)!.stolenBases - getPlayerStats(a)!.stolenBases).slice(0, 5);

  // Pitchers
  const pitchers = players.filter(p => p.position === 'P' && getPlayerStats(p) && getPlayerStats(p)!.inningsPitched > 0);
  const winLeaders = [...pitchers].sort((a, b) => getPlayerStats(b)!.wins - getPlayerStats(a)!.wins).slice(0, 5);
  const soLeaders = [...pitchers].sort((a, b) => getPlayerStats(b)!.strikeouts - getPlayerStats(a)!.strikeouts).slice(0, 5);
  const eraLeaders = [...pitchers].filter(p => getPlayerStats(p)!.inningsPitched >= 10).sort((a, b) => {
    const eraA = (getPlayerStats(a)!.earnedRuns * 9) / getPlayerStats(a)!.inningsPitched;
    const eraB = (getPlayerStats(b)!.earnedRuns * 9) / getPlayerStats(b)!.inningsPitched;
    return eraA - eraB;
  }).slice(0, 5);

  const injuredPlayers = players.filter(p => p.status === 'injured');

  const availableYears = [currentDate.getFullYear(), ...historicalStats.map(h => h.year)].sort((a, b) => b - a);

  const renderLeaderboard = (title: string, playersList: Player[], getValue: (p: Player) => string | number, colorClass: string) => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden backdrop-blur-md shadow-sm flex flex-col h-full relative group">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
      <div className="p-5 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center justify-between relative z-10">
        <h3 className={cn("font-black tracking-tight text-lg", colorClass)}>{title}</h3>
      </div>
      <div className="p-4 flex-1 relative z-10">
        {playersList.length === 0 ? (
          <div className="text-zinc-600 text-[10px] font-black uppercase tracking-widest text-center py-10 border-2 border-dashed border-zinc-800/50 rounded-2xl bg-zinc-900/20 h-full flex items-center justify-center">尚無數據</div>
        ) : (
          <div className="space-y-3">
            {playersList.map((p, idx) => (
              <div key={p.id} className="flex items-center justify-between p-4 bg-zinc-950/80 hover:bg-zinc-900/80 rounded-2xl border border-zinc-800/40 transition-all group/item shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center text-sm font-black font-mono shadow-inner",
                    idx === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]" : 
                    idx === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                    idx === 2 ? "bg-orange-700/20 text-orange-700 border border-orange-700/30" : "text-zinc-600 bg-zinc-900 border border-zinc-800"
                  )}>
                    {idx + 1}
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full border-2 border-zinc-800/80 shadow-inner flex items-center justify-center bg-zinc-900 overflow-hidden flex-shrink-0">
                      <div className="w-full h-full" style={{ backgroundColor: getTeamLogoColor(p.teamId) }}></div>
                    </div>
                    <div>
                      <div className="font-black text-zinc-200 group-hover/item:text-white transition-colors text-base tracking-tight">{p.name}</div>
                      <div className="text-[10px] uppercase tracking-widest text-zinc-500 font-black mt-0.5">{getTeamName(p.teamId)}</div>
                    </div>
                  </div>
                </div>
                <div className={cn("font-mono font-black text-2xl relative z-10", colorClass)}>
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
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black text-zinc-100 tracking-tight">個人獎項 Awards</h2>
            <p className="text-zinc-400 mt-2 text-sm font-medium">檢視聯盟各項數據領先者</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
            <div className="flex bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-1.5 shadow-inner backdrop-blur-sm">
              <button
                onClick={() => setActiveTab('regular')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'regular' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                一軍
              </button>
              <button
                onClick={() => setActiveTab('minor')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'minor' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                二軍
              </button>
              <button
                onClick={() => setActiveTab('spring')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'spring' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                春訓
              </button>
              <button
                onClick={() => setActiveTab('winter')}
                className={cn(
                  "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                  activeTab === 'winter' ? "bg-zinc-800 text-zinc-100 shadow-sm" : "text-zinc-500 hover:text-zinc-300"
                )}
              >
                冬季聯盟
              </button>
            </div>

            {availableYears.length > 1 && (
              <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-2 shadow-inner backdrop-blur-sm">
                <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest pl-3">賽季 Season</span>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-zinc-950 border border-zinc-700/50 text-zinc-200 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2 font-mono font-bold outline-none"
                >
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year} 年</option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-12">
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-2 h-10 bg-blue-500 rounded-full"></span>
              <h3 className="text-2xl font-black text-zinc-100 tracking-tight">打擊排行榜</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderLeaderboard('打擊率 (AVG)', avgLeaders, p => (getPlayerStats(p)!.hits / getPlayerStats(p)!.atBats).toFixed(3).replace(/^0+/, ''), 'text-blue-400')}
              {renderLeaderboard('全壘打 (HR)', hrLeaders, p => getPlayerStats(p)!.homeRuns, 'text-blue-400')}
              {renderLeaderboard('打點 (RBI)', rbiLeaders, p => getPlayerStats(p)!.rbi, 'text-blue-400')}
              {renderLeaderboard('盜壘 (SB)', sbLeaders, p => getPlayerStats(p)!.stolenBases, 'text-blue-400')}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="w-2 h-10 bg-red-500 rounded-full"></span>
              <h3 className="text-2xl font-black text-zinc-100 tracking-tight">投手排行榜</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {renderLeaderboard('勝投 (W)', winLeaders, p => getPlayerStats(p)!.wins, 'text-red-400')}
              {renderLeaderboard('防禦率 (ERA)', eraLeaders, p => ((getPlayerStats(p)!.earnedRuns * 9) / getPlayerStats(p)!.inningsPitched).toFixed(2), 'text-red-400')}
              {renderLeaderboard('三振 (SO)', soLeaders, p => getPlayerStats(p)!.strikeouts, 'text-red-400')}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-8 border-t border-zinc-800/50">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 font-black shadow-[0_0_15px_rgba(239,68,68,0.1)]">✚</div>
          <h2 className="text-3xl font-black text-zinc-100 tracking-tight">聯盟傷兵名單</h2>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden backdrop-blur-md shadow-sm">
          {injuredPlayers.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(16,185,129,0.1)] border border-emerald-500/20">
                <span className="text-3xl">🏥</span>
              </div>
              <div className="text-zinc-200 font-black text-2xl mb-2 tracking-tight">目前聯盟無傷兵</div>
              <div className="text-zinc-500 text-sm font-medium">所有球員皆健康出賽</div>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-900/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/60">
                    <th className="p-5 pl-8 font-medium">球隊</th>
                    <th className="p-5 font-medium">球員</th>
                    <th className="p-5 font-medium">守位</th>
                    <th className="p-5 pr-8 font-medium">受傷日期</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/40">
                  {injuredPlayers.map(p => (
                    <tr key={p.id} className="hover:bg-zinc-800/30 transition-colors group">
                      <td className="p-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-8 h-8 rounded-full border-2 border-zinc-700/50 shadow-inner flex items-center justify-center bg-zinc-900 overflow-hidden">
                            <div className="w-full h-full" style={{ backgroundColor: getTeamLogoColor(p.teamId) }}></div>
                          </div>
                          <span className="text-zinc-300 font-bold tracking-tight">{getTeamName(p.teamId)}</span>
                        </div>
                      </td>
                      <td className="p-5 font-black text-zinc-100 group-hover:text-red-400 transition-colors text-lg">{p.name}</td>
                      <td className="p-5">
                        <span className={cn(
                          "px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border",
                          p.position === 'P' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                          p.position === 'C' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                          "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        )}>
                          {p.position}
                        </span>
                      </td>
                      <td className="p-5 pr-8 text-zinc-400 font-mono text-sm font-medium">{p.lastMovedDate ? new Date(p.lastMovedDate).toLocaleDateString() : '未知'}</td>
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
