import React from 'react';
import { X } from 'lucide-react';
import { Player } from '../types';
import { useGameStore } from '../store/gameStore';
import { cn } from './Layout';
import TeamLogo from './TeamLogo';

interface PlayerModalProps {
  player: Player | null;
  onClose: () => void;
}

function StatBox({ label, value }: { label: string, value: number }) {
  const getColor = (v: number) => {
    if (v >= 90) return 'text-purple-400';
    if (v >= 80) return 'text-emerald-400';
    if (v >= 70) return 'text-blue-400';
    if (v >= 60) return 'text-yellow-400';
    return 'text-zinc-400';
  };
  
  return (
    <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl p-4 flex flex-col items-center justify-center">
      <div className="text-xs text-zinc-500 font-bold mb-1">{label}</div>
      <div className={cn("text-2xl font-black font-mono", getColor(value))}>{value}</div>
    </div>
  );
}

export default function PlayerModal({ player, onClose }: PlayerModalProps) {
  const { teams, historicalStats, currentDate } = useGameStore();

  if (!player) return null;

  const team = teams.find(t => t.id === player.teamId);
  const currentYear = currentDate.getFullYear();

  const yearlyStats = historicalStats
    .map(hs => ({ year: hs.year, stats: hs.playerStats[player.id] }))
    .filter(ys => ys.stats && ys.stats.gamesPlayed > 0);

  if (player.seasonStats && player.seasonStats.gamesPlayed > 0) {
    yearlyStats.push({ year: currentYear, stats: player.seasonStats });
  }

  const isPitcher = player.position === 'P';

  const totals = yearlyStats.reduce((acc, curr) => {
    const s = curr.stats!;
    return {
      gamesPlayed: acc.gamesPlayed + s.gamesPlayed,
      atBats: acc.atBats + (s.atBats || 0),
      hits: acc.hits + (s.hits || 0),
      homeRuns: acc.homeRuns + (s.homeRuns || 0),
      rbi: acc.rbi + (s.rbi || 0),
      stolenBases: acc.stolenBases + (s.stolenBases || 0),
      inningsPitched: acc.inningsPitched + (s.inningsPitched || 0),
      earnedRuns: acc.earnedRuns + (s.earnedRuns || 0),
      strikeouts: acc.strikeouts + (s.strikeouts || 0),
      wins: acc.wins + (s.wins || 0),
      losses: acc.losses + (s.losses || 0),
      saves: acc.saves + (s.saves || 0),
    };
  }, {
    gamesPlayed: 0, atBats: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0,
    inningsPitched: 0, earnedRuns: 0, strikeouts: 0, wins: 0, losses: 0, saves: 0
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-6 border-b border-zinc-800 flex items-start justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-zinc-800/40 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none"></div>
          <div className="flex items-center gap-6 relative z-10">
            <div className="w-20 h-20 rounded-2xl border-2 border-zinc-700 shadow-inner flex items-center justify-center bg-zinc-900">
              <TeamLogo teamId={player.teamId} className="w-12 h-12" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-3xl font-black text-zinc-100">{player.name}</h2>
                <span className={cn(
                  "px-3 py-1 rounded-lg text-sm font-bold uppercase tracking-wider border",
                  isPitcher ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  player.position === 'C' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {player.position}
                </span>
                {player.isForeign && (
                  <span className="px-2 py-1 rounded-lg text-xs font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">洋將</span>
                )}
              </div>
              <div className="text-zinc-400 font-medium flex items-center gap-4">
                <span>{team?.name}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span>{player.age} 歲</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span className={cn(
                  "font-bold",
                  player.status === 'active' ? "text-emerald-400" :
                  player.status === 'injured' ? "text-red-400" : "text-zinc-500"
                )}>
                  {player.status === 'active' ? '一軍' : player.status === 'injured' ? '傷兵' : '二軍'}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 rounded-full transition-colors relative z-10">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Attributes */}
          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-yellow-500 rounded-full"></span>
              球員能力值
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatBox label="打擊 (CON)" value={player.stats.contact} />
              <StatBox label="力量 (PWR)" value={player.stats.power} />
              <StatBox label="速度 (SPD)" value={player.stats.speed} />
              <StatBox label="守備 (FLD)" value={player.stats.fielding} />
              {isPitcher && player.stats.pitching && (
                <>
                  <StatBox label="球速 (VEL)" value={player.stats.pitching.velocity} />
                  <StatBox label="控球 (CTRL)" value={player.stats.pitching.control} />
                  <StatBox label="體力 (STA)" value={player.stats.pitching.stamina} />
                  <StatBox label="變化球 (BRK)" value={player.stats.pitching.breaking} />
                </>
              )}
            </div>
          </div>

          {/* Career Stats */}
          <div>
            <h3 className="text-lg font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-500 rounded-full"></span>
              生涯戰績 (一軍)
            </h3>
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap">
                  <thead className="bg-zinc-900 text-zinc-400 font-medium border-b border-zinc-800">
                    <tr>
                      <th className="p-3 pl-4">年度</th>
                      <th className="p-3 text-right">出賽</th>
                      {isPitcher ? (
                        <>
                          <th className="p-3 text-right">勝</th>
                          <th className="p-3 text-right">敗</th>
                          <th className="p-3 text-right">救援</th>
                          <th className="p-3 text-right">局數</th>
                          <th className="p-3 text-right">三振</th>
                          <th className="p-3 text-right pr-4">防禦率</th>
                        </>
                      ) : (
                        <>
                          <th className="p-3 text-right">打數</th>
                          <th className="p-3 text-right">安打</th>
                          <th className="p-3 text-right">全壘打</th>
                          <th className="p-3 text-right">打點</th>
                          <th className="p-3 text-right">盜壘</th>
                          <th className="p-3 text-right pr-4">打擊率</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {yearlyStats.length === 0 ? (
                      <tr>
                        <td colSpan={isPitcher ? 8 : 8} className="p-8 text-center text-zinc-500">尚無一軍出賽紀錄</td>
                      </tr>
                    ) : (
                      yearlyStats.map((ys, i) => (
                        <tr key={i} className="hover:bg-zinc-800/30">
                          <td className="p-3 pl-4 font-mono text-zinc-300">{ys.year}</td>
                          <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.gamesPlayed}</td>
                          {isPitcher ? (
                            <>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.wins}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.losses}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.saves}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.inningsPitched}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.strikeouts}</td>
                              <td className="p-3 text-right font-mono text-zinc-300 font-bold pr-4">
                                {ys.stats!.inningsPitched > 0 ? ((ys.stats!.earnedRuns * 9) / ys.stats!.inningsPitched).toFixed(2) : '-'}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.atBats}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.hits}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.homeRuns}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.rbi}</td>
                              <td className="p-3 text-right font-mono text-zinc-400">{ys.stats!.stolenBases}</td>
                              <td className="p-3 text-right font-mono text-zinc-300 font-bold pr-4">
                                {ys.stats!.atBats > 0 ? (ys.stats!.hits / ys.stats!.atBats).toFixed(3).replace(/^0+/, '') : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                    {/* Totals Row */}
                    {yearlyStats.length > 0 && (
                      <tr className="bg-zinc-900/80 font-bold border-t-2 border-zinc-700">
                        <td className="p-3 pl-4 text-zinc-100">生涯總計</td>
                        <td className="p-3 text-right font-mono text-zinc-100">{totals.gamesPlayed}</td>
                        {isPitcher ? (
                          <>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.wins}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.losses}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.saves}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.inningsPitched}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.strikeouts}</td>
                            <td className="p-3 text-right font-mono text-emerald-400 pr-4">
                              {totals.inningsPitched > 0 ? ((totals.earnedRuns * 9) / totals.inningsPitched).toFixed(2) : '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.atBats}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.hits}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.homeRuns}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.rbi}</td>
                            <td className="p-3 text-right font-mono text-zinc-100">{totals.stolenBases}</td>
                            <td className="p-3 text-right font-mono text-emerald-400 pr-4">
                              {totals.atBats > 0 ? (totals.hits / totals.atBats).toFixed(3).replace(/^0+/, '') : '-'}
                            </td>
                          </>
                        )}
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
