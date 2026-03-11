import { create } from 'zustand';
import { addMinutes, addDays, isAfter, isSameDay, parseISO, format } from 'date-fns';
import { Game, Player, Team, StandingsRecord, League, NewsItem, WeatherCondition, Coach } from '../types';
import { TEAMS, generatePlayers, generateSchedule, generateCoaches } from '../utils/generators';

interface GameState {
  currentDate: Date;
  timeMultiplier: number;
  isPlaying: boolean;
  teams: Team[];
  players: Player[];
  coaches: Coach[];
  schedule: Game[];
  standings: Record<string, StandingsRecord>;
  news: NewsItem[];
  
  // Actions
  advanceTime: (minutes: number) => void;
  advanceToNextDay: () => void;
  togglePlay: () => void;
  setMultiplier: (mult: number) => void;
  simulateGame: (gameId: string) => void;
  movePlayer: (playerId: string, newStatus: 'active' | 'reserve') => { success: boolean; message?: string };
  moveCoach: (coachId: string, newStatus: 'active' | 'reserve') => { success: boolean; message?: string };
  autoAdjustRoster: (teamId: string) => { success: boolean; message?: string };
  initialize: () => void;
}

function getAutoAdjustedPlayers(teamId: string, players: Player[], currentDate: Date): { newPlayers: Player[], promotedPlayers: Player[], demotedPlayers: Player[] } {
  const teamPlayers = players.filter(p => p.teamId === teamId && p.status !== 'injured');
  
  const getOverall = (p: Player) => p.position === 'P' 
    ? (p.stats.pitching?.velocity || 0) + (p.stats.pitching?.control || 0) + (p.stats.pitching?.stamina || 0) + (p.stats.pitching?.breaking || 0)
    : p.stats.contact + p.stats.power + p.stats.speed + p.stats.fielding;

  const playersByPos: Record<string, Player[]> = {
    'P': [], 'C': [], '1B': [], '2B': [], '3B': [], 'SS': [], 'LF': [], 'CF': [], 'RF': []
  };

  teamPlayers.forEach(p => {
    if (playersByPos[p.position]) {
      playersByPos[p.position].push(p);
    }
  });

  Object.keys(playersByPos).forEach(pos => {
    playersByPos[pos].sort((a, b) => getOverall(b) - getOverall(a));
  });

  const idealQuotas: Record<string, number> = {
    'P': 12, 'C': 2, '1B': 2, '2B': 2, '3B': 2, 'SS': 2, 'LF': 2, 'CF': 2, 'RF': 2
  };

  const newActiveIds = new Set<string>();
  const fallbackPlayers: Player[] = [];

  Object.keys(idealQuotas).forEach(pos => {
    const quota = idealQuotas[pos];
    const posPlayers = playersByPos[pos];
    for (let i = 0; i < posPlayers.length; i++) {
      if (i < quota) {
        newActiveIds.add(posPlayers[i].id);
      } else {
        fallbackPlayers.push(posPlayers[i]);
      }
    }
  });

  fallbackPlayers.sort((a, b) => getOverall(b) - getOverall(a));
  let fallbackIndex = 0;
  while (newActiveIds.size < 28 && fallbackIndex < fallbackPlayers.length) {
    newActiveIds.add(fallbackPlayers[fallbackIndex].id);
    fallbackIndex++;
  }

  const promotedPlayers: Player[] = [];
  const demotedPlayers: Player[] = [];

  const newPlayers = players.map(p => {
    if (p.teamId !== teamId || p.status === 'injured') return p;
    
    let isOnCooldown = false;
    if (p.lastMovedDate) {
      const daysSinceMove = (currentDate.getTime() - parseISO(p.lastMovedDate).getTime()) / (1000 * 3600 * 24);
      if (daysSinceMove < 5) isOnCooldown = true;
    }

    const shouldBeActive = newActiveIds.has(p.id);
    const currentlyActive = p.status === 'active';

    if (shouldBeActive && !currentlyActive && !isOnCooldown) {
      const updated = { ...p, status: 'active' as const, lastMovedDate: currentDate.toISOString() };
      promotedPlayers.push(updated);
      return updated;
    } else if (!shouldBeActive && currentlyActive && !isOnCooldown) {
      const updated = { ...p, status: 'reserve' as const, lastMovedDate: currentDate.toISOString() };
      demotedPlayers.push(updated);
      return updated;
    }
    
    return p;
  });

  return { newPlayers, promotedPlayers, demotedPlayers };
}

export const useGameStore = create<GameState>((set, get) => ({
  currentDate: new Date('2026-02-25T08:00:00Z'),
  timeMultiplier: 1,
  isPlaying: false,
  teams: TEAMS,
  players: [],
  coaches: [],
  schedule: [],
  standings: {},
  news: [],

  initialize: () => {
    const players = generatePlayers();
    const coaches = generateCoaches();
    const schedule = generateSchedule();
    
    // Initialize standings
    const standings: Record<string, StandingsRecord> = {};
    TEAMS.forEach(team => {
      standings[team.id] = {
        teamId: team.id,
        wins: 0,
        losses: 0,
        ties: 0,
        gamesPlayed: 0,
        winPercentage: 0,
        runsScored: 0,
        runsAllowed: 0
      };
    });

    const news: NewsItem[] = [{
      id: 'N1',
      date: new Date('2026-02-25T08:00:00Z').toISOString(),
      title: 'EVFPBL 2026 春訓即將展開！',
      content: '各隊已陸續展開春訓，為即將到來的新賽季進行最後調整與熱身。',
      type: 'league'
    }];

    set({ players, coaches, schedule, standings, news });
  },

  advanceTime: (minutes: number) => {
    set((state) => {
      const newDate = addMinutes(state.currentDate, minutes);
      
      let newPlayers = [...state.players];
      const isNewDay = newDate.getDate() !== state.currentDate.getDate();
      const isMonday = newDate.getDay() === 1;

      // Check for games to simulate
      const gamesToSimulate = state.schedule.filter(g => 
        g.status === 'scheduled' && 
        isAfter(newDate, parseISO(g.date))
      );

      let newSchedule = [...state.schedule];
      let newStandings = { ...state.standings };
      let newNews = [...state.news];

      // Check if we need to resolve Postseason teams
      const isEnteringOctober = newDate.getMonth() === 9 && state.currentDate.getMonth() === 8;
      if (isEnteringOctober) {
        const rTeams = Object.values(newStandings).filter(s => state.teams.find(t => t.id === s.teamId)?.league === 'R+').sort((a, b) => b.winPercentage - a.winPercentage);
        const pTeams = Object.values(newStandings).filter(s => state.teams.find(t => t.id === s.teamId)?.league === 'P1').sort((a, b) => b.winPercentage - a.winPercentage);

        if (rTeams.length > 0 && pTeams.length > 0) {
          const rChamp = rTeams[0].teamId;
          const pChamp = pTeams[0].teamId;

          newSchedule = newSchedule.map(g => {
            if (g.homeTeamId === 'R_CHAMP') return { ...g, homeTeamId: rChamp };
            if (g.awayTeamId === 'R_CHAMP') return { ...g, awayTeamId: rChamp };
            if (g.homeTeamId === 'P_CHAMP') return { ...g, homeTeamId: pChamp };
            if (g.awayTeamId === 'P_CHAMP') return { ...g, awayTeamId: pChamp };
            return g;
          });

          newNews.unshift({
            id: `N_postseason_start`,
            date: newDate.toISOString(),
            title: `台灣大賽對戰組合出爐！`,
            content: `由 R+ 聯盟冠軍 ${state.teams.find(t=>t.id===rChamp)?.name} 對決 P1 聯盟冠軍 ${state.teams.find(t=>t.id===pChamp)?.name}！`,
            type: 'league'
          });
        }
      }

      gamesToSimulate.forEach(game => {
        // 模擬比賽前，由教練團自動調整雙方一二軍陣容
        const homeAdjust = getAutoAdjustedPlayers(game.homeTeamId, newPlayers, newDate);
        newPlayers = homeAdjust.newPlayers;
        if (homeAdjust.promotedPlayers.length > 0 || homeAdjust.demotedPlayers.length > 0) {
          const team = state.teams.find(t => t.id === game.homeTeamId);
          newNews.unshift({
            id: `N_roster_${game.id}_home`,
            date: newDate.toISOString(),
            title: `${team?.name} 人員異動`,
            content: `升上一軍: ${homeAdjust.promotedPlayers.map(p => p.name).join(', ') || '無'}\n降下二軍: ${homeAdjust.demotedPlayers.map(p => p.name).join(', ') || '無'}`,
            type: 'roster'
          });
        }

        const awayAdjust = getAutoAdjustedPlayers(game.awayTeamId, newPlayers, newDate);
        newPlayers = awayAdjust.newPlayers;
        if (awayAdjust.promotedPlayers.length > 0 || awayAdjust.demotedPlayers.length > 0) {
          const team = state.teams.find(t => t.id === game.awayTeamId);
          newNews.unshift({
            id: `N_roster_${game.id}_away`,
            date: newDate.toISOString(),
            title: `${team?.name} 人員異動`,
            content: `升上一軍: ${awayAdjust.promotedPlayers.map(p => p.name).join(', ') || '無'}\n降下二軍: ${awayAdjust.demotedPlayers.map(p => p.name).join(', ') || '無'}`,
            type: 'roster'
          });
        }

        const homeTeam = state.teams.find(t => t.id === game.homeTeamId);
        const awayTeam = state.teams.find(t => t.id === game.awayTeamId);
        
        const homeTeamPlayers = newPlayers.filter(p => p.teamId === game.homeTeamId);
        const awayTeamPlayers = newPlayers.filter(p => p.teamId === game.awayTeamId);
        
        const homeActivePlayers = homeTeamPlayers.filter(p => p.status === 'active');
        const awayActivePlayers = awayTeamPlayers.filter(p => p.status === 'active');
        const homeActiveCoaches = state.coaches.filter(c => c.teamId === game.homeTeamId && c.status === 'active');
        const awayActiveCoaches = state.coaches.filter(c => c.teamId === game.awayTeamId && c.status === 'active');

        const getTeamStrength = (players: Player[], coaches: Coach[]) => {
          let hitting = players.reduce((sum, p) => sum + p.stats.contact + p.stats.power, 0) / (players.length || 1);
          let pitching = players.filter(p => p.position === 'P').reduce((sum, p) => sum + (p.stats.pitching?.control || 0) + (p.stats.pitching?.velocity || 0), 0) / (players.filter(p => p.position === 'P').length || 1);
          
          coaches.forEach(c => {
            hitting += (c.boosts.contact + c.boosts.power) * 2;
            pitching += c.boosts.pitching * 4;
          });
          
          return { hitting, pitching };
        };

        const homeStrength = getTeamStrength(homeActivePlayers, homeActiveCoaches);
        const awayStrength = getTeamStrength(awayActivePlayers, awayActiveCoaches);

        // Determine weather
        const weathers: WeatherCondition[] = ['sunny', 'cloudy', 'rainy', 'windy'];
        const weather: WeatherCondition = homeTeam?.stadium.type === 'dome' 
          ? 'sunny' 
          : weathers[Math.floor(Math.random() * weathers.length)];

        // Weather impact on scoring
        const weatherImpact = homeTeam?.stadium.weatherImpact || 0;
        const runsModifier = weather === 'rainy' ? -0.1 * weatherImpact : (weather === 'windy' ? 0.1 * weatherImpact : 0);

        const hAdvantage = (homeStrength.hitting - awayStrength.pitching) / 200;
        const aAdvantage = (awayStrength.hitting - homeStrength.pitching) / 200;

        const hRunProb = Math.max(0.4, Math.min(0.9, 0.75 - runsModifier - hAdvantage));
        const aRunProb = Math.max(0.4, Math.min(0.9, 0.75 - runsModifier - aAdvantage));

        const boxHome: number[] = [];
        const boxAway: number[] = [];
        let homeTotal = 0;
        let awayTotal = 0;
        
        for (let i = 0; i < 9; i++) {
          const hRun = Math.random() > hRunProb ? Math.floor(Math.random() * 3) : 0;
          const aRun = Math.random() > aRunProb ? Math.floor(Math.random() * 3) : 0;
          boxHome.push(hRun);
          boxAway.push(aRun);
          homeTotal += hRun;
          awayTotal += aRun;
        }
        
        let inning = 9;
        while (homeTotal === awayTotal && inning < 12) {
          const hRun = Math.random() > 0.85 ? 1 : 0;
          const aRun = Math.random() > 0.85 ? 1 : 0;
          boxHome.push(hRun);
          boxAway.push(aRun);
          homeTotal += hRun;
          awayTotal += aRun;
          inning++;
        }
        
        if (homeTotal === awayTotal) {
          boxHome[boxHome.length - 1] += 1;
          homeTotal += 1;
        }
        
        const homePitchers = homeTeamPlayers.filter(p => p.position === 'P');
        const awayPitchers = awayTeamPlayers.filter(p => p.position === 'P');
        
        const isHomeWin = homeTotal > awayTotal;
        const winningPitcherId = isHomeWin 
          ? homePitchers[Math.floor(Math.random() * homePitchers.length)]?.id 
          : awayPitchers[Math.floor(Math.random() * awayPitchers.length)]?.id;
        const losingPitcherId = isHomeWin 
          ? awayPitchers[Math.floor(Math.random() * awayPitchers.length)]?.id 
          : homePitchers[Math.floor(Math.random() * homePitchers.length)]?.id;
          
        const winningTeamPlayers = isHomeWin ? homeTeamPlayers : awayTeamPlayers;
        const mvpId = winningTeamPlayers[Math.floor(Math.random() * winningTeamPlayers.length)]?.id;
        
        const location = homeTeam ? homeTeam.stadium.name : '聯邦大巨蛋';
        const maxCapacity = homeTeam ? homeTeam.stadium.capacity : 40000;
        const attendance = Math.floor(Math.random() * (maxCapacity * 0.8)) + (maxCapacity * 0.2);

        const updatedGame = {
          ...game,
          homeScore: homeTotal,
          awayScore: awayTotal,
          status: 'finished' as const,
          boxScore: { home: boxHome, away: boxAway },
          winningPitcherId,
          losingPitcherId,
          mvpId,
          location,
          attendance,
          weather
        };

        const index = newSchedule.findIndex(g => g.id === game.id);
        if (index !== -1) {
          newSchedule[index] = updatedGame;
        }

        // Generate news for big wins or shutouts
        if (Math.abs(homeTotal - awayTotal) >= 8) {
          const winner = isHomeWin ? homeTeam : awayTeam;
          const loser = isHomeWin ? awayTeam : homeTeam;
          if (winner && loser) {
            newNews.unshift({
              id: `N_blowout_${game.id}`,
              date: game.date,
              title: `${winner.name} 狂勝 ${loser.name}`,
              content: `${winner.name} 在今天的比賽中以 ${Math.max(homeTotal, awayTotal)}:${Math.min(homeTotal, awayTotal)} 擊敗 ${loser.name}，展現強大火力。`,
              type: 'game'
            });
          }
        } else if (homeTotal === 0 || awayTotal === 0) {
          const winner = isHomeWin ? homeTeam : awayTeam;
          const loser = isHomeWin ? awayTeam : homeTeam;
          if (winner && loser) {
            newNews.unshift({
              id: `N_shutout_${game.id}`,
              date: game.date,
              title: `${winner.name} 完封 ${loser.name}`,
              content: `${winner.name} 投手群表現優異，以 ${Math.max(homeTotal, awayTotal)}:0 完封 ${loser.name}。`,
              type: 'game'
            });
          }
        }

        // Update standings if it's a regular or interleague game
        if (game.type === 'regular' && newStandings[game.homeTeamId] && newStandings[game.awayTeamId]) {
          const homeTeamRecord = newStandings[game.homeTeamId];
          const awayTeamRecord = newStandings[game.awayTeamId];

          homeTeamRecord.gamesPlayed++;
          awayTeamRecord.gamesPlayed++;
          homeTeamRecord.runsScored += homeTotal;
          homeTeamRecord.runsAllowed += awayTotal;
          awayTeamRecord.runsScored += awayTotal;
          awayTeamRecord.runsAllowed += homeTotal;

          if (homeTotal > awayTotal) {
            homeTeamRecord.wins++;
            awayTeamRecord.losses++;
          } else {
            homeTeamRecord.losses++;
            awayTeamRecord.wins++;
          }

          homeTeamRecord.winPercentage = homeTeamRecord.wins / homeTeamRecord.gamesPlayed;
          awayTeamRecord.winPercentage = awayTeamRecord.wins / awayTeamRecord.gamesPlayed;
        }

        // Handle Postseason logic
        if (updatedGame.type === 'postseason') {
          const homeWins = newSchedule.filter(g => g.type === 'postseason' && g.status === 'finished' && ((g.homeTeamId === updatedGame.homeTeamId && g.homeScore > g.awayScore) || (g.awayTeamId === updatedGame.homeTeamId && g.awayScore > g.homeScore))).length;
          const awayWins = newSchedule.filter(g => g.type === 'postseason' && g.status === 'finished' && ((g.homeTeamId === updatedGame.awayTeamId && g.homeScore > g.awayScore) || (g.awayTeamId === updatedGame.awayTeamId && g.awayScore > g.homeScore))).length;

          if (homeWins === 4 || awayWins === 4) {
            newSchedule = newSchedule.map(g => g.type === 'postseason' && g.status === 'scheduled' ? { ...g, status: 'cancelled' } : g);
            const champTeam = homeWins === 4 ? homeTeam : awayTeam;
            if (champTeam) {
              newNews.unshift({
                id: `N_champ_${updatedGame.id}`,
                date: updatedGame.date,
                title: `${champTeam.name} 奪得總冠軍！`,
                content: `以 4 勝 ${Math.min(homeWins, awayWins)} 敗的成績封王！`,
                type: 'league'
              });
            }
          }
        }
      });

      // Keep only latest 50 news items
      if (newNews.length > 50) {
        newNews = newNews.slice(0, 50);
      }

      return { 
        currentDate: newDate,
        players: newPlayers,
        schedule: newSchedule,
        standings: newStandings,
        news: newNews
      };
    });
  },

  advanceToNextDay: () => {
    const state = get();
    const nextDay = addDays(state.currentDate, 1);
    nextDay.setHours(0, 0, 0, 0);
    
    const diffMinutes = (nextDay.getTime() - state.currentDate.getTime()) / 60000;
    state.advanceTime(diffMinutes);
  },

  togglePlay: () => set((state) => ({ isPlaying: !state.isPlaying })),
  
  setMultiplier: (mult: number) => set({ timeMultiplier: mult }),

  simulateGame: (gameId: string) => {
    // Manual simulation of a specific game
  },

  movePlayer: (playerId: string, newStatus: 'active' | 'reserve') => {
    let success = false;
    let message = '';
    set((state) => {
      const player = state.players.find(p => p.id === playerId);
      if (!player) {
        message = '找不到球員';
        return state;
      }
      if (player.status === newStatus) {
        message = '球員已在該名單中';
        return state;
      }

      if (player.lastMovedDate) {
        const daysSinceMove = (state.currentDate.getTime() - parseISO(player.lastMovedDate).getTime()) / (1000 * 3600 * 24);
        if (daysSinceMove < 5) {
          message = `冷卻中，還需 ${Math.ceil(5 - daysSinceMove)} 天才能再次異動`;
          return state;
        }
      }

      const teamPlayers = state.players.filter(p => p.teamId === player.teamId);
      const activeCount = teamPlayers.filter(p => p.status === 'active').length;

      if (newStatus === 'active' && activeCount >= 28) {
        message = '一軍名單已滿 (上限 28 人)';
        return state;
      }

      success = true;
      const newPlayers = state.players.map(p =>
        p.id === playerId
          ? { ...p, status: newStatus, lastMovedDate: state.currentDate.toISOString() }
          : p
      );
      
      let newNews = [...state.news];
      const team = state.teams.find(t => t.id === player.teamId);
      newNews.unshift({
        id: `N_roster_manual_${Date.now()}_${playerId}`,
        date: state.currentDate.toISOString(),
        title: `${team?.name} 人員異動`,
        content: `${player.name} 被${newStatus === 'active' ? '升上一軍' : '降下二軍'}。`,
        type: 'roster'
      });
      if (newNews.length > 50) newNews = newNews.slice(0, 50);

      return { ...state, players: newPlayers, news: newNews };
    });
    return { success, message };
  },

  autoAdjustRoster: (teamId: string) => {
    let success = false;
    let message = '';
    set((state) => {
      const { newPlayers, promotedPlayers, demotedPlayers } = getAutoAdjustedPlayers(teamId, state.players, state.currentDate);
      success = true;
      message = `教練團已完成陣容調整：升上一軍 ${promotedPlayers.length} 人，降下二軍 ${demotedPlayers.length} 人。`;
      
      let newNews = [...state.news];
      if (promotedPlayers.length > 0 || demotedPlayers.length > 0) {
        const team = state.teams.find(t => t.id === teamId);
        newNews.unshift({
          id: `N_roster_auto_${Date.now()}_${teamId}`,
          date: state.currentDate.toISOString(),
          title: `${team?.name} 人員異動`,
          content: `升上一軍: ${promotedPlayers.map(p => p.name).join(', ') || '無'}\n降下二軍: ${demotedPlayers.map(p => p.name).join(', ') || '無'}`,
          type: 'roster'
        });
        if (newNews.length > 50) newNews = newNews.slice(0, 50);
      }

      return { ...state, players: newPlayers, news: newNews };
    });
    return { success, message };
  },

  moveCoach: (coachId: string, newStatus: 'active' | 'reserve') => {
    let success = false;
    let message = '';
    set((state) => {
      const coach = state.coaches.find(c => c.id === coachId);
      if (!coach) {
        message = '找不到教練';
        return state;
      }
      if (coach.status === newStatus) {
        message = '教練已在該名單中';
        return state;
      }

      if (coach.lastMovedDate) {
        const daysSinceMove = (state.currentDate.getTime() - parseISO(coach.lastMovedDate).getTime()) / (1000 * 3600 * 24);
        if (daysSinceMove < 5) {
          message = `冷卻中，還需 ${Math.ceil(5 - daysSinceMove)} 天才能再次異動`;
          return state;
        }
      }

      const teamCoaches = state.coaches.filter(c => c.teamId === coach.teamId && c.role === coach.role);
      const activeCount = teamCoaches.filter(c => c.status === 'active').length;

      if (newStatus === 'active' && activeCount >= 1) {
        message = `一軍已有 ${coach.role} 教練，請先將其降二軍`;
        return state;
      }

      success = true;
      const newCoaches = state.coaches.map(c =>
        c.id === coachId
          ? { ...c, status: newStatus, lastMovedDate: state.currentDate.toISOString() }
          : c
      );

      let newNews = [...state.news];
      const team = state.teams.find(t => t.id === coach.teamId);
      newNews.unshift({
        id: `N_roster_coach_${Date.now()}_${coachId}`,
        date: state.currentDate.toISOString(),
        title: `${team?.name} 教練團異動`,
        content: `${coach.name} 教練被${newStatus === 'active' ? '升上一軍' : '降下二軍'}。`,
        type: 'roster'
      });
      if (newNews.length > 50) newNews = newNews.slice(0, 50);

      return { ...state, coaches: newCoaches, news: newNews };
    });
    return { success, message };
  }
}));
