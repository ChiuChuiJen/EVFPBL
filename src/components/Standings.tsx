import React from 'react';
import { useGameStore } from '../store/gameStore';
import { cn } from './Layout';

export default function Standings() {
  const { teams, standings } = useGameStore();

  const rLeagueTeams = teams.filter(t => t.league === 'R+').map(t => standings[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);
  const pLeagueTeams = teams.filter(t => t.league === 'P1').map(t => standings[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);

  const renderTable = (leagueTeams: typeof rLeagueTeams, title: string, colorClass: string) => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm">
      <div className="p-5 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center gap-3">
        <span className={cn("w-2 h-6 rounded-full", colorClass)}></span>
        <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800/60">
              <th className="p-4 pl-6 font-medium w-16">排名</th>
              <th className="p-4 font-medium">球隊</th>
              <th className="p-4 font-medium text-right">勝</th>
              <th className="p-4 font-medium text-right">敗</th>
              <th className="p-4 font-medium text-right">和</th>
              <th className="p-4 font-medium text-right text-emerald-400/80">勝率</th>
              <th className="p-4 font-medium text-right">勝差</th>
              <th className="p-4 font-medium text-right">得分</th>
              <th className="p-4 font-medium text-right">失分</th>
              <th className="p-4 pr-6 font-medium text-right">得失分差</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {leagueTeams.map((record, index) => {
              const team = teams.find(t => t.id === record.teamId);
              const topTeam = leagueTeams[0];
              const gamesBehind = index === 0 ? '-' : ((topTeam.wins - record.wins) + (record.losses - topTeam.losses)) / 2;
              
              return (
                <tr key={record.teamId} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="p-4 pl-6 text-zinc-500 font-mono text-sm">
                    <div className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-yellow-500/20 text-yellow-500 border border-yellow-500/30" : 
                      index === 1 ? "bg-zinc-400/20 text-zinc-400 border border-zinc-400/30" : 
                      index === 2 ? "bg-orange-700/20 text-orange-700 border border-orange-700/30" : ""
                    )}>
                      {index + 1}
                    </div>
                  </td>
                  <td className="p-4 font-bold text-zinc-200 flex items-center gap-4 group-hover:text-zinc-100 transition-colors">
                    <div className="w-8 h-8 rounded-full border border-zinc-700/50 shadow-inner flex items-center justify-center bg-zinc-900">
                      <div className="w-5 h-5 rounded-full" style={{ backgroundColor: team?.logoColor }}></div>
                    </div>
                    <div>
                      <div className="text-base">{team?.name}</div>
                      <div className="text-xs font-normal text-zinc-500 uppercase tracking-wider mt-0.5">{team?.city}</div>
                    </div>
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-300">{record.wins}</td>
                  <td className="p-4 text-right font-mono text-zinc-300">{record.losses}</td>
                  <td className="p-4 text-right font-mono text-zinc-500">{record.ties}</td>
                  <td className="p-4 text-right font-mono font-bold text-emerald-400 bg-emerald-500/5">
                    {record.gamesPlayed > 0 ? record.winPercentage.toFixed(3).replace(/^0+/, '') : '.000'}
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-400">{gamesBehind}</td>
                  <td className="p-4 text-right font-mono text-zinc-400">{record.runsScored}</td>
                  <td className="p-4 text-right font-mono text-zinc-400">{record.runsAllowed}</td>
                  <td className="p-4 pr-6 text-right font-mono font-medium">
                    <span className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      record.runsScored > record.runsAllowed ? "bg-emerald-500/10 text-emerald-400" : 
                      record.runsScored < record.runsAllowed ? "bg-red-500/10 text-red-400" : "text-zinc-500"
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
      <div>
        <h2 className="text-3xl font-black text-zinc-100 tracking-tight">戰績 Standings</h2>
        <p className="text-zinc-500 mt-1">聯盟各隊戰績與排名</p>
      </div>
      {renderTable(rLeagueTeams, 'R+ 聯盟 (DH制)', 'bg-emerald-500')}
      {renderTable(pLeagueTeams, 'P1 聯盟 (非DH制)', 'bg-blue-500')}
    </div>
  );
}
