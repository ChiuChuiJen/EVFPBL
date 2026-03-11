import React from 'react';
import { useGameStore } from '../store/gameStore';

export default function Standings() {
  const { teams, standings } = useGameStore();

  const rLeagueTeams = teams.filter(t => t.league === 'R+').map(t => standings[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);
  const pLeagueTeams = teams.filter(t => t.league === 'P1').map(t => standings[t.id]).filter(Boolean).sort((a, b) => b.winPercentage - a.winPercentage);

  const renderTable = (leagueTeams: typeof rLeagueTeams, title: string) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950">
        <h3 className="text-lg font-bold text-emerald-400">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-sm uppercase tracking-wider border-b border-zinc-800">
              <th className="p-4 font-medium">排名</th>
              <th className="p-4 font-medium">球隊</th>
              <th className="p-4 font-medium text-right">勝</th>
              <th className="p-4 font-medium text-right">敗</th>
              <th className="p-4 font-medium text-right">和</th>
              <th className="p-4 font-medium text-right">勝率</th>
              <th className="p-4 font-medium text-right">勝差</th>
              <th className="p-4 font-medium text-right">得分</th>
              <th className="p-4 font-medium text-right">失分</th>
              <th className="p-4 font-medium text-right">得失分差</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {leagueTeams.map((record, index) => {
              const team = teams.find(t => t.id === record.teamId);
              const topTeam = leagueTeams[0];
              const gamesBehind = index === 0 ? '-' : ((topTeam.wins - record.wins) + (record.losses - topTeam.losses)) / 2;
              
              return (
                <tr key={record.teamId} className="hover:bg-zinc-800/50 transition-colors">
                  <td className="p-4 text-zinc-500 font-mono">{index + 1}</td>
                  <td className="p-4 font-bold text-zinc-100 flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: team?.logoColor }}></div>
                    {team?.name}
                    <span className="text-xs font-normal text-zinc-500 ml-2">{team?.city}</span>
                  </td>
                  <td className="p-4 text-right font-mono">{record.wins}</td>
                  <td className="p-4 text-right font-mono">{record.losses}</td>
                  <td className="p-4 text-right font-mono">{record.ties}</td>
                  <td className="p-4 text-right font-mono font-medium text-emerald-400">
                    {record.gamesPlayed > 0 ? record.winPercentage.toFixed(3).replace(/^0+/, '') : '.000'}
                  </td>
                  <td className="p-4 text-right font-mono text-zinc-400">{gamesBehind}</td>
                  <td className="p-4 text-right font-mono text-zinc-400">{record.runsScored}</td>
                  <td className="p-4 text-right font-mono text-zinc-400">{record.runsAllowed}</td>
                  <td className="p-4 text-right font-mono text-zinc-400">
                    {record.runsScored > record.runsAllowed ? '+' : ''}{record.runsScored - record.runsAllowed}
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
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-zinc-100">戰績 Standings</h2>
      {renderTable(rLeagueTeams, 'R+ 聯盟 (DH制)')}
      {renderTable(pLeagueTeams, 'P1 聯盟 (非DH制)')}
    </div>
  );
}
