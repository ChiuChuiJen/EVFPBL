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

  const inningsCount = Math.max(9, game.boxScore?.home.length || 9);
  const innings = Array.from({ length: inningsCount }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-950">
          <div>
            <h3 className="text-lg font-bold text-zinc-100">比賽詳情</h3>
            <p className="text-sm text-zinc-500">{format(parseISO(game.date), 'yyyy-MM-dd HH:mm')} | {game.league}</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-8">
          {/* Scoreboard */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: awayTeam?.logoColor }}>
                {awayTeam?.name.charAt(0)}
              </div>
              <div className="text-xl font-bold text-zinc-100">{awayTeam?.name}</div>
              <div className="text-sm text-zinc-500">客隊</div>
            </div>

            <div className="flex flex-col items-center gap-2 px-8">
              <div className="text-5xl font-black text-zinc-100 tracking-tighter">
                {game.status === 'finished' ? game.awayScore : '-'}
                <span className="text-zinc-600 mx-4">:</span>
                {game.status === 'finished' ? game.homeScore : '-'}
              </div>
              <div className={cn(
                "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                game.status === 'finished' ? "bg-zinc-800 text-zinc-400" : "bg-emerald-500/20 text-emerald-400"
              )}>
                {game.status === 'finished' ? '比賽結束' : '尚未開始'}
              </div>
            </div>

            <div className="flex flex-col items-center gap-2 flex-1">
              <div className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg" style={{ backgroundColor: homeTeam?.logoColor }}>
                {homeTeam?.name.charAt(0)}
              </div>
              <div className="text-xl font-bold text-zinc-100">{homeTeam?.name}</div>
              <div className="text-sm text-zinc-500">主隊</div>
            </div>
          </div>

          {/* Box Score */}
          {game.status === 'finished' && game.boxScore && (
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-center text-sm">
                  <thead>
                    <tr className="bg-zinc-900 text-zinc-400 border-b border-zinc-800">
                      <th className="p-3 text-left font-medium w-32">球隊</th>
                      {innings.map(i => (
                        <th key={i} className="p-3 font-medium w-8">{i}</th>
                      ))}
                      <th className="p-3 font-bold text-zinc-200">R</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800">
                    <tr className="hover:bg-zinc-800/30">
                      <td className="p-3 text-left font-bold text-zinc-300">{awayTeam?.name}</td>
                      {innings.map((_, i) => (
                        <td key={i} className="p-3 text-zinc-400">{game.boxScore?.away[i] ?? '-'}</td>
                      ))}
                      <td className="p-3 font-bold text-zinc-100">{game.awayScore}</td>
                    </tr>
                    <tr className="hover:bg-zinc-800/30">
                      <td className="p-3 text-left font-bold text-zinc-300">{homeTeam?.name}</td>
                      {innings.map((_, i) => (
                        <td key={i} className="p-3 text-zinc-400">{game.boxScore?.home[i] ?? '-'}</td>
                      ))}
                      <td className="p-3 font-bold text-zinc-100">{game.homeScore}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Game Info & Stats */}
          {game.status === 'finished' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                  <Trophy className="w-4 h-4" /> 賽事焦點
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500">勝投 (W)</span>
                    <span className="font-bold text-zinc-200">{wp?.name || '無'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500">敗投 (L)</span>
                    <span className="font-bold text-zinc-200">{lp?.name || '無'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500">單場 MVP</span>
                    <span className="font-bold text-amber-400">{mvp?.name || '無'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 space-y-4">
                <h4 className="font-bold text-emerald-400 flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> 比賽資訊
                </h4>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 flex items-center gap-2"><MapPin className="w-4 h-4"/> 比賽地點</span>
                    <span className="font-medium text-zinc-200">{game.location || '未知'}</span>
                  </div>
                  <div className="flex justify-between items-center pb-2 border-b border-zinc-800/50">
                    <span className="text-zinc-500 flex items-center gap-2"><Users className="w-4 h-4"/> 進場人數</span>
                    <span className="font-medium text-zinc-200">{game.attendance?.toLocaleString() || 0} 人</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-zinc-500 flex items-center gap-2"><CloudRain className="w-4 h-4"/> 天氣狀況</span>
                    <span className="font-medium text-zinc-200">
                      {game.weather === 'sunny' ? '晴天' : 
                       game.weather === 'cloudy' ? '多雲' : 
                       game.weather === 'rainy' ? '雨天' : 
                       game.weather === 'windy' ? '強風' : '未知'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
