import { Player, Position, Team, Game, League, Coach, CoachRole } from '../types';
import { addDays, format, parseISO, startOfWeek, isSameWeek, addWeeks, getMonth, getDate, getDay } from 'date-fns';

export const STATES = [
  { name: '旭日州', cities: ['陽明市', '晨曦市', '朝陽市', '曙光市'] },
  { name: '蒼海州', cities: ['碧波市', '觀海市', '潮汐市', '珊瑚市', '海神市'] },
  { name: '翠谷州', cities: ['綠林市', '幽谷市', '豐收市', '芳草市'] },
  { name: '鐵峰州', cities: ['礦岩市', '巨石市', '鋼鐵市', '鎔爐市'] },
  { name: '星辰州', cities: ['觀星市', '銀河市', '隕石市', '穹蒼市', '宇航市'] },
  { name: '雲霧州', cities: ['迷霧市', '雲海市', '飄渺市', '飛雲市'] },
  { name: '烈陽州', cities: ['炎夏市', '驕陽市', '旱地市', '綠洲市'] },
  { name: '繁花州', cities: ['百花市', '櫻舞市', '玫瑰市', '牡丹市', '蘭馨市'] }
];

export const TEAMS: Team[] = [
  // R+ League
  { id: 'T1', name: '陽明金烏', city: '陽明市', state: '旭日州', league: 'R+', logoColor: '#F59E0B', stadium: { name: '陽明市立棒球場', capacity: 20000, type: 'outdoor', weatherImpact: 0.8 } },
  { id: 'T2', name: '碧波海神', city: '碧波市', state: '蒼海州', league: 'R+', logoColor: '#3B82F6', stadium: { name: '碧波海灣球場', capacity: 18000, type: 'outdoor', weatherImpact: 1.0 } },
  { id: 'T3', name: '綠林遊俠', city: '綠林市', state: '翠谷州', league: 'R+', logoColor: '#10B981', stadium: { name: '綠林生態巨蛋', capacity: 35000, type: 'dome', weatherImpact: 0 } },
  { id: 'T4', name: '鋼鐵巨獸', city: '鋼鐵市', state: '鐵峰州', league: 'R+', logoColor: '#6B7280', stadium: { name: '鋼鐵工業球場', capacity: 25000, type: 'retractable', weatherImpact: 0.3 } },
  { id: 'T5', name: '觀星彗星', city: '觀星市', state: '星辰州', league: 'R+', logoColor: '#8B5CF6', stadium: { name: '觀星天文台球場', capacity: 22000, type: 'outdoor', weatherImpact: 0.7 } },
  { id: 'T6', name: '迷霧幻影', city: '迷霧市', state: '雲霧州', league: 'R+', logoColor: '#9CA3AF', stadium: { name: '迷霧山谷球場', capacity: 15000, type: 'outdoor', weatherImpact: 0.9 } },
  // P1 League
  { id: 'T7', name: '炎夏火鳥', city: '炎夏市', state: '烈陽州', league: 'P1', logoColor: '#EF4444', stadium: { name: '炎夏熱浪球場', capacity: 28000, type: 'outdoor', weatherImpact: 0.8 } },
  { id: 'T8', name: '百花蜜蜂', city: '百花市', state: '繁花州', league: 'P1', logoColor: '#FCD34D', stadium: { name: '百花花園球場', capacity: 16000, type: 'outdoor', weatherImpact: 0.6 } },
  { id: 'T9', name: '晨曦曙光', city: '晨曦市', state: '旭日州', league: 'P1', logoColor: '#F97316', stadium: { name: '晨曦巨蛋', capacity: 40000, type: 'dome', weatherImpact: 0 } },
  { id: 'T10', name: '觀海巨浪', city: '觀海市', state: '蒼海州', league: 'P1', logoColor: '#06B6D4', stadium: { name: '觀海海溝球場', capacity: 24000, type: 'retractable', weatherImpact: 0.2 } },
  { id: 'T11', name: '巨石泰坦', city: '巨石市', state: '鐵峰州', league: 'P1', logoColor: '#78716C', stadium: { name: '巨石神殿球場', capacity: 30000, type: 'outdoor', weatherImpact: 0.5 } },
  { id: 'T12', name: '銀河星塵', city: '銀河市', state: '星辰州', league: 'P1', logoColor: '#D946EF', stadium: { name: '銀河星際球場', capacity: 19000, type: 'outdoor', weatherImpact: 0.7 } }
];

const FIRST_NAMES = ['家豪', '志明', '俊傑', '建宏', '俊宏', '志偉', '建良', '冠宇', '柏翰', '承恩', '宇軒', '子睿', '品睿', '宥廷', '柏宇', '柏睿', '子翔', '宥辰', '冠廷', '子豪', '奕辰', '宥嘉', '品宇', '恩宇', '子軒', '柏霖', '宥翔', '品翔', '宥宇', '子宸', '宇翔', '宥霖', '柏翔', '品豪', '宥恩', '子恩', '宇恩', '宥豪', '柏恩', '品恩', '宥軒', '子宇', '宇宸', '宥宸', '柏宸', '品宸', '宥睿', '子睿', '宇睿', '宥睿', '柏睿', '品睿'];
const LAST_NAMES = ['陳', '林', '黃', '張', '李', '王', '吳', '劉', '蔡', '楊', '許', '鄭', '謝', '洪', '郭', '邱', '曾', '廖', '賴', '徐', '周', '葉', '蘇', '莊', '呂', '江', '何', '蕭', '羅', '高', '潘', '簡', '朱', '鍾', '彭', '游', '詹', '胡', '施', '沈', '余', '盧', '梁', '顏', '柯', '孫', '魏', '翁', '戴', '范', '宋', '方', '鄧', '杜', '傅', '侯', '曹', '薛', '丁', '卓', '馬', '董', '唐', '藍'];
const FOREIGN_NAMES = ['史密斯', '強森', '威廉斯', '布朗', '瓊斯', '米勒', '戴維斯', '加西亞', '羅德里格斯', '威爾遜', '馬丁內斯', '安德森', '泰勒', '托馬斯', '埃爾南德斯', '摩爾', '馬丁', '傑克遜', '湯普森', '懷特', '洛佩斯', '李', '岡薩雷斯', '哈里斯', '克拉克', '劉易斯', '羅賓遜', '沃克', '佩雷斯', '霍爾', '楊', '艾倫', '桑切斯', '賴特', '金', '斯科特', '格林', '貝克', '亞當斯', '尼爾森', '希爾', '拉米雷斯', '坎貝爾', '米切爾', '羅伯茨', '卡特', '菲利普斯', '埃文斯', '特納', '托雷斯', '帕克', '柯林斯', '愛德華茲', '斯圖爾特', '弗洛雷斯', '莫里斯', '阮', '墨菲', '里維拉', '庫克', '羅傑斯', '摩根', '彼得森', '庫珀', '里德', '貝利', '貝爾', '戈麥斯', '凱利', '霍華德', '沃德', '考克斯', '迪亞斯', '理查森', '伍德', '沃森', '布魯克斯', '貝內特', '格雷', '詹姆斯', '雷耶斯', '克魯茲', '休斯', '普萊斯', '邁爾斯', '隆', '福斯特', '桑德斯', '羅斯', '莫拉萊斯', '鮑威爾', '沙利文', '拉塞爾', '奧爾蒂斯', '詹金斯', '古鐵雷斯', '佩里', '巴特勒', '巴恩斯', '費舍爾'];

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generatePlayers(): Player[] {
  const players: Player[] = [];
  let playerId = 1;

  TEAMS.forEach(team => {
    // Generate 60 players per team
    // 28 active, 32 reserve
    // 4 foreign players (max 3 active)
    
    // Position distribution:
    // P: 25, C: 6, 1B: 4, 2B: 4, 3B: 4, SS: 4, LF: 4, CF: 4, RF: 5
    const positions: Position[] = [
      ...Array(25).fill('P'),
      ...Array(6).fill('C'),
      ...Array(4).fill('1B'),
      ...Array(4).fill('2B'),
      ...Array(4).fill('3B'),
      ...Array(4).fill('SS'),
      ...Array(4).fill('LF'),
      ...Array(4).fill('CF'),
      ...Array(5).fill('RF')
    ];

    let foreignCount = 0;

    positions.forEach((pos, index) => {
      const isForeign = foreignCount < 4 && randomInt(1, 10) > 8;
      if (isForeign) foreignCount++;

      const name = isForeign 
        ? FOREIGN_NAMES[randomInt(0, FOREIGN_NAMES.length - 1)]
        : LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)] + FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];

      const isPitcher = pos === 'P';
      
      const p: Player = {
        id: `P${playerId++}`,
        teamId: team.id,
        name,
        position: pos,
        isForeign,
        age: randomInt(18, 38),
        status: index < 28 ? 'active' : 'reserve', // First 28 are active
        stats: {
          contact: randomInt(30, 99),
          power: randomInt(30, 99),
          speed: randomInt(30, 99),
          fielding: randomInt(40, 99),
          ...(isPitcher ? {
            pitching: {
              velocity: randomInt(130, 160),
              control: randomInt(40, 99),
              stamina: randomInt(40, 99),
              breaking: randomInt(40, 99)
            }
          } : {})
        },
        seasonStats: {
          gamesPlayed: 0,
          atBats: 0,
          hits: 0,
          homeRuns: 0,
          rbi: 0,
          stolenBases: 0,
          inningsPitched: 0,
          earnedRuns: 0,
          strikeouts: 0,
          wins: 0,
          losses: 0,
          saves: 0
        }
      };
      
      players.push(p);
    });
  });

  return players;
}

export function generateCoaches(): Coach[] {
  const coaches: Coach[] = [];
  let coachId = 1;

  TEAMS.forEach(team => {
    const roles: CoachRole[] = ['Manager', 'Pitching', 'Hitting', 'Fielding'];
    
    // 1軍教練
    roles.forEach(role => {
      coaches.push({
        id: `C${coachId++}`,
        teamId: team.id,
        name: LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)] + FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)],
        role,
        status: 'active',
        boosts: {
          contact: role === 'Hitting' || role === 'Manager' ? randomInt(1, 5) : 0,
          power: role === 'Hitting' || role === 'Manager' ? randomInt(1, 5) : 0,
          pitching: role === 'Pitching' || role === 'Manager' ? randomInt(1, 5) : 0,
          fielding: role === 'Fielding' || role === 'Manager' ? randomInt(1, 5) : 0,
        }
      });
    });

    // 2軍教練
    roles.forEach(role => {
      coaches.push({
        id: `C${coachId++}`,
        teamId: team.id,
        name: LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)] + FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)],
        role,
        status: 'reserve',
        boosts: {
          contact: role === 'Hitting' || role === 'Manager' ? randomInt(1, 3) : 0,
          power: role === 'Hitting' || role === 'Manager' ? randomInt(1, 3) : 0,
          pitching: role === 'Pitching' || role === 'Manager' ? randomInt(1, 3) : 0,
          fielding: role === 'Fielding' || role === 'Manager' ? randomInt(1, 3) : 0,
        }
      });
    });
  });

  return coaches;
}

function getMatchups(teams: Team[], seriesIndex: number): [Team, Team][] {
  const round = seriesIndex % 5;
  const t = teams;
  const rounds = [
    [[t[0], t[5]], [t[1], t[4]], [t[2], t[3]]],
    [[t[4], t[0]], [t[5], t[2]], [t[3], t[1]]],
    [[t[0], t[3]], [t[4], t[5]], [t[1], t[2]]],
    [[t[2], t[0]], [t[3], t[4]], [t[5], t[1]]],
    [[t[0], t[1]], [t[2], t[4]], [t[5], t[3]]]
  ];
  const swap = Math.floor(seriesIndex / 5) % 2 === 1;
  return rounds[round].map(([h, a]) => swap ? [a, h] : [h, a]) as [Team, Team][];
}

function getInterleagueMatchups(rTeams: Team[], pTeams: Team[], seriesIndex: number): [Team, Team][] {
  const round = seriesIndex % 6;
  const matchups: [Team, Team][] = [];
  for (let i = 0; i < 6; i++) {
    const rTeam = rTeams[i];
    const pTeam = pTeams[(i + round) % 6];
    if ((seriesIndex + i) % 2 === 0) {
      matchups.push([rTeam, pTeam]);
    } else {
      matchups.push([pTeam, rTeam]);
    }
  }
  return matchups;
}

export function generateSchedule(year: number): Game[] {
  const games: Game[] = [];
  let gameId = 1;

  const rLeague = TEAMS.filter(t => t.league === 'R+');
  const pLeague = TEAMS.filter(t => t.league === 'P1');

  const addGame = (date: Date, home: Team | {id: string}, away: Team | {id: string}, league: string, type: string) => {
    const day = date.getDay();
    // Weekday (1-5) 18:00, Weekend (0, 6) 16:00
    const hour = (day === 0 || day === 6) ? 16 : 18;
    const gameDate = new Date(date);
    gameDate.setHours(hour, 0, 0, 0);

    games.push({
      id: `G${year}_${gameId++}`,
      date: gameDate.toISOString(),
      homeTeamId: home.id,
      awayTeamId: away.id,
      homeScore: 0,
      awayScore: 0,
      status: 'scheduled',
      league: league as any,
      type: type as any
    });
  };

  function getDatesBetween(startDate: Date, endDate: Date, allowedDaysOfWeek?: number[]): Date[] {
    const dates: Date[] = [];
    let current = new Date(startDate);
    while (current <= endDate) {
      if (!allowedDaysOfWeek || allowedDaysOfWeek.includes(current.getDay())) {
        dates.push(new Date(current));
      }
      current = addDays(current, 1);
    }
    return dates;
  }

  // 1. Spring Training: March 5 ~ March 22, every Tue(2), Thu(4), Sat(6)
  const springDates = getDatesBetween(new Date(year, 2, 5), new Date(year, 2, 22), [2, 4, 6]);
  springDates.forEach(date => {
    for(let i=0; i<6; i++) {
      addGame(date, TEAMS[i], TEAMS[11-i], 'SpringTraining', 'spring');
    }
  });

  // 2. Regular Season (intra-league): April 1 ~ June 30
  const regularDates1 = getDatesBetween(new Date(year, 3, 1), new Date(year, 5, 30), [2, 3, 5, 6, 0]);
  let seriesCounter = 0;
  regularDates1.forEach(date => {
    const matchups = [...getMatchups(rLeague, seriesCounter), ...getMatchups(pLeague, seriesCounter)];
    matchups.forEach(([home, away]) => {
      addGame(date, home, away, home.league, 'regular');
    });
    seriesCounter++;
  });

  // 3. Regular Season (inter-league): July 15 ~ Sept 15
  const regularDates2 = getDatesBetween(new Date(year, 6, 15), new Date(year, 8, 15), [2, 3, 5, 6, 0]);
  let interleagueSeriesCounter = 0;
  regularDates2.forEach(date => {
    const matchups = getInterleagueMatchups(rLeague, pLeague, interleagueSeriesCounter);
    matchups.forEach(([home, away]) => {
      addGame(date, home, away, 'Interleague', 'regular');
    });
    interleagueSeriesCounter++;
  });

  // 4. Postseason: Sept 25 starts.
  // Round 1: 3rd vs 2nd (Best of 5)
  const r1Dates = [
    new Date(year, 8, 25), new Date(year, 8, 26), new Date(year, 8, 28), new Date(year, 8, 29), new Date(year, 8, 30)
  ];
  r1Dates.forEach((date, i) => {
    const isHigherSeedHome = [0, 1, 4].includes(i);
    addGame(date, {id: isHigherSeedHome ? 'R_SEED2' : 'R_SEED3'}, {id: isHigherSeedHome ? 'R_SEED3' : 'R_SEED2'}, 'Postseason', 'postseason');
    addGame(date, {id: isHigherSeedHome ? 'P_SEED2' : 'P_SEED3'}, {id: isHigherSeedHome ? 'P_SEED3' : 'P_SEED2'}, 'Postseason', 'postseason');
  });

  // Round 2: Winner vs 1st (Best of 7)
  const r2Dates = [
    new Date(year, 9, 5), new Date(year, 9, 6), new Date(year, 9, 8), new Date(year, 9, 9), new Date(year, 9, 10), new Date(year, 9, 12), new Date(year, 9, 13)
  ];
  r2Dates.forEach((date, i) => {
    const isHigherSeedHome = [0, 1, 5, 6].includes(i);
    addGame(date, {id: isHigherSeedHome ? 'R_SEED1' : 'R_WINNER_R1'}, {id: isHigherSeedHome ? 'R_WINNER_R1' : 'R_SEED1'}, 'Postseason', 'postseason');
    addGame(date, {id: isHigherSeedHome ? 'P_SEED1' : 'P_WINNER_R1'}, {id: isHigherSeedHome ? 'P_WINNER_R1' : 'P_SEED1'}, 'Postseason', 'postseason');
  });

  // 5. EVFPBL Glory One: 1 week after Postseason ends.
  const gloryOneDates = [
    new Date(year, 9, 20), new Date(year, 9, 21), new Date(year, 9, 23), new Date(year, 9, 24), new Date(year, 9, 25), new Date(year, 9, 27), new Date(year, 9, 28)
  ];
  gloryOneDates.forEach((date, i) => {
    const isRHome = [0, 1, 5, 6].includes(i);
    addGame(date, {id: isRHome ? 'R_CHAMP' : 'P_CHAMP'}, {id: isRHome ? 'P_CHAMP' : 'R_CHAMP'}, 'GloryOne', 'glory-one');
  });

  // 6. Winter Banana League: Nov 10 ~ Dec 15
  const winterDates = getDatesBetween(new Date(year, 10, 10), new Date(year, 11, 15), [2, 4, 6, 0]);
  winterDates.forEach(date => {
    for(let i=1; i<=3; i++) {
      addGame(date, {id: `WB_TEAM${i}`}, {id: `WB_TEAM${7-i}`}, 'WinterBanana', 'winter');
    }
  });

  return games;
}
