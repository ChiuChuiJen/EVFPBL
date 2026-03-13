import React from 'react';
import { useGameStore } from '../store/gameStore';
import { X, MapPin, Users, Trophy, CloudRain } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { cn } from './Layout';

interface GameDetailsModalProps {
  gameId: string;
  onClose: () => void;
}

export default function GameDetailsModal({ gameId, onClose }: GameDetailsModalProps) {
  const { schedule, teams, players } = useGameStore();
  const game = schedule.find(g => g.id === gameId);
  
  if (!game) return null;
  
  const homeTeam = teams.find(t => t.id === game.homeTeamId);
  const awayTeam = teams.find(t => t.id === game.awayTeamId);
  
  const wp = players.find(p => p.id === game.winningPitcherId);
  const lp = players.find(p => p.id === game.losingPitcherId);
  const mvp = players.find(p => p.id === game.mvpId);

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

  const inningsCount = Math.max(9, game.boxScore?.home.length || 9);
  const innings = Array.from({ length: inningsCount }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-zinc-900/95 border border-zinc-800/60 rounded-3xl w-full max-w-4xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            <div className="w-2 h-10 bg-blue-500 rounded-full"></div>
            <div>
              <h3 className="text-2xl font-black text-zinc-100 tracking-tight">比賽詳情</h3>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 bg-zinc-800/50 px-2 py-0.5 rounded-md">{game.league}</span>
                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                <span className="text-xs font-mono font-bold text-zinc-400">{format(parseISO(game.date), 'yyyy-MM-dd HH:mm')}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2.5 text-zinc-500 hover:text-zinc-100 hover:bg-zinc-800/80 rounded-xl transition-all active:scale-95"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto p-8 space-y-10 custom-scrollbar">
          {/* Scoreboard */}
          <div className="flex items-center justify-between bg-zinc-950/50 rounded-3xl p-10 border border-zinc-800/40 shadow-inner relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            <div className="flex flex-col items-center gap-5 flex-1 relative z-10">
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-xl border-4 border-zinc-800/50 relative" style={{ backgroundColor: awayTeam?.logoColor || '#52525b' }}>
                {getTeamName(game.awayTeamId, awayTeam).charAt(0)}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-zinc-100 tracking-tight">{getTeamName(game.awayTeamId, awayTeam)}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">客隊 Away</div>
              </div>
            </div>

            <div className="flex flex-col items-center gap-6 px-12 relative z-10">
              <div className="text-8xl font-black text-zinc-100 tracking-tighter font-mono flex items-center gap-8">
                <span className={cn(game.status === 'finished' && game.awayScore > game.homeScore ? "text-zinc-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-500")}>{game.status === 'finished' ? game.awayScore : '-'}</span>
                <span className="text-zinc-800 text-6xl">:</span>
                <span className={cn(game.status === 'finished' && game.homeScore > game.awayScore ? "text-zinc-100 drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]" : "text-zinc-500")}>{game.status === 'finished' ? game.homeScore : '-'}</span>
              </div>
              <div className={cn(
                "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border",
                game.status === 'finished' ? "bg-zinc-800/50 text-zinc-400 border-zinc-700/50" : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
              )}>
                {game.status === 'finished' ? 'FINAL' : 'UPCOMING'}
              </div>
            </div>

            <div className="flex flex-col items-center gap-5 flex-1 relative z-10">
              <div className="w-28 h-28 rounded-full flex items-center justify-center text-5xl font-black text-white shadow-xl border-4 border-zinc-800/50 relative" style={{ backgroundColor: homeTeam?.logoColor || '#52525b' }}>
                {getTeamName(game.homeTeamId, homeTeam).charAt(0)}
                <div className="absolute inset-0 rounded-full shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]"></div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-black text-zinc-100 tracking-tight">{getTeamName(game.homeTeamId, homeTeam)}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">主隊 Home</div>
              </div>
            </div>
          </div>

          {/* Box Score */}
          {game.status === 'finished' && game.boxScore && (
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                Box Score
              </h4>
              <div className="bg-zinc-950/80 border border-zinc-800/60 rounded-3xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-center text-sm">
                    <thead>
                      <tr className="bg-zinc-900/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/60">
                        <th className="p-5 text-left font-medium w-48 pl-8">球隊</th>
                        {innings.map(i => (
                          <th key={i} className="p-5 font-medium w-12">{i}</th>
                        ))}
                        <th className="p-5 font-black text-zinc-300 w-16 bg-zinc-900/40">R</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/40">
                      <tr className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="p-5 text-left font-bold text-zinc-300 pl-8 flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full shadow-inner border border-zinc-700/50" style={{ backgroundColor: awayTeam?.logoColor || '#52525b' }}></div>
                          <span className="group-hover:text-white transition-colors">{getTeamName(game.awayTeamId, awayTeam)}</span>
                        </td>
                        {innings.map((_, i) => (
                          <td key={i} className="p-5 text-zinc-400 font-mono font-medium">{game.boxScore?.away[i] ?? '-'}</td>
                        ))}
                        <td className="p-5 font-black text-zinc-100 font-mono bg-zinc-900/20 text-lg">{game.awayScore}</td>
                      </tr>
                      <tr className="hover:bg-zinc-800/30 transition-colors group">
                        <td className="p-5 text-left font-bold text-zinc-300 pl-8 flex items-center gap-4">
                          <div className="w-4 h-4 rounded-full shadow-inner border border-zinc-700/50" style={{ backgroundColor: homeTeam?.logoColor || '#52525b' }}></div>
                          <span className="group-hover:text-white transition-colors">{getTeamName(game.homeTeamId, homeTeam)}</span>
                        </td>
                        {innings.map((_, i) => (
                          <td key={i} className="p-5 text-zinc-400 font-mono font-medium">{game.boxScore?.home[i] ?? '-'}</td>
                        ))}
                        <td className="p-5 font-black text-zinc-100 font-mono bg-zinc-900/20 text-lg">{game.homeScore}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Game Info & Stats */}
          {game.status === 'finished' && (
            <div>
              <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
                Key Players
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur-sm hover:bg-zinc-900 transition-colors group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 border border-emerald-500/20 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_15px_rgba(16,185,129,0.2)] relative z-10">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 relative z-10">勝投 Win</div>
                  <div className="font-black text-zinc-100 text-xl tracking-tight relative z-10">{wp?.name || '-'}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium relative z-10">{wp ? teams.find(t => t.id === wp.teamId)?.name : ''}</div>
                </div>
                
                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur-sm hover:bg-zinc-900 transition-colors group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-14 h-14 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-4 border border-red-500/20 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] relative z-10">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 relative z-10">敗投 Loss</div>
                  <div className="font-black text-zinc-100 text-xl tracking-tight relative z-10">{lp?.name || '-'}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium relative z-10">{lp ? teams.find(t => t.id === lp.teamId)?.name : ''}</div>
                </div>

                <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-6 flex flex-col items-center text-center backdrop-blur-sm hover:bg-zinc-900 transition-colors group relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center mb-4 border border-yellow-500/20 group-hover:scale-110 transition-transform group-hover:shadow-[0_0_15px_rgba(234,179,8,0.2)] relative z-10">
                    <Trophy className="w-7 h-7" />
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-2 relative z-10">MVP</div>
                  <div className="font-black text-zinc-100 text-xl tracking-tight relative z-10">{mvp?.name || '-'}</div>
                  <div className="text-xs text-zinc-500 mt-1 font-medium relative z-10">{mvp ? teams.find(t => t.id === mvp.teamId)?.name : ''}</div>
                </div>
              </div>
            </div>
          )}

          {/* Game Info */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-4 flex items-center gap-3">
              <span className="w-2 h-2 rounded-full bg-zinc-500"></span>
              Game Info
            </h4>
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-6 grid grid-cols-1 md:grid-cols-3 gap-8 backdrop-blur-sm">
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 border border-zinc-700/50 shadow-inner">
                  <MapPin className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">場地 Venue</div>
                  <div className="font-bold text-zinc-200 text-lg tracking-tight">{game.location || '未知'}</div>
                </div>
              </div>
              
              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 border border-zinc-700/50 shadow-inner">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">觀眾 Attendance</div>
                  <div className="font-bold text-zinc-200 font-mono text-lg">
                    {game.attendance?.toLocaleString() || 0}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-zinc-800/80 flex items-center justify-center text-zinc-400 border border-zinc-700/50 shadow-inner">
                  <CloudRain className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">天氣 Weather</div>
                  <div className="font-bold text-zinc-200 text-lg tracking-tight">
                    {game.weather === 'sunny' ? '晴天' : 
                     game.weather === 'cloudy' ? '多雲' : 
                     game.weather === 'rainy' ? '雨天' : 
                     game.weather === 'windy' ? '強風' : '未知'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
