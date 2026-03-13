import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Player, Team, Coach } from '../types';
import { cn } from './Layout';
import { Building2, Users, CloudRain, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import PlayerModal from './PlayerModal';
import TeamLogo from './TeamLogo';

export default function Teams() {
  const { teams, players, coaches, movePlayer, moveCoach, autoAdjustRoster } = useGameStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const selectedTeam = teams.find(t => t.id === selectedTeamId);
  const teamPlayers = players.filter(p => p.teamId === selectedTeamId);
  const teamCoaches = coaches.filter(c => c.teamId === selectedTeamId);

  const activePlayers = teamPlayers.filter(p => p.status === 'active');
  const reservePlayers = teamPlayers.filter(p => p.status === 'reserve');
  const injuredPlayers = teamPlayers.filter(p => p.status === 'injured');

  const activeCoaches = teamCoaches.filter(c => c.status === 'active');
  const reserveCoaches = teamCoaches.filter(c => c.status === 'reserve');

  const handleMove = (playerId: string, newStatus: 'active' | 'reserve') => {
    const result = movePlayer(playerId, newStatus);
    setToast({ message: result.message || '異動成功', type: result.success ? 'success' : 'error' });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCoachMove = (coachId: string, newStatus: 'active' | 'reserve') => {
    const result = moveCoach(coachId, newStatus);
    setToast({ message: result.message || '教練異動成功', type: result.success ? 'success' : 'error' });
    setTimeout(() => setToast(null), 3000);
  };

  const getRoleName = (role: string) => {
    switch(role) {
      case 'Manager': return '總教練';
      case 'Pitching': return '投手教練';
      case 'Hitting': return '打擊教練';
      case 'Fielding': return '守備教練';
      default: return role;
    }
  };

  const getEffectiveStat = (player: Player, statName: 'contact' | 'power' | 'speed' | 'fielding' | 'pitching') => {
    const relevantCoaches = teamCoaches.filter(c => c.status === player.status);
    let boost = 0;
    relevantCoaches.forEach(c => {
      if (statName === 'contact') boost += c.boosts.contact;
      else if (statName === 'power') boost += c.boosts.power;
      else if (statName === 'fielding') boost += c.boosts.fielding;
      else if (statName === 'pitching') boost += c.boosts.pitching;
    });

    const base = statName === 'pitching' 
      ? (player.stats.pitching ? Math.round((player.stats.pitching.velocity + player.stats.pitching.control + player.stats.pitching.stamina + player.stats.pitching.breaking) / 4) : 0)
      : (player.stats[statName] || 0);

    return { base, boost, total: base + boost };
  };

  const renderStat = (stat: {base: number, boost: number, total: number}) => {
    if (stat.boost > 0) {
      return (
        <div className="flex items-center justify-end gap-1">
          <span className="text-zinc-300">{stat.total}</span>
          <span className="text-[10px] text-emerald-400 font-bold">(+{stat.boost})</span>
        </div>
      );
    }
    return <span className="text-zinc-300">{stat.base}</span>;
  };

  const getStadiumTypeName = (type: string) => {
    switch (type) {
      case 'dome': return '巨蛋球場';
      case 'outdoor': return '室外球場';
      case 'retractable': return '半封閉球場';
      default: return '未知';
    }
  };

  const renderPlayerTable = (title: string, playerList: Player[], colorClass: string = "bg-emerald-500") => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden mb-10 backdrop-blur-md shadow-xl relative group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
      <div className="p-8 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <span className={cn("w-2 h-10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]", colorClass)}></span>
          <h3 className="text-2xl font-black text-zinc-100 tracking-tight">{title}</h3>
        </div>
        <span className="text-base font-mono font-black text-zinc-400 bg-zinc-900 px-5 py-2 rounded-xl border border-zinc-800/60 shadow-inner">{playerList.length} 人</span>
      </div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/60">
              <th className="p-5 pl-10 font-medium">姓名</th>
              <th className="p-5 font-medium">年齡</th>
              <th className="p-5 font-medium">守位</th>
              <th className="p-5 font-medium">投/打</th>
              <th className="p-5 font-medium">身分</th>
              <th className="p-5 font-medium text-right">體力</th>
              <th className="p-5 font-medium text-right">打擊</th>
              <th className="p-5 font-medium text-right">力量</th>
              <th className="p-5 font-medium text-right">速度</th>
              <th className="p-5 font-medium text-right">守備</th>
              <th className="p-5 pr-10 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {playerList.map((player) => (
              <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="hover:bg-zinc-800/60 transition-colors group/row cursor-pointer">
                <td className="p-5 pl-10 font-black text-lg text-zinc-200 group-hover/row:text-white transition-colors tracking-tight">{player.name}</td>
                <td className="p-5 text-zinc-500 font-mono text-base font-bold">{player.age}</td>
                <td className="p-5">
                  <span className={cn(
                    "px-4 py-1.5 rounded-xl text-xs font-black uppercase tracking-widest border shadow-sm",
                    player.position === 'P' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    player.position === 'C' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {player.position === 'P' ? (player.pitcherRole || 'P') : player.position}
                  </span>
                </td>
                <td className="p-5 text-zinc-400 font-mono text-base font-black">
                  {player.throws || 'R'}/{player.bats || 'R'}
                </td>
                <td className="p-5">
                  {player.isForeign ? (
                    <span className="px-4 py-1.5 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm">洋將</span>
                  ) : (
                    <span className="text-zinc-600 text-[10px] font-black uppercase tracking-widest">本土</span>
                  )}
                </td>
                <td className="p-5 text-right">
                  <div className="flex items-center justify-end gap-4">
                    <div className="w-20 bg-zinc-900 rounded-full h-2.5 overflow-hidden border border-zinc-800/50 shadow-inner">
                      <div 
                        className={cn(
                          "h-full rounded-full transition-all duration-500",
                          (player.energy ?? 100) > 70 ? "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" :
                          (player.energy ?? 100) > 30 ? "bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]" : "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                        )}
                        style={{ width: `${player.energy ?? 100}%` }}
                      ></div>
                    </div>
                    <span className="font-mono text-sm font-black text-zinc-400 w-8">{player.energy ?? 100}</span>
                  </div>
                </td>
                <td className="p-5 text-right font-mono text-base font-black">{renderStat(getEffectiveStat(player, 'contact'))}</td>
                <td className="p-5 text-right font-mono text-base font-black">{renderStat(getEffectiveStat(player, 'power'))}</td>
                <td className="p-5 text-right font-mono text-base font-black text-zinc-500">{player.stats.speed}</td>
                <td className="p-5 text-right font-mono text-base font-black">{renderStat(getEffectiveStat(player, 'fielding'))}</td>
                <td className="p-5 pr-10 text-right" onClick={(e) => e.stopPropagation()}>
                  {player.status === 'active' && (
                    <button onClick={() => handleMove(player.id, 'reserve')} className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-black hover:bg-red-500/20 transition-all active:scale-95 shadow-sm">降二軍</button>
                  )}
                  {player.status === 'reserve' && (
                    <button onClick={() => handleMove(player.id, 'active')} className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm">升一軍</button>
                  )}
                  {player.lastMovedDate && (
                    <div className="text-[10px] text-zinc-600 mt-2 font-mono font-black uppercase tracking-widest">
                      上次異動: {format(parseISO(player.lastMovedDate), 'MM/dd')}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderCoachTable = (title: string, coachList: Coach[], colorClass: string = "bg-blue-500") => (
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl overflow-hidden mb-10 backdrop-blur-md shadow-xl relative group">
      <div className="absolute top-0 right-0 w-96 h-96 bg-zinc-800/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none transition-opacity group-hover:opacity-100 opacity-50"></div>
      <div className="p-8 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-5">
          <span className={cn("w-2 h-10 rounded-full shadow-[0_0_15px_rgba(255,255,255,0.1)]", colorClass)}></span>
          <h3 className="text-2xl font-black text-zinc-100 tracking-tight">{title}</h3>
        </div>
        <span className="text-base font-mono font-black text-zinc-400 bg-zinc-900 px-5 py-2 rounded-xl border border-zinc-800/60 shadow-inner">{coachList.length} 人</span>
      </div>
      <div className="overflow-x-auto relative z-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-950/60 text-zinc-500 text-[10px] font-black uppercase tracking-widest border-b border-zinc-800/60">
              <th className="p-5 pl-10 font-medium">職位</th>
              <th className="p-5 font-medium">姓名</th>
              <th className="p-5 font-medium text-right">打擊增益</th>
              <th className="p-5 font-medium text-right">力量增益</th>
              <th className="p-5 font-medium text-right">投手增益</th>
              <th className="p-5 font-medium text-right">守備增益</th>
              <th className="p-5 pr-10 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {coachList.map((coach) => (
              <tr key={coach.id} className="hover:bg-zinc-800/60 transition-colors group/row">
                <td className="p-5 pl-10">
                  <span className="px-4 py-1.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl text-xs font-black tracking-widest shadow-sm">
                    {getRoleName(coach.role)}
                  </span>
                </td>
                <td className="p-5 font-black text-lg text-zinc-200 group-hover/row:text-white transition-colors tracking-tight">{coach.name}</td>
                <td className="p-5 text-right font-mono text-base font-black text-emerald-400">+{coach.boosts.contact}</td>
                <td className="p-5 text-right font-mono text-base font-black text-emerald-400">+{coach.boosts.power}</td>
                <td className="p-5 text-right font-mono text-base font-black text-emerald-400">+{coach.boosts.pitching}</td>
                <td className="p-5 text-right font-mono text-base font-black text-emerald-400">+{coach.boosts.fielding}</td>
                <td className="p-5 pr-10 text-right">
                  {coach.status === 'active' && (
                    <button onClick={() => handleCoachMove(coach.id, 'reserve')} className="px-5 py-2.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-xs font-black hover:bg-red-500/20 transition-all active:scale-95 shadow-sm">降二軍</button>
                  )}
                  {coach.status === 'reserve' && (
                    <button onClick={() => handleCoachMove(coach.id, 'active')} className="px-5 py-2.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs font-black hover:bg-emerald-500/20 transition-all active:scale-95 shadow-sm">升一軍</button>
                  )}
                  {coach.lastMovedDate && (
                    <div className="text-[10px] text-zinc-600 mt-2 font-mono font-black uppercase tracking-widest">
                      上次異動: {format(parseISO(coach.lastMovedDate), 'MM/dd')}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative">
      {toast && (
        <div className={cn(
          "fixed top-24 left-1/2 -translate-x-1/2 z-50 px-5 py-3.5 rounded-xl shadow-2xl border flex items-center gap-3 animate-in fade-in slide-in-from-top-4 backdrop-blur-md",
          toast.type === 'success' ? "bg-emerald-950/90 border-emerald-800/60 text-emerald-400" : "bg-red-950/90 border-red-800/60 text-red-400"
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      <div>
        <h2 className="text-4xl font-black text-zinc-100 tracking-tight">球隊 Teams</h2>
        <p className="text-zinc-400 mt-2 text-sm font-medium">管理球隊陣容與教練團</p>
      </div>
      
      <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar snap-x px-2">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={cn(
              "flex-shrink-0 px-10 py-8 rounded-3xl border transition-all duration-300 flex flex-col items-center gap-5 min-w-[200px] group snap-start relative overflow-hidden",
              selectedTeamId === team.id 
                ? "bg-zinc-900 border-zinc-700 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.8)] scale-105 z-10 ring-1 ring-white/10" 
                : "bg-zinc-900/30 border-zinc-800/40 hover:bg-zinc-900/60 hover:border-zinc-700/50 text-zinc-400 hover:shadow-xl"
            )}
          >
            {selectedTeamId === team.id && (
              <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
            )}
            <div className={cn(
              "w-24 h-24 rounded-[2rem] shadow-inner border flex items-center justify-center transition-all duration-300",
              selectedTeamId === team.id ? "bg-zinc-800 border-zinc-600 shadow-[0_0_30px_rgba(0,0,0,0.6)]" : "bg-zinc-900/80 border-zinc-800/50 group-hover:bg-zinc-800/80 group-hover:border-zinc-700/50"
            )}>
              <TeamLogo teamId={team.id} className={cn("transition-transform duration-300", selectedTeamId === team.id ? "w-16 h-16 scale-110" : "w-14 h-14 group-hover:scale-105")} />
            </div>
            <div className="text-center relative z-10">
              <div className={cn("font-black text-2xl tracking-tight transition-colors duration-300", selectedTeamId === team.id ? "text-zinc-100" : "group-hover:text-zinc-200")}>{team.name}</div>
              <div className={cn("text-xs font-black uppercase tracking-widest mt-2 transition-opacity duration-300", selectedTeamId === team.id ? "opacity-80 text-zinc-300" : "opacity-50 group-hover:opacity-70")}>{team.league}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="mt-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div className="flex items-end gap-6">
              <div className="w-24 h-24 rounded-3xl shadow-xl border border-zinc-800/50 flex-shrink-0 flex items-center justify-center bg-zinc-900/80">
                <TeamLogo teamId={selectedTeam.id} className="w-16 h-16" />
              </div>
              <div>
                <h2 className="text-5xl font-black text-zinc-100 tracking-tight">{selectedTeam.name}</h2>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-zinc-400 font-bold text-lg">{selectedTeam.state} {selectedTeam.city}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700"></span>
                  <span className="text-zinc-400 font-black uppercase tracking-wider text-lg">{selectedTeam.league} 聯盟</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                const result = autoAdjustRoster(selectedTeam.id);
                setToast({ message: result.message || '', type: result.success ? 'success' : 'error' });
                setTimeout(() => setToast(null), 3000);
              }}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black flex items-center gap-3 transition-all shadow-lg shadow-blue-900/20 active:scale-95 text-sm"
            >
              <Users className="w-5 h-5" />
              交由教練團自動調整一二軍
            </button>
          </div>

          {/* Stadium Info */}
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm shadow-xl hover:bg-zinc-900/60 transition-all duration-300 group hover:-translate-y-1">
              <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors"/> 主場</div>
              <div className="font-black text-3xl text-zinc-200 tracking-tight group-hover:text-white transition-colors">{selectedTeam.stadium.name}</div>
              <div className="text-lg font-bold text-zinc-500 mt-2">{getStadiumTypeName(selectedTeam.stadium.type)}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm shadow-xl hover:bg-zinc-900/60 transition-all duration-300 group hover:-translate-y-1">
              <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors"/> 滿場人數</div>
              <div className="font-black text-4xl text-zinc-200 font-mono tracking-tighter group-hover:text-white transition-colors">{selectedTeam.stadium.capacity.toLocaleString()} <span className="text-base font-sans font-bold text-zinc-500 tracking-normal">人</span></div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-sm shadow-xl hover:bg-zinc-900/60 transition-all duration-300 group hover:-translate-y-1">
              <div className="text-zinc-500 text-xs font-black uppercase tracking-widest mb-4 flex items-center gap-2"><CloudRain className="w-4 h-4 text-zinc-400 group-hover:text-zinc-300 transition-colors"/> 天氣影響程度</div>
              <div className="font-black text-3xl text-zinc-200 group-hover:text-white transition-colors">
                {selectedTeam.stadium.weatherImpact === 0 ? '無影響 (室內)' : 
                 selectedTeam.stadium.weatherImpact < 0.5 ? '低' : 
                 selectedTeam.stadium.weatherImpact < 0.8 ? '中' : '高'}
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-3 mt-5 border border-zinc-800/50 overflow-hidden shadow-inner relative">
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-blue-500/20"></div>
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] relative z-10 transition-all duration-1000 ease-out" style={{ width: `${selectedTeam.stadium.weatherImpact * 100}%` }}></div>
              </div>
            </div>
          </div>

          {renderCoachTable('一軍教練團 (Active Coaches)', activeCoaches, 'bg-blue-500')}
          {renderCoachTable('二軍教練團 (Reserve Coaches)', reserveCoaches, 'bg-zinc-500')}

          {renderPlayerTable('一軍名單 (Active)', activePlayers, 'bg-emerald-500')}
          {renderPlayerTable('預備名單 (Reserve)', reservePlayers, 'bg-zinc-500')}
          {injuredPlayers.length > 0 && renderPlayerTable('傷兵名單 (Injured)', injuredPlayers, 'bg-red-500')}
        </div>
      )}

      {selectedPlayer && (
        <PlayerModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
}
