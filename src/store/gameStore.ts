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
  minorStandings: Record<string, StandingsRecord>;
  springStandings: Record<string, StandingsRecord>;
  winterStandings: Record<string, StandingsRecord>;
  news: NewsItem[];
  historicalStats: { 
    year: number; 
    standings: Record<string, StandingsRecord>; 
    minorStandings: Record<string, StandingsRecord>;
    springStandings: Record<string, StandingsRecord>;
    winterStandings: Record<string, StandingsRecord>;
    playerStats: Record<string, Player['seasonStats']>;
    minorPlayerStats: Record<string, Player['minorStats']>;
    springPlayerStats: Record<string, Player['springStats']>;
    winterPlayerStats: Record<string, Player['winterStats']>;
  }[];
  
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

function isSpringTraining(date: Date): boolean {
  const month = date.getMonth();
  const day = date.getDate();
  return month === 2 && day >= 1 && day <= 25; // March 1 to March 25
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
    if (p.lastMovedDate && !isSpringTraining(currentDate)) {
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
  minorStandings: {},
  springStandings: {},
  winterStandings: {},
  news: [],
  historicalStats: [],

  initialize: () => {
    const players = generatePlayers();
    const coaches = generateCoaches();
    const schedule = generateSchedule(2026);
    
    // Initialize standings
    const standings: Record<string, StandingsRecord> = {};
    const minorStandings: Record<string, StandingsRecord> = {};
    const springStandings: Record<string, StandingsRecord> = {};
    const winterStandings: Record<string, StandingsRecord> = {};
    
    TEAMS.forEach(team => {
      const initRecord = {
        teamId: team.id, wins: 0, losses: 0, ties: 0, gamesPlayed: 0, winPercentage: 0, runsScored: 0, runsAllowed: 0
      };
      standings[team.id] = { ...initRecord };
      minorStandings[team.id] = { ...initRecord };
      springStandings[team.id] = { ...initRecord };
    });
    
    // Initialize winter league teams
    for (let i = 1; i <= 6; i++) {
      winterStandings[`WB_TEAM${i}`] = {
        teamId: `WB_TEAM${i}`, wins: 0, losses: 0, ties: 0, gamesPlayed: 0, winPercentage: 0, runsScored: 0, runsAllowed: 0
      };
    }

    const news: NewsItem[] = [{
      id: 'N1',
      date: new Date('2026-02-25T08:00:00Z').toISOString(),
      title: 'EVFPBL 2026 春訓即將展開！',
      content: '各隊已陸續展開春訓，為即將到來的新賽季進行最後調整與熱身。',
      type: 'league'
    }];

    set({ players, coaches, schedule, standings, minorStandings, springStandings, winterStandings, news, historicalStats: [] });
  },

  advanceTime: (minutes: number) => {
    set((state) => {
      const newDate = addMinutes(state.currentDate, minutes);
      
      let newPlayers = [...state.players];
      const isNewDay = newDate.getDate() !== state.currentDate.getDate();
      const isMonday = newDate.getDay() === 1;

      if (isNewDay) {
        newPlayers = newPlayers.map(p => {
          // Migration for existing players
          const throws = p.throws || (Math.random() > 0.25 ? 'R' : 'L');
          const bats = p.bats || (Math.random() > 0.7 ? (Math.random() > 0.5 ? 'L' : 'S') : 'R');
          let pitcherRole = p.pitcherRole;
          if (p.position === 'P' && !pitcherRole) {
            const stamina = p.stats.pitching?.stamina || 50;
            const velocity = p.stats.pitching?.velocity || 130;
            if (stamina > 75) pitcherRole = 'SP';
            else if (stamina < 55 && velocity > 145) pitcherRole = 'CP';
            else pitcherRole = 'RP';
          }

          return {
            ...p,
            throws,
            bats,
            pitcherRole,
            energy: Math.min(100, (p.energy ?? 100) + (p.status === 'injured' ? 5 : 15))
          };
        });
      }

      // Check for games to simulate
      const gamesToSimulate = state.schedule.filter(g => 
        g.status === 'scheduled' && 
        isAfter(newDate, parseISO(g.date))
      );

      let newSchedule = [...state.schedule];
      let newStandings = { ...state.standings };
      let newMinorStandings = { ...state.minorStandings };
      let newSpringStandings = { ...state.springStandings };
      let newWinterStandings = { ...state.winterStandings };
      let newNews = [...state.news];

      // 每年 3/25 各球隊提交一軍名單 (自動調整)
      const isRosterSubmitDay = newDate.getMonth() === 2 && newDate.getDate() === 25 && (state.currentDate.getMonth() !== 2 || state.currentDate.getDate() !== 25);
      if (isRosterSubmitDay) {
        state.teams.forEach(team => {
          const { newPlayers: adjustedPlayers } = getAutoAdjustedPlayers(team.id, newPlayers, newDate);
          newPlayers = adjustedPlayers;
        });
        newNews.unshift({
          id: `N_roster_submit_${newDate.getFullYear()}`,
          date: newDate.toISOString(),
          title: `各隊提交一軍名單`,
          content: `各隊已完成春訓，並提交開季 28 人一軍名單。`,
          type: 'league'
        });
      }

      // Check if we need to resolve Minor Postseason teams (Aug 15)
      const isMinorPostseasonStart = newDate.getMonth() === 7 && newDate.getDate() === 15 && (state.currentDate.getMonth() !== 7 || state.currentDate.getDate() !== 15);

      // Check if we need to resolve Postseason teams (Sept 16)
      const isPostseasonStart = newDate.getMonth() === 8 && newDate.getDate() === 16 && (state.currentDate.getMonth() !== 8 || state.currentDate.getDate() !== 16);
      
      // 每年 11/1 冬季香蕉聯盟成軍
      const isWinterBananaStart = newDate.getMonth() === 10 && newDate.getDate() === 1 && (state.currentDate.getMonth() !== 10 || state.currentDate.getDate() !== 1);
      if (isWinterBananaStart) {
        newNews.unshift({
          id: `N_winter_banana_${newDate.getFullYear()}`,
          date: newDate.toISOString(),
          title: `冬季香蕉聯盟成軍`,
          content: `由各球隊提供、社會球隊、業餘球隊等有潛力選手組成的冬季香蕉聯盟即將開打！`,
          type: 'league'
        });
      }

      // 每年 12/30 下架本年度戰績，放入歷年戰績
      const isYearEnd = newDate.getMonth() === 11 && newDate.getDate() === 30 && (state.currentDate.getMonth() !== 11 || state.currentDate.getDate() !== 30);
      if (isYearEnd) {
        const playerStatsToSave: Record<string, Player['seasonStats']> = {};
        const minorPlayerStatsToSave: Record<string, Player['minorStats']> = {};
        const springPlayerStatsToSave: Record<string, Player['springStats']> = {};
        const winterPlayerStatsToSave: Record<string, Player['winterStats']> = {};
        
        newPlayers.forEach(p => {
          if (p.seasonStats) {
            playerStatsToSave[p.id] = { ...p.seasonStats };
            p.seasonStats = { gamesPlayed: 0, atBats: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0, inningsPitched: 0, earnedRuns: 0, strikeouts: 0, wins: 0, losses: 0, saves: 0 };
          }
          if (p.minorStats) {
            minorPlayerStatsToSave[p.id] = { ...p.minorStats };
            p.minorStats = { gamesPlayed: 0, atBats: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0, inningsPitched: 0, earnedRuns: 0, strikeouts: 0, wins: 0, losses: 0, saves: 0 };
          }
          if (p.springStats) {
            springPlayerStatsToSave[p.id] = { ...p.springStats };
            p.springStats = { gamesPlayed: 0, atBats: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0, inningsPitched: 0, earnedRuns: 0, strikeouts: 0, wins: 0, losses: 0, saves: 0 };
          }
          if (p.winterStats) {
            winterPlayerStatsToSave[p.id] = { ...p.winterStats };
            p.winterStats = { gamesPlayed: 0, atBats: 0, hits: 0, homeRuns: 0, rbi: 0, stolenBases: 0, inningsPitched: 0, earnedRuns: 0, strikeouts: 0, wins: 0, losses: 0, saves: 0 };
          }
        });

        const newHistoricalStats = [...state.historicalStats, {
          year: state.currentDate.getFullYear(),
          standings: { ...state.standings },
          minorStandings: { ...state.minorStandings },
          springStandings: { ...state.springStandings },
          winterStandings: { ...state.winterStandings },
          playerStats: playerStatsToSave,
          minorPlayerStats: minorPlayerStatsToSave,
          springPlayerStats: springPlayerStatsToSave,
          winterPlayerStats: winterPlayerStatsToSave
        }];
        newStandings = {};
        newMinorStandings = {};
        newSpringStandings = {};
        newWinterStandings = {};
        TEAMS.forEach(t => {
          const initRecord = { teamId: t.id, wins: 0, losses: 0, ties: 0, gamesPlayed: 0, winPercentage: 0, runsScored: 0, runsAllowed: 0 };
          newStandings[t.id] = { ...initRecord };
          newMinorStandings[t.id] = { ...initRecord };
          newSpringStandings[t.id] = { ...initRecord };
        });
        for (let i = 1; i <= 6; i++) {
          newWinterStandings[`WB_TEAM${i}`] = { teamId: `WB_TEAM${i}`, wins: 0, losses: 0, ties: 0, gamesPlayed: 0, winPercentage: 0, runsScored: 0, runsAllowed: 0 };
        }
        set({ historicalStats: newHistoricalStats, standings: newStandings, minorStandings: newMinorStandings, springStandings: newSpringStandings, winterStandings: newWinterStandings });
      }

      // 每年 1/1 展開新賽程
      const isNewYear = newDate.getMonth() === 0 && newDate.getDate() === 1 && (state.currentDate.getMonth() !== 0 || state.currentDate.getDate() !== 1);
      if (isNewYear) {
        newSchedule = generateSchedule(newDate.getFullYear());
        newNews.unshift({
          id: `N_new_year_${newDate.getFullYear()}`,
          date: newDate.toISOString(),
          title: `新賽季 ${newDate.getFullYear()} 展開！`,
          content: `新的一年賽程已排定，各隊準備好迎接挑戰。`,
          type: 'league'
        });
      }

      if (isMinorPostseasonStart) {
        const minorTeams = Object.values(newMinorStandings).sort((a, b) => b.winPercentage - a.winPercentage);
        if (minorTeams.length >= 4) {
          const mSeed1 = minorTeams[0].teamId;
          const mSeed2 = minorTeams[1].teamId;
          const mSeed3 = minorTeams[2].teamId;
          const mSeed4 = minorTeams[3].teamId;

          newSchedule = newSchedule.map(g => {
            if (g.homeTeamId === 'M_SEED1') return { ...g, homeTeamId: mSeed1 };
            if (g.awayTeamId === 'M_SEED1') return { ...g, awayTeamId: mSeed1 };
            if (g.homeTeamId === 'M_SEED2') return { ...g, homeTeamId: mSeed2 };
            if (g.awayTeamId === 'M_SEED2') return { ...g, awayTeamId: mSeed2 };
            if (g.homeTeamId === 'M_SEED3') return { ...g, homeTeamId: mSeed3 };
            if (g.awayTeamId === 'M_SEED3') return { ...g, awayTeamId: mSeed3 };
            if (g.homeTeamId === 'M_SEED4') return { ...g, homeTeamId: mSeed4 };
            if (g.awayTeamId === 'M_SEED4') return { ...g, awayTeamId: mSeed4 };
            return g;
          });

          newNews.unshift({
            id: `N_minor_postseason_start_${newDate.getFullYear()}`,
            date: newDate.toISOString(),
            title: `二軍季後賽名單出爐！`,
            content: `二軍例行賽前四名將展開季後賽，爭奪二軍總冠軍！`,
            type: 'league'
          });
        }
      }

      if (isPostseasonStart) {
        const rTeams = Object.values(newStandings).filter(s => state.teams.find(t => t.id === s.teamId)?.league === 'R+').sort((a, b) => b.winPercentage - a.winPercentage);
        const pTeams = Object.values(newStandings).filter(s => state.teams.find(t => t.id === s.teamId)?.league === 'P1').sort((a, b) => b.winPercentage - a.winPercentage);

        if (rTeams.length >= 3 && pTeams.length >= 3) {
          const rSeed1 = rTeams[0].teamId;
          const rSeed2 = rTeams[1].teamId;
          const rSeed3 = rTeams[2].teamId;
          const pSeed1 = pTeams[0].teamId;
          const pSeed2 = pTeams[1].teamId;
          const pSeed3 = pTeams[2].teamId;

          newSchedule = newSchedule.map(g => {
            if (g.homeTeamId === 'R_SEED1') return { ...g, homeTeamId: rSeed1 };
            if (g.awayTeamId === 'R_SEED1') return { ...g, awayTeamId: rSeed1 };
            if (g.homeTeamId === 'R_SEED2') return { ...g, homeTeamId: rSeed2 };
            if (g.awayTeamId === 'R_SEED2') return { ...g, awayTeamId: rSeed2 };
            if (g.homeTeamId === 'R_SEED3') return { ...g, homeTeamId: rSeed3 };
            if (g.awayTeamId === 'R_SEED3') return { ...g, awayTeamId: rSeed3 };
            if (g.homeTeamId === 'P_SEED1') return { ...g, homeTeamId: pSeed1 };
            if (g.awayTeamId === 'P_SEED1') return { ...g, awayTeamId: pSeed1 };
            if (g.homeTeamId === 'P_SEED2') return { ...g, homeTeamId: pSeed2 };
            if (g.awayTeamId === 'P_SEED2') return { ...g, awayTeamId: pSeed2 };
            if (g.homeTeamId === 'P_SEED3') return { ...g, homeTeamId: pSeed3 };
            if (g.awayTeamId === 'P_SEED3') return { ...g, awayTeamId: pSeed3 };
            return g;
          });

          newNews.unshift({
            id: `N_postseason_start_${newDate.getFullYear()}`,
            date: newDate.toISOString(),
            title: `季後賽名單出爐！`,
            content: `各區前三名將展開激烈廝殺，爭奪聯盟冠軍！`,
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
        
        if (game.type === 'minor-regular') {
          // No extra innings in minor regular season
        } else if (game.type === 'minor-postseason') {
          // Tie-breaker rule: higher chance of scoring
          while (homeTotal === awayTotal && inning < 12) {
            const hRun = Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0;
            const aRun = Math.random() > 0.5 ? Math.floor(Math.random() * 3) + 1 : 0;
            boxHome.push(hRun);
            boxAway.push(aRun);
            homeTotal += hRun;
            awayTotal += aRun;
            inning++;
          }
        } else {
          // Normal extra innings
          while (homeTotal === awayTotal && inning < 12) {
            const hRun = Math.random() > 0.85 ? 1 : 0;
            const aRun = Math.random() > 0.85 ? 1 : 0;
            boxHome.push(hRun);
            boxAway.push(aRun);
            homeTotal += hRun;
            awayTotal += aRun;
            inning++;
          }
        }
        
        // If still tied after 12 innings (or 9 for minor-regular), force a winner unless it's minor-regular
        if (homeTotal === awayTotal && game.type !== 'minor-regular') {
          boxHome[boxHome.length - 1] += 1;
          homeTotal += 1;
        }
        
        const isTie = homeTotal === awayTotal;
        const isHomeWin = homeTotal > awayTotal;
        
        const homePitchers = homeTeamPlayers.filter(p => p.position === 'P');
        const awayPitchers = awayTeamPlayers.filter(p => p.position === 'P');
        
        let winningPitcherId, losingPitcherId, mvpId;
        
        if (!isTie) {
          winningPitcherId = isHomeWin 
            ? homePitchers[Math.floor(Math.random() * homePitchers.length)]?.id 
            : awayPitchers[Math.floor(Math.random() * awayPitchers.length)]?.id;
          losingPitcherId = isHomeWin 
            ? awayPitchers[Math.floor(Math.random() * awayPitchers.length)]?.id 
            : homePitchers[Math.floor(Math.random() * homePitchers.length)]?.id;
            
          const winningTeamPlayers = isHomeWin ? homeTeamPlayers : awayTeamPlayers;
          mvpId = winningTeamPlayers[Math.floor(Math.random() * winningTeamPlayers.length)]?.id;
        }
        
        const location = game.league === 'Minor' && homeTeam ? homeTeam.minorLeagueStadium : (homeTeam ? homeTeam.stadium.name : '聯邦大巨蛋');
        const maxCapacity = homeTeam ? homeTeam.stadium.capacity : 40000;
        const attendance = game.league === 'Minor' ? Math.floor(Math.random() * 2000) + 500 : Math.floor(Math.random() * (maxCapacity * 0.8)) + (maxCapacity * 0.2);

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

        // Update player stats based on game type
        const updatePlayerStats = (p: Player, statKey: 'seasonStats' | 'minorStats' | 'springStats' | 'winterStats') => {
          const stats = p[statKey];
          if (!stats) return p;
          
          let energyCost = 0;
          let updatedStats = { ...stats };

          if (p.id === winningPitcherId) {
            energyCost = p.pitcherRole === 'SP' ? 40 : 20;
            updatedStats = { ...stats, wins: stats.wins + 1, gamesPlayed: stats.gamesPlayed + 1, inningsPitched: stats.inningsPitched + 6, strikeouts: stats.strikeouts + Math.floor(Math.random() * 8) + 2 };
          } else if (p.id === losingPitcherId) {
            energyCost = p.pitcherRole === 'SP' ? 40 : 20;
            updatedStats = { ...stats, losses: stats.losses + 1, gamesPlayed: stats.gamesPlayed + 1, inningsPitched: stats.inningsPitched + 5, strikeouts: stats.strikeouts + Math.floor(Math.random() * 5) + 1 };
          } else if (p.id === mvpId) {
            energyCost = p.position === 'P' ? (p.pitcherRole === 'SP' ? 40 : 20) : 15;
            updatedStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1, atBats: stats.atBats + 4, hits: stats.hits + Math.floor(Math.random() * 3) + 2, homeRuns: stats.homeRuns + (Math.random() > 0.7 ? 1 : 0), rbi: stats.rbi + Math.floor(Math.random() * 4) + 1 };
          } else if (homeActivePlayers.find(hp => hp.id === p.id) || awayActivePlayers.find(ap => ap.id === p.id)) {
            // Random stats for other active players in this game
            if (p.position === 'P') {
              energyCost = p.pitcherRole === 'SP' ? 30 : 15;
              updatedStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1, inningsPitched: stats.inningsPitched + 1, strikeouts: stats.strikeouts + Math.floor(Math.random() * 2) };
            } else {
              energyCost = 10;
              const ab = Math.floor(Math.random() * 2) + 3;
              const hits = Math.floor(Math.random() * 3);
              const hr = Math.random() > 0.9 ? 1 : 0;
              const rbi = hr > 0 ? Math.floor(Math.random() * 3) + 1 : (hits > 0 ? Math.floor(Math.random() * 2) : 0);
              const sb = Math.random() > 0.9 ? 1 : 0;
              updatedStats = { ...stats, gamesPlayed: stats.gamesPlayed + 1, atBats: stats.atBats + ab, hits: stats.hits + hits, homeRuns: stats.homeRuns + hr, rbi: stats.rbi + rbi, stolenBases: stats.stolenBases + sb };
            }
          } else {
            return p; // Did not play
          }
          
          return {
            ...p,
            energy: Math.max(0, (p.energy ?? 100) - energyCost),
            [statKey]: updatedStats
          };
        };

        if (game.type === 'regular') {
          newPlayers = newPlayers.map(p => updatePlayerStats(p, 'seasonStats'));
        } else if (game.type === 'minor-regular') {
          newPlayers = newPlayers.map(p => updatePlayerStats(p, 'minorStats'));
        } else if (game.type === 'spring') {
          newPlayers = newPlayers.map(p => updatePlayerStats(p, 'springStats'));
        } else if (game.type === 'winter') {
          newPlayers = newPlayers.map(p => updatePlayerStats(p, 'winterStats'));
        }

        // Random chance for injury
        const allActivePlayers = [...homeActivePlayers, ...awayActivePlayers];
        allActivePlayers.forEach(p => {
          if (Math.random() < 0.005) { // 0.5% chance per game per player
            const pIndex = newPlayers.findIndex(np => np.id === p.id);
            if (pIndex !== -1) {
              newPlayers[pIndex] = { ...newPlayers[pIndex], status: 'injured', lastMovedDate: newDate.toISOString() };
              const team = state.teams.find(t => t.id === p.teamId);
              newNews.unshift({
                id: `N_injury_${game.id}_${p.id}`,
                date: newDate.toISOString(),
                title: `${team?.name} 傷兵公告`,
                content: `${p.name} 在比賽中受傷，被放入傷兵名單。`,
                type: 'roster'
              });
            }
          }
        });

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
        const updateStandingsRecord = (standingsObj: Record<string, StandingsRecord>, teamId: string, isWin: boolean, isTie: boolean, runsScored: number, runsAllowed: number) => {
          if (!standingsObj[teamId]) return;
          const record = standingsObj[teamId];
          record.gamesPlayed += 1;
          if (isTie) {
            record.ties += 1;
          } else if (isWin) {
            record.wins += 1;
          } else {
            record.losses += 1;
          }
          record.runsScored += runsScored;
          record.runsAllowed += runsAllowed;
          record.winPercentage = record.wins / (record.gamesPlayed - record.ties || 1);
        };

        if (game.type === 'regular') {
          updateStandingsRecord(newStandings, game.homeTeamId, isHomeWin, isTie, homeTotal, awayTotal);
          updateStandingsRecord(newStandings, game.awayTeamId, !isHomeWin, isTie, awayTotal, homeTotal);
        } else if (game.type === 'minor-regular') {
          updateStandingsRecord(newMinorStandings, game.homeTeamId, isHomeWin, isTie, homeTotal, awayTotal);
          updateStandingsRecord(newMinorStandings, game.awayTeamId, !isHomeWin, isTie, awayTotal, homeTotal);
        } else if (game.type === 'spring') {
          updateStandingsRecord(newSpringStandings, game.homeTeamId, isHomeWin, isTie, homeTotal, awayTotal);
          updateStandingsRecord(newSpringStandings, game.awayTeamId, !isHomeWin, isTie, awayTotal, homeTotal);
        } else if (game.type === 'winter') {
          updateStandingsRecord(newWinterStandings, game.homeTeamId, isHomeWin, isTie, homeTotal, awayTotal);
          updateStandingsRecord(newWinterStandings, game.awayTeamId, !isHomeWin, isTie, awayTotal, homeTotal);
        }

        // Handle Minor Postseason logic
        if (updatedGame.type === 'minor-postseason') {
          const isRound1 = [updatedGame.homeTeamId, updatedGame.awayTeamId].some(id => id.includes('SEED3') || id.includes('SEED4'));
          const isRound2 = [updatedGame.homeTeamId, updatedGame.awayTeamId].some(id => id.includes('WINNER_R1') || id.includes('SEED2'));
          const targetWins = isRound1 ? 2 : 3;

          const homeWins = newSchedule.filter(g => g.type === 'minor-postseason' && g.status === 'finished' && 
            ((g.homeTeamId === updatedGame.homeTeamId && g.homeScore > g.awayScore) || 
             (g.awayTeamId === updatedGame.homeTeamId && g.awayScore > g.homeScore)) &&
            [g.homeTeamId, g.awayTeamId].includes(updatedGame.awayTeamId)
          ).length;

          const awayWins = newSchedule.filter(g => g.type === 'minor-postseason' && g.status === 'finished' && 
            ((g.homeTeamId === updatedGame.awayTeamId && g.homeScore > g.awayScore) || 
             (g.awayTeamId === updatedGame.awayTeamId && g.awayScore > g.homeScore)) &&
            [g.homeTeamId, g.awayTeamId].includes(updatedGame.homeTeamId)
          ).length;

          if (homeWins === targetWins || awayWins === targetWins) {
            newSchedule = newSchedule.map(g => 
              g.type === 'minor-postseason' && g.status === 'scheduled' && 
              [g.homeTeamId, g.awayTeamId].includes(updatedGame.homeTeamId) && 
              [g.homeTeamId, g.awayTeamId].includes(updatedGame.awayTeamId)
                ? { ...g, status: 'cancelled' } : g
            );

            const seriesWinner = homeWins === targetWins ? updatedGame.homeTeamId : updatedGame.awayTeamId;

            if (isRound1) {
              newSchedule = newSchedule.map(g => {
                if (g.homeTeamId === 'M_WINNER_R1') return { ...g, homeTeamId: seriesWinner };
                if (g.awayTeamId === 'M_WINNER_R1') return { ...g, awayTeamId: seriesWinner };
                return g;
              });
              newNews.unshift({
                id: `N_minor_postseason_r1_${updatedGame.id}`,
                date: updatedGame.date,
                title: `二軍季後賽首輪結束！`,
                content: `${state.teams.find(t=>t.id===seriesWinner)?.name || seriesWinner} 晉級第二輪！`,
                type: 'league'
              });
            } else if (isRound2) {
              newSchedule = newSchedule.map(g => {
                if (g.homeTeamId === 'M_WINNER_R2') return { ...g, homeTeamId: seriesWinner };
                if (g.awayTeamId === 'M_WINNER_R2') return { ...g, awayTeamId: seriesWinner };
                return g;
              });
              newNews.unshift({
                id: `N_minor_postseason_r2_${updatedGame.id}`,
                date: updatedGame.date,
                title: `二軍季後賽第二輪結束！`,
                content: `${state.teams.find(t=>t.id===seriesWinner)?.name || seriesWinner} 晉級二軍總冠軍戰！`,
                type: 'league'
              });
            } else {
              newNews.unshift({
                id: `N_minor_postseason_champ_${updatedGame.id}`,
                date: updatedGame.date,
                title: `${state.teams.find(t=>t.id===seriesWinner)?.name || seriesWinner} 奪得二軍總冠軍！`,
                content: `恭喜獲得二軍最高榮耀！`,
                type: 'league'
              });
            }
          }
        }

        // Handle Postseason logic
        if (updatedGame.type === 'postseason') {
          // Determine if this is Round 1 (Seed 2 vs Seed 3) or Round 2 (Seed 1 vs Winner R1)
          const isRound1 = [updatedGame.homeTeamId, updatedGame.awayTeamId].some(id => id.includes('SEED2') || id.includes('SEED3'));
          const targetWins = isRound1 ? 3 : 4;

          const homeWins = newSchedule.filter(g => g.type === 'postseason' && g.status === 'finished' && 
            ((g.homeTeamId === updatedGame.homeTeamId && g.homeScore > g.awayScore) || 
             (g.awayTeamId === updatedGame.homeTeamId && g.awayScore > g.homeScore)) &&
            [g.homeTeamId, g.awayTeamId].includes(updatedGame.awayTeamId) // same matchup
          ).length;

          const awayWins = newSchedule.filter(g => g.type === 'postseason' && g.status === 'finished' && 
            ((g.homeTeamId === updatedGame.awayTeamId && g.homeScore > g.awayScore) || 
             (g.awayTeamId === updatedGame.awayTeamId && g.awayScore > g.homeScore)) &&
            [g.homeTeamId, g.awayTeamId].includes(updatedGame.homeTeamId) // same matchup
          ).length;

          if (homeWins === targetWins || awayWins === targetWins) {
            // Cancel remaining games in this series
            newSchedule = newSchedule.map(g => 
              g.type === 'postseason' && g.status === 'scheduled' && 
              [g.homeTeamId, g.awayTeamId].includes(updatedGame.homeTeamId) && 
              [g.homeTeamId, g.awayTeamId].includes(updatedGame.awayTeamId)
                ? { ...g, status: 'cancelled' } : g
            );

            const seriesWinner = homeWins === targetWins ? updatedGame.homeTeamId : updatedGame.awayTeamId;
            const leaguePrefix = updatedGame.league === 'R+' ? 'R' : 'P';

            if (isRound1) {
              // Resolve Winner R1
              newSchedule = newSchedule.map(g => {
                if (g.homeTeamId === `${leaguePrefix}_WINNER_R1`) return { ...g, homeTeamId: seriesWinner };
                if (g.awayTeamId === `${leaguePrefix}_WINNER_R1`) return { ...g, awayTeamId: seriesWinner };
                return g;
              });
              newNews.unshift({
                id: `N_postseason_r1_${updatedGame.id}`,
                date: updatedGame.date,
                title: `季後賽首輪結束！`,
                content: `${state.teams.find(t=>t.id===seriesWinner)?.name || seriesWinner} 晉級聯盟冠軍戰！`,
                type: 'league'
              });
            } else {
              // Resolve League Champ
              newSchedule = newSchedule.map(g => {
                if (g.homeTeamId === `${leaguePrefix}_CHAMP`) return { ...g, homeTeamId: seriesWinner };
                if (g.awayTeamId === `${leaguePrefix}_CHAMP`) return { ...g, awayTeamId: seriesWinner };
                return g;
              });
              newNews.unshift({
                id: `N_postseason_champ_${updatedGame.id}`,
                date: updatedGame.date,
                title: `${state.teams.find(t=>t.id===seriesWinner)?.name || seriesWinner} 奪得聯盟冠軍！`,
                content: `將代表聯盟出戰 EVFPBL 榮耀一！`,
                type: 'league'
              });
            }
          }
        }

        // Handle Glory One logic
        if (updatedGame.type === 'glory-one') {
          const homeWins = newSchedule.filter(g => g.type === 'glory-one' && g.status === 'finished' && ((g.homeTeamId === updatedGame.homeTeamId && g.homeScore > g.awayScore) || (g.awayTeamId === updatedGame.homeTeamId && g.awayScore > g.homeScore))).length;
          const awayWins = newSchedule.filter(g => g.type === 'glory-one' && g.status === 'finished' && ((g.homeTeamId === updatedGame.awayTeamId && g.homeScore > g.awayScore) || (g.awayTeamId === updatedGame.awayTeamId && g.awayScore > g.homeScore))).length;

          if (homeWins === 4 || awayWins === 4) {
            newSchedule = newSchedule.map(g => g.type === 'glory-one' && g.status === 'scheduled' ? { ...g, status: 'cancelled' } : g);
            const champTeamId = homeWins === 4 ? updatedGame.homeTeamId : updatedGame.awayTeamId;
            const champTeam = state.teams.find(t => t.id === champTeamId);
            if (champTeam) {
              newNews.unshift({
                id: `N_glory_one_champ_${updatedGame.id}`,
                date: updatedGame.date,
                title: `${champTeam.name} 奪得 EVFPBL 榮耀一總冠軍！`,
                content: `以 4 勝 ${Math.min(homeWins, awayWins)} 敗的成績封王！`,
                type: 'league'
              });
            }
          }
        }
      });

      // Recover injured players
      if (isNewDay) {
        newPlayers = newPlayers.map(p => {
          if (p.status === 'injured' && p.lastMovedDate) {
            const daysInjured = (newDate.getTime() - parseISO(p.lastMovedDate).getTime()) / (1000 * 3600 * 24);
            if (daysInjured >= 7 && Math.random() < 0.2) { // Recover after at least 7 days with 20% chance per day
              const team = state.teams.find(t => t.id === p.teamId);
              newNews.unshift({
                id: `N_recovery_${Date.now()}_${p.id}`,
                date: newDate.toISOString(),
                title: `${team?.name} 傷癒歸隊`,
                content: `${p.name} 傷勢已無大礙，移出傷兵名單，目前在預備名單中。`,
                type: 'roster'
              });
              return { ...p, status: 'reserve', lastMovedDate: newDate.toISOString() };
            }
          }
          return p;
        });
      }

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

      if (player.lastMovedDate && !isSpringTraining(state.currentDate)) {
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

      if (coach.lastMovedDate && !isSpringTraining(state.currentDate)) {
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
