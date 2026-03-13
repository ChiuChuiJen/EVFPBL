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
    if (v >= 90) return 'text-purple-400 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]';
    if (v >= 80) return 'text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]';
    if (v >= 70) return 'text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]';
    if (v >= 60) return 'text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]';
    return 'text-zinc-400';
  };
  
  return (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden group hover:bg-zinc-900/80 transition-all shadow-lg hover:shadow-xl">
      <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      <div className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mb-3 relative z-10">{label}</div>
      <div className={cn("text-4xl font-black font-mono relative z-10 tracking-tighter", getColor(value))}>{value}</div>
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-md animate-in fade-in duration-200" onClick={onClose}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-8 md:p-10 border-b border-zinc-800/60 flex items-start justify-between relative overflow-hidden bg-zinc-950/80">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-zinc-800/30 to-transparent rounded-full -mr-32 -mt-32 pointer-events-none blur-3xl"></div>
          <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10">
            <div className="w-28 h-28 rounded-[2rem] border border-zinc-700/50 shadow-2xl flex items-center justify-center bg-zinc-900/80 backdrop-blur-sm relative overflow-hidden flex-shrink-0">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none"></div>
              <TeamLogo teamId={player.teamId} className="w-16 h-16 relative z-10" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-4 mb-3">
                <h2 className="text-5xl font-black text-zinc-100 tracking-tight">{player.name}</h2>
                <span className={cn(
                  "px-4 py-1.5 rounded-xl text-sm font-black uppercase tracking-widest border shadow-sm",
                  isPitcher ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                  player.position === 'C' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                  "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                )}>
                  {player.position === 'P' ? (player.pitcherRole || 'P') : player.position}
                </span>
                <span className="px-4 py-1.5 rounded-xl text-sm font-black bg-zinc-900 text-zinc-300 border border-zinc-800/60 shadow-inner">
                  {player.throws || 'R'}投{player.bats || 'R'}打
                </span>
                {player.isForeign && (
                  <span className="px-4 py-1.5 rounded-xl text-xs font-black bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-widest shadow-sm">洋將</span>
                )}
              </div>
              <div className="text-zinc-400 font-medium flex flex-wrap items-center gap-4 text-base">
                <span className="font-black text-zinc-200 tracking-tight">{team?.name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                <span className="font-mono font-bold">{player.age} 歲</span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                <span className={cn(
                  "font-black px-3 py-1 rounded-lg text-sm",
                  player.status === 'active' ? "bg-emerald-500/10 text-emerald-400" :
                  player.status === 'injured' ? "bg-red-500/10 text-red-400" : "bg-zinc-800 text-zinc-400"
                )}>
                  {player.status === 'active' ? '一軍' : player.status === 'injured' ? '傷兵' : '二軍'}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 hidden md:block"></span>
                <div className="flex items-center gap-3 bg-zinc-900/50 px-4 py-2 rounded-xl border border-zinc-800/50 w-full md:w-auto mt-2 md:mt-0">
                  <span className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">體力</span>
                  <div className="w-32 bg-zinc-950 rounded-full h-2.5 overflow-hidden border border-zinc-800/50 shadow-inner">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-500",
                        (player.energy ?? 100) > 70 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                        (player.energy ?? 100) > 30 ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                      )}
                      style={{ width: `${player.energy ?? 100}%` }}
                    ></div>
                  </div>
                  <span className="font-mono text-sm font-black text-zinc-300 w-8">{player.energy ?? 100}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-full transition-all relative z-10 active:scale-95 bg-zinc-900/50 border border-zinc-800/50">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 space-y-12">
          {/* Attributes */}
          <div>
            <h3 className="text-2xl font-black text-zinc-100 mb-6 flex items-center gap-3 tracking-tight">
              <span className="w-2 h-8 bg-yellow-500 rounded-full shadow-[0_0_15px_rgba(234,179,8,0.5)]"></span>
              球員能力值
            </h3>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
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
            <h3 className="text-2xl font-black text-zinc-100 mb-6 flex items-center gap-3 tracking-tight">
              <span className="w-2 h-8 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.5)]"></span>
              生涯戰績 (一軍)
            </h3>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm whitespace-nowrap border-collapse">
                  <thead className="bg-zinc-950/80 text-zinc-500 font-medium border-b border-zinc-800/60 text-[10px] uppercase tracking-widest">
                    <tr>
                      <th className="p-5 pl-8 font-black">年度</th>
                      <th className="p-5 text-right font-black">出賽</th>
                      {isPitcher ? (
                        <>
                          <th className="p-5 text-right font-black">勝</th>
                          <th className="p-5 text-right font-black">敗</th>
                          <th className="p-5 text-right font-black">救援</th>
                          <th className="p-5 text-right font-black">局數</th>
                          <th className="p-5 text-right font-black">三振</th>
                          <th className="p-5 text-right pr-8 font-black">防禦率</th>
                        </>
                      ) : (
                        <>
                          <th className="p-5 text-right font-black">打數</th>
                          <th className="p-5 text-right font-black">安打</th>
                          <th className="p-5 text-right font-black">全壘打</th>
                          <th className="p-5 text-right font-black">打點</th>
                          <th className="p-5 text-right font-black">盜壘</th>
                          <th className="p-5 text-right pr-8 font-black">打擊率</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/40">
                    {yearlyStats.length === 0 ? (
                      <tr>
                        <td colSpan={isPitcher ? 8 : 8} className="p-10 text-center text-zinc-500 font-black tracking-widest text-lg">尚無一軍出賽紀錄</td>
                      </tr>
                    ) : (
                      yearlyStats.map((ys, i) => (
                        <tr key={i} className="hover:bg-zinc-800/50 transition-colors">
                          <td className="p-5 pl-8 font-mono font-black text-zinc-300 text-base">{ys.year}</td>
                          <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.gamesPlayed}</td>
                          {isPitcher ? (
                            <>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.wins}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.losses}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.saves}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.inningsPitched}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.strikeouts}</td>
                              <td className="p-5 text-right font-mono text-emerald-400 font-black pr-8 text-base">
                                {ys.stats!.inningsPitched > 0 ? ((ys.stats!.earnedRuns * 9) / ys.stats!.inningsPitched).toFixed(2) : '-'}
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.atBats}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.hits}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.homeRuns}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.rbi}</td>
                              <td className="p-5 text-right font-mono font-bold text-zinc-400 text-base">{ys.stats!.stolenBases}</td>
                              <td className="p-5 text-right font-mono text-emerald-400 font-black pr-8 text-base">
                                {ys.stats!.atBats > 0 ? (ys.stats!.hits / ys.stats!.atBats).toFixed(3).replace(/^0+/, '') : '-'}
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                    {/* Totals Row */}
                    {yearlyStats.length > 0 && (
                      <tr className="bg-zinc-950/80 font-black border-t-2 border-zinc-700/50">
                        <td className="p-5 pl-8 text-zinc-100 text-base">生涯總計</td>
                        <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.gamesPlayed}</td>
                        {isPitcher ? (
                          <>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.wins}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.losses}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.saves}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.inningsPitched}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.strikeouts}</td>
                            <td className="p-5 text-right font-mono text-emerald-400 pr-8 text-base">
                              {totals.inningsPitched > 0 ? ((totals.earnedRuns * 9) / totals.inningsPitched).toFixed(2) : '-'}
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.atBats}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.hits}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.homeRuns}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.rbi}</td>
                            <td className="p-5 text-right font-mono text-zinc-100 text-base">{totals.stolenBases}</td>
                            <td className="p-5 text-right font-mono text-emerald-400 pr-8 text-base">
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
