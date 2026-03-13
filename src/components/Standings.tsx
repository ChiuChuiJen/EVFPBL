import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { cn } from './Layout';
import TeamLogo from './TeamLogo';

export default function Standings() {
  const { teams, standings, minorStandings, springStandings, winterStandings, historicalStats, currentDate } = useGameStore();
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState<'regular' | 'minor' | 'spring' | 'winter'>('regular');

  const isCurrentYear = selectedYear === currentDate.getFullYear();
  const historicalData = historicalStats.find(h => h.year === selectedYear);
  
  const displayStandings = isCurrentYear ? standings : (historicalData?.standings || {});
  const displayMinorStandings = isCurrentYear ? minorStandings : (historicalData?.minorStandings || {});
  const displaySpringStandings = isCurrentYear ? springStandings : (historicalData?.springStandings || {});
  const displayWinterStandings = isCurrentYear ? winterStandings : (historicalData?.winterStandings || {});

  const getSortedTeams = (standingsObj: Record<string, any>, filterFn?: (t: any) => boolean) => {
    let filteredTeams = teams;
    if (filterFn) {
      filteredTeams = teams.filter(filterFn);
    }
    return filteredTeams.map(t => standingsObj[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);
  };

  const rLeagueTeams = getSortedTeams(displayStandings, t => t.league === 'R+');
  const pLeagueTeams = getSortedTeams(displayStandings, t => t.league === 'P1');
  const minorTeams = getSortedTeams(displayMinorStandings);
  const springTeams = getSortedTeams(displaySpringStandings);
  
  // Winter League teams are not in the main teams list, they are WB_TEAM1 to WB_TEAM6
  const winterTeams = Object.values(displayWinterStandings)
    .filter((t: any) => t.teamId.startsWith('WB_TEAM'))
    .sort((a: any, b: any) => b.winPercentage - a.winPercentage);

  const availableYears = [currentDate.getFullYear(), ...historicalStats.map(h => h.year)].sort((a, b) => b - a);

  const renderTable = (leagueTeams: typeof rLeagueTeams, title: string, colorClass: string) => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden mb-8 backdrop-blur-md shadow-xl relative">
      <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-800/20 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
      <div className="p-6 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center gap-4 relative z-10">
        <span className={cn("w-2 h-8 rounded-full shadow-[0_0_10px_rgba(255,255,255,0.1)]", colorClass)}></span>
        <h3 className="text-xl font-bold text-zinc-100 tracking-tight">{title}</h3>
      </div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/60">
              <th className="p-4 pl-8 font-medium w-16">排名</th>
              <th className="p-4 font-medium">球隊</th>
              <th className="p-4 font-medium text-right">勝</th>
              <th className="p-4 font-medium text-right">敗</th>
              <th className="p-4 font-medium text-right">和</th>
              <th className="p-4 font-medium text-right text-emerald-400/80">勝率</th>
              <th className="p-4 font-medium text-right">勝差</th>
              <th className="p-4 font-medium text-right">得分</th>
              <th className="p-4 font-medium text-right">失分</th>
              <th className="p-4 pr-8 font-medium text-right">得失分差</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {leagueTeams.map((record, index) => {
              let teamName = record.teamId;
              let teamCity = '';
              let logoColor = '#52525b'; // default zinc-500
              
              if (record.teamId.startsWith('WB_TEAM')) {
                const wbNames: Record<string, string> = {
                  'WB_TEAM1': '香蕉一隊', 'WB_TEAM2': '香蕉二隊', 'WB_TEAM3': '香蕉三隊',
                  'WB_TEAM4': '香蕉四隊', 'WB_TEAM5': '香蕉五隊', 'WB_TEAM6': '香蕉六隊'
                };
                teamName = wbNames[record.teamId] || record.teamId;
                teamCity = '冬季聯盟';
                logoColor = '#eab308'; // yellow-500
              } else {
                const team = teams.find(t => t.id === record.teamId);
                if (team) {
                  teamName = team.name;
                  teamCity = team.city;
                  logoColor = team.logoColor;
                }
              }

              const topTeam = leagueTeams[0];
              const gamesBehind = index === 0 ? '-' : ((topTeam.wins - record.wins) + (record.losses - topTeam.losses)) / 2;
              
              return (
                <tr key={record.teamId} className="hover:bg-zinc-800/50 transition-colors group">
                  <td className="p-4 pl-8 text-zinc-500 font-mono text-sm">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm",
                      index === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]" : 
                      index === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                      index === 2 ? "bg-orange-700/20 text-orange-700 border border-orange-700/30" : ""
                    )}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-zinc-200 flex items-center gap-4 group-hover:text-white transition-colors">
                    <div className="w-10 h-10 rounded-2xl border border-zinc-700/50 shadow-inner flex items-center justify-center bg-zinc-900">
                      <TeamLogo teamId={record.teamId} className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="text-base tracking-tight">{teamName}</div>
                      <div className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mt-0.5">{teamCity}</div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-300 font-medium">{record.wins}</td>
                  <td className="p-4 text-right font-mono text-zinc-300 font-medium">{record.losses}</td>
                  <td className="p-4 text-right font-mono text-zinc-500 font-medium">{record.ties}</td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-400 bg-emerald-500/5 shadow-inner">
                    {record.gamesPlayed > 0 ? record.winPercentage.toFixed(3).replace(/^0+/, '') : '.000'}
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-400 font-medium">{gamesBehind}</td>
                  <td className="p-4 text-right font-mono text-zinc-400 font-medium">{record.runsScored}</td>
                  <td className="p-4 text-right font-mono text-zinc-400 font-medium">{record.runsAllowed}</td>
                  <td className="p-4 pr-8 text-right font-mono font-bold">
                    <span className={cn(
                      "px-3 py-1 rounded-lg text-xs shadow-sm",
                      record.runsScored > record.runsAllowed ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : 
                      record.runsScored < record.runsAllowed ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    )}>
                      {record.runsScored > record.runsAllowed ? '+' : ''}{record.runsScored - record.runsAllowed}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black text-zinc-100 tracking-tight">戰績 Standings</h2>
          <p className="text-zinc-400 mt-2 text-sm font-medium">聯盟各隊戰績與排名</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-1 shadow-inner backdrop-blur-sm">
            <button
              onClick={() => setActiveTab('regular')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'regular' ? "bg-zinc-800 text-zinc-100 shadow-md" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              一軍
            </button>
            <button
              onClick={() => setActiveTab('minor')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'minor' ? "bg-zinc-800 text-zinc-100 shadow-md" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              二軍
            </button>
            <button
              onClick={() => setActiveTab('spring')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'spring' ? "bg-zinc-800 text-zinc-100 shadow-md" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              春訓
            </button>
            <button
              onClick={() => setActiveTab('winter')}
              className={cn(
                "px-5 py-2.5 rounded-xl text-sm font-bold transition-all",
                activeTab === 'winter' ? "bg-zinc-800 text-zinc-100 shadow-md" : "text-zinc-500 hover:text-zinc-300"
              )}
            >
              冬季聯盟
            </button>
          </div>

          {availableYears.length > 1 && (
            <div className="flex items-center gap-3 bg-zinc-900/80 border border-zinc-800/50 rounded-2xl p-2 shadow-inner backdrop-blur-sm">
              <span className="text-xs font-black text-zinc-500 uppercase tracking-widest pl-3">賽季 Season</span>
              <select 
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="bg-zinc-950 border border-zinc-700/50 text-zinc-200 text-sm rounded-xl focus:ring-emerald-500 focus:border-emerald-500 block p-2.5 font-mono font-bold shadow-sm"
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year} 年</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'regular' && (
        <>
          {renderTable(rLeagueTeams, 'R+ 聯盟 (DH制)', 'bg-emerald-500')}
          {renderTable(pLeagueTeams, 'P1 聯盟 (非DH制)', 'bg-blue-500')}
        </>
      )}
      {activeTab === 'minor' && renderTable(minorTeams, '二軍例行賽', 'bg-purple-500')}
      {activeTab === 'spring' && renderTable(springTeams, '春訓熱身賽', 'bg-pink-500')}
      {activeTab === 'winter' && renderTable(winterTeams, '冬季香蕉聯盟', 'bg-yellow-500')}
    </div>
  );
}
