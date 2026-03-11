import React, { useState, useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { Player, Team, Coach } from '../types';
import { cn } from './Layout';
import { Building2, Users, CloudRain, CheckCircle2, AlertCircle } from 'lucide-react';
import { format, parseISO } from 'date-fns';

export default function Teams() {
  const { teams, players, coaches, movePlayer, moveCoach, autoAdjustRoster } = useGameStore();
  const [selectedTeamId, setSelectedTeamId] = useState<string>(teams[0]?.id);
  const [toast, setToast] = useState<{message: string, type: 'success'|'error'} | null>(null);

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

  const renderPlayerTable = (title: string, playerList: Player[]) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <h3 className="text-lg font-bold text-emerald-400">{title}</h3>
        <span className="text-sm font-mono text-zinc-500">{playerList.length} 人</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-sm uppercase tracking-wider border-b border-zinc-800">
              <th className="p-4 font-medium">姓名</th>
              <th className="p-4 font-medium">年齡</th>
              <th className="p-4 font-medium">守位</th>
              <th className="p-4 font-medium">身分</th>
              <th className="p-4 font-medium text-right">打擊</th>
              <th className="p-4 font-medium text-right">力量</th>
              <th className="p-4 font-medium text-right">速度</th>
              <th className="p-4 font-medium text-right">守備</th>
              <th className="p-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {playerList.map((player) => (
              <tr key={player.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="p-4 font-bold text-zinc-100">{player.name}</td>
                <td className="p-4 text-zinc-400 font-mono">{player.age}</td>
                <td className="p-4">
                  <span className={cn(
                    "px-2 py-1 rounded text-xs font-bold",
                    player.position === 'P' ? "bg-blue-500/20 text-blue-400" :
                    player.position === 'C' ? "bg-red-500/20 text-red-400" :
                    "bg-emerald-500/20 text-emerald-400"
                  )}>
                    {player.position}
                  </span>
                </td>
                <td className="p-4">
                  {player.isForeign ? (
                    <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded text-xs font-bold">洋將</span>
                  ) : (
                    <span className="text-zinc-500 text-xs">本土</span>
                  )}
                </td>
                <td className="p-4 text-right font-mono">{renderStat(getEffectiveStat(player, 'contact'))}</td>
                <td className="p-4 text-right font-mono">{renderStat(getEffectiveStat(player, 'power'))}</td>
                <td className="p-4 text-right font-mono text-zinc-300">{player.stats.speed}</td>
                <td className="p-4 text-right font-mono">{renderStat(getEffectiveStat(player, 'fielding'))}</td>
                <td className="p-4 text-right">
                  {player.status === 'active' && (
                    <button onClick={() => handleMove(player.id, 'reserve')} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/30 transition-colors">降二軍</button>
                  )}
                  {player.status === 'reserve' && (
                    <button onClick={() => handleMove(player.id, 'active')} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold hover:bg-emerald-500/30 transition-colors">升一軍</button>
                  )}
                  {player.lastMovedDate && (
                    <div className="text-[10px] text-zinc-500 mt-1">
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

  const renderCoachTable = (title: string, coachList: Coach[]) => (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden mb-8">
      <div className="p-4 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between">
        <h3 className="text-lg font-bold text-blue-400">{title}</h3>
        <span className="text-sm font-mono text-zinc-500">{coachList.length} 人</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-zinc-900 text-zinc-400 text-sm uppercase tracking-wider border-b border-zinc-800">
              <th className="p-4 font-medium">職位</th>
              <th className="p-4 font-medium">姓名</th>
              <th className="p-4 font-medium text-right">打擊增益</th>
              <th className="p-4 font-medium text-right">力量增益</th>
              <th className="p-4 font-medium text-right">投手增益</th>
              <th className="p-4 font-medium text-right">守備增益</th>
              <th className="p-4 font-medium text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {coachList.map((coach) => (
              <tr key={coach.id} className="hover:bg-zinc-800/50 transition-colors">
                <td className="p-4">
                  <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded text-xs font-bold">
                    {getRoleName(coach.role)}
                  </span>
                </td>
                <td className="p-4 font-bold text-zinc-100">{coach.name}</td>
                <td className="p-4 text-right font-mono text-emerald-400">+{coach.boosts.contact}</td>
                <td className="p-4 text-right font-mono text-emerald-400">+{coach.boosts.power}</td>
                <td className="p-4 text-right font-mono text-emerald-400">+{coach.boosts.pitching}</td>
                <td className="p-4 text-right font-mono text-emerald-400">+{coach.boosts.fielding}</td>
                <td className="p-4 text-right">
                  {coach.status === 'active' && (
                    <button onClick={() => handleCoachMove(coach.id, 'reserve')} className="px-3 py-1 bg-red-500/20 text-red-400 rounded text-xs font-bold hover:bg-red-500/30 transition-colors">降二軍</button>
                  )}
                  {coach.status === 'reserve' && (
                    <button onClick={() => handleCoachMove(coach.id, 'active')} className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-bold hover:bg-emerald-500/30 transition-colors">升一軍</button>
                  )}
                  {coach.lastMovedDate && (
                    <div className="text-[10px] text-zinc-500 mt-1">
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
    <div className="space-y-6 relative">
      {toast && (
        <div className={cn(
          "fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-lg shadow-xl border flex items-center gap-2 animate-in fade-in slide-in-from-top-4",
          toast.type === 'success' ? "bg-emerald-950 border-emerald-800 text-emerald-400" : "bg-red-950 border-red-800 text-red-400"
        )}>
          {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-bold">{toast.message}</span>
        </div>
      )}

      <h2 className="text-2xl font-bold text-zinc-100">球隊 Teams</h2>
      
      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
        {teams.map(team => (
          <button
            key={team.id}
            onClick={() => setSelectedTeamId(team.id)}
            className={cn(
              "flex-shrink-0 px-6 py-4 rounded-xl border transition-all flex flex-col items-center gap-2",
              selectedTeamId === team.id 
                ? "bg-zinc-800 border-zinc-600 shadow-lg" 
                : "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50 text-zinc-400"
            )}
          >
            <div className="w-8 h-8 rounded-full" style={{ backgroundColor: team.logoColor }}></div>
            <div className="text-center">
              <div className={cn("font-bold", selectedTeamId === team.id ? "text-zinc-100" : "")}>{team.name}</div>
              <div className="text-xs opacity-60">{team.league}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedTeam && (
        <div className="mt-8">
          <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="flex items-end gap-4">
              <div className="w-16 h-16 rounded-2xl" style={{ backgroundColor: selectedTeam.logoColor }}></div>
              <div>
                <h2 className="text-3xl font-black text-zinc-100">{selectedTeam.name}</h2>
                <p className="text-zinc-400">{selectedTeam.state} {selectedTeam.city} | {selectedTeam.league} 聯盟</p>
              </div>
            </div>
            <button 
              onClick={() => {
                const result = autoAdjustRoster(selectedTeam.id);
                setToast({ message: result.message || '', type: result.success ? 'success' : 'error' });
                setTimeout(() => setToast(null), 3000);
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold flex items-center gap-2 transition-colors shadow-lg"
            >
              <Users className="w-4 h-4" />
              交由教練團自動調整一二軍
            </button>
          </div>

          {/* Stadium Info */}
          <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-zinc-500 text-sm mb-1 flex items-center gap-2"><Building2 className="w-4 h-4"/> 主場</div>
              <div className="font-bold text-zinc-200">{selectedTeam.stadium.name}</div>
              <div className="text-xs text-zinc-400 mt-1">{getStadiumTypeName(selectedTeam.stadium.type)}</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-zinc-500 text-sm mb-1 flex items-center gap-2"><Users className="w-4 h-4"/> 滿場人數</div>
              <div className="font-bold text-zinc-200">{selectedTeam.stadium.capacity.toLocaleString()} 人</div>
            </div>
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="text-zinc-500 text-sm mb-1 flex items-center gap-2"><CloudRain className="w-4 h-4"/> 天氣影響程度</div>
              <div className="font-bold text-zinc-200">
                {selectedTeam.stadium.weatherImpact === 0 ? '無影響 (室內)' : 
                 selectedTeam.stadium.weatherImpact < 0.5 ? '低' : 
                 selectedTeam.stadium.weatherImpact < 0.8 ? '中' : '高'}
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-1.5 mt-2">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: `${selectedTeam.stadium.weatherImpact * 100}%` }}></div>
              </div>
            </div>
          </div>

          {renderCoachTable('一軍教練團 (Active Coaches)', activeCoaches)}
          {renderCoachTable('二軍教練團 (Reserve Coaches)', reserveCoaches)}

          {renderPlayerTable('一軍名單 (Active)', activePlayers)}
          {renderPlayerTable('預備名單 (Reserve)', reservePlayers)}
          {injuredPlayers.length > 0 && renderPlayerTable('傷兵名單 (Injured)', injuredPlayers)}
        </div>
      )}
    </div>
  );
}
