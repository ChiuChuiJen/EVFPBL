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
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden mb-8 backdrop-blur-sm shadow-sm">
      <div className="p-5 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("w-2 h-6 rounded-full", colorClass)}></span>
          <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
        </div>
        <span className="text-sm font-mono font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800/60">{playerList.length} 人</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800/60">
              <th className="p-4 pl-6 font-medium">姓名</th>
              <th className="p-4 font-medium">年齡</th>
              <th className="p-4 font-medium">守位</th>
              <th className="p-4 font-medium">身分</th>
              <th className="p-4 font-medium text-right">打擊</th>
              <th className="p-4 font-medium text-right">力量</th>
              <th className="p-4 font-medium text-right">速度</th>
              <th className="p-4 font-medium text-right">守備</th>
              <th className="p-4 pr-6 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {playerList.map((player) => (
              <tr key={player.id} onClick={() => setSelectedPlayer(player)} className="hover:bg-zinc-800/30 transition-colors group cursor-pointer">
                <td className="p-4 pl-6 font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">{player.name}</td>
                <td className="p-4 text-zinc-400 font-mono text-sm">{player.age}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2.5 py-1 rounded-md text-xs font-bold uppercase tracking-wider border",
                    player.position === 'P' ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                    player.position === 'C' ? "bg-red-500/10 text-red-400 border-red-500/20" :
                    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                  )}>
                    {player.position}
                  </span>
                </td>
                <td className="p-4">
                  {player.isForeign ? (
                    <span className="px-2.5 py-1 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-md text-xs font-bold uppercase tracking-wider">洋將</span>
                  ) : (
                    <span className="text-zinc-500 text-xs font-medium uppercase tracking-wider">本土</span>
                  )}
                </td>
                <td className="p-4 text-right font-mono text-sm">{renderStat(getEffectiveStat(player, 'contact'))}</td>
                <td className="p-4 text-right font-mono text-sm">{renderStat(getEffectiveStat(player, 'power'))}</td>
                <td className="p-4 text-right font-mono text-sm text-zinc-400">{player.stats.speed}</td>
                <td className="p-4 text-right font-mono text-sm">{renderStat(getEffectiveStat(player, 'fielding'))}</td>
                <td className="p-4 pr-6 text-right" onClick={(e) => e.stopPropagation()}>
                  {player.status === 'active' && (
                    <button onClick={() => handleMove(player.id, 'reserve')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-bold hover:bg-red-500/20 transition-all active:scale-95">降二軍</button>
                  )}
                  {player.status === 'reserve' && (
                    <button onClick={() => handleMove(player.id, 'active')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-bold hover:bg-emerald-500/20 transition-all active:scale-95">升一軍</button>
                  )}
                  {player.lastMovedDate && (
                    <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">
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
    <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl overflow-hidden mb-8 backdrop-blur-sm shadow-sm">
      <div className="p-5 border-b border-zinc-800/60 bg-zinc-950/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={cn("w-2 h-6 rounded-full", colorClass)}></span>
          <h3 className="text-lg font-bold text-zinc-100">{title}</h3>
        </div>
        <span className="text-sm font-mono font-bold text-zinc-400 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800/60">{coachList.length} 人</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900/60 text-zinc-500 text-xs font-bold uppercase tracking-widest border-b border-zinc-800/60">
              <th className="p-4 pl-6 font-medium">職位</th>
              <th className="p-4 font-medium">姓名</th>
              <th className="p-4 font-medium text-right">打擊增益</th>
              <th className="p-4 font-medium text-right">力量增益</th>
              <th className="p-4 font-medium text-right">投手增益</th>
              <th className="p-4 font-medium text-right">守備增益</th>
              <th className="p-4 pr-6 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/40">
            {coachList.map((coach) => (
              <tr key={coach.id} className="hover:bg-zinc-800/30 transition-colors group">
                <td className="p-4 pl-6">
                  <span className="px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md text-xs font-bold tracking-wider">
                    {getRoleName(coach.role)}
                  </span>
                </td>
                <td className="p-4 font-bold text-zinc-200 group-hover:text-zinc-100 transition-colors">{coach.name}</td>
                <td className="p-4 text-right font-mono text-sm font-medium text-emerald-400">+{coach.boosts.contact}</td>
                <td className="p-4 text-right font-mono text-sm font-medium text-emerald-400">+{coach.boosts.power}</td>
                <td className="p-4 text-right font-mono text-sm font-medium text-emerald-400">+{coach.boosts.pitching}</td>
                <td className="p-4 text-right font-mono text-sm font-medium text-emerald-400">+{coach.boosts.fielding}</td>
                <td className="p-4 pr-6 text-right">
                  {coach.status === 'active' && (
                    <button onClick={() => handleCoachMove(coach.id, 'reserve')} className="px-3 py-1.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-xs font-bold hover:bg-red-500/20 transition-all active:scale-95">降二軍</button>
                  )}
                  {coach.status === 'reserve' && (
                    <button onClick={() => handleCoachMove(coach.id, 'active')} className="px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-xs font-bold hover:bg-emerald-500/20 transition-all active:scale-95">升一軍</button>
                  )}
                  {coach.lastMovedDate && (
                    <div className="text-[10px] text-zinc-500 mt-1.5 font-mono">
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
        <h2 className="text-3xl font-black text-zinc-100 tracking-tight">球隊 Teams</h2>
        <p className="text-zinc-500 mt-1">管理球隊陣容與教練團</p>
      </div>
      
      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={cn(
              "flex-shrink-0 px-6 py-4 rounded-2xl border transition-all flex flex-col items-center gap-3 min-w-[140px] group",
              selectedTeamId === team.id 
                ? "bg-zinc-900 border-zinc-700 shadow-lg scale-105" 
                : "bg-zinc-900/40 border-zinc-800/50 hover:bg-zinc-900/80 hover:border-zinc-700/50 text-zinc-400"
            )}
          >
            <div className="w-10 h-10 rounded-full shadow-inner border border-zinc-800/50 flex items-center justify-center bg-zinc-900/80">
              <TeamLogo teamId={team.id} className="w-6 h-6" />
            </div>
            <div className="text-center">
              <div className={cn("font-bold text-sm tracking-wide transition-colors", selectedTeamId === team.id ? "text-zinc-100" : "group-hover:text-zinc-200")}>{team.name}</div>
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 mt-0.5">{team.league}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div className="flex items-end gap-5">
              <div className="w-20 h-20 rounded-3xl shadow-xl border border-zinc-800/50 flex-shrink-0 flex items-center justify-center bg-zinc-900/80">
                <TeamLogo teamId={selectedTeam.id} className="w-14 h-14" />
              </div>
              <div>
                <h2 className="text-4xl font-black text-zinc-100 tracking-tight">{selectedTeam.name}</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-zinc-400 font-medium">{selectedTeam.state} {selectedTeam.city}</span>
                  <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                  <span className="text-zinc-400 font-medium uppercase tracking-wider">{selectedTeam.league} 聯盟</span>
                </div>
              </div>
            </div>
            <button 
              onClick={() => {
                const result = autoAdjustRoster(selectedTeam.id);
                setToast({ message: result.message || '', type: result.success ? 'success' : 'error' });
                setTimeout(() => setToast(null), 3000);
              }}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-900/20 active:scale-95"
            >
              <Users className="w-4 h-4" />
              交由教練團自動調整一二軍
            </button>
          </div>

          {/* Stadium Info */}
          <div className="mb-10 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Building2 className="w-4 h-4 text-zinc-400"/> 主場</div>
              <div className="font-bold text-lg text-zinc-200">{selectedTeam.stadium.name}</div>
              <div className="text-sm font-medium text-zinc-500 mt-1">{getStadiumTypeName(selectedTeam.stadium.type)}</div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><Users className="w-4 h-4 text-zinc-400"/> 滿場人數</div>
              <div className="font-bold text-lg text-zinc-200 font-mono">{selectedTeam.stadium.capacity.toLocaleString()} <span className="text-sm font-sans font-medium text-zinc-500">人</span></div>
            </div>
            <div className="bg-zinc-900/40 border border-zinc-800/50 rounded-2xl p-5 backdrop-blur-sm">
              <div className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-2 flex items-center gap-2"><CloudRain className="w-4 h-4 text-zinc-400"/> 天氣影響程度</div>
              <div className="font-bold text-lg text-zinc-200">
                {selectedTeam.stadium.weatherImpact === 0 ? '無影響 (室內)' : 
                 selectedTeam.stadium.weatherImpact < 0.5 ? '低' : 
                 selectedTeam.stadium.weatherImpact < 0.8 ? '中' : '高'}
              </div>
              <div className="w-full bg-zinc-950 rounded-full h-2 mt-3 border border-zinc-800/50 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-blue-500 h-full rounded-full" style={{ width: `${selectedTeam.stadium.weatherImpact * 100}%` }}></div>
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
