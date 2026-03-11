export type League = 'R+' | 'P1';

export type StadiumType = 'dome' | 'outdoor' | 'retractable';

export interface Stadium {
  name: string;
  capacity: number;
  type: StadiumType;
  weatherImpact: number; // 0 to 1
}

export interface Team {
  id: string;
  name: string;
  city: string;
  state: string;
  league: League;
  logoColor: string;
  stadium: Stadium;
}

export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'CF' | 'RF';

export interface Player {
  id: string;
  teamId: string;
  name: string;
  position: Position;
  isForeign: boolean;
  age: number;
  stats: {
    contact: number;
    power: number;
    speed: number;
    fielding: number;
    pitching?: {
      velocity: number;
      control: number;
      stamina: number;
      breaking: number;
    };
  };
  seasonStats?: {
    gamesPlayed: number;
    atBats: number;
    hits: number;
    homeRuns: number;
    rbi: number;
    stolenBases: number;
    inningsPitched: number;
    earnedRuns: number;
    strikeouts: number;
    wins: number;
    losses: number;
    saves: number;
  };
  status: 'active' | 'reserve' | 'injured';
  lastMovedDate?: string;
}

export type GameStatus = 'scheduled' | 'in_progress' | 'finished' | 'cancelled';

export type WeatherCondition = 'sunny' | 'cloudy' | 'rainy' | 'windy';

export type CoachRole = 'Manager' | 'Pitching' | 'Hitting' | 'Fielding';

export interface Coach {
  id: string;
  teamId: string;
  name: string;
  role: CoachRole;
  status: 'active' | 'reserve';
  lastMovedDate?: string;
  boosts: {
    contact: number;
    power: number;
    pitching: number;
    fielding: number;
  };
}

export interface Game {
  id: string;
  date: string; // ISO string
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  status: GameStatus;
  league: League | 'Interleague' | 'AllStar' | 'Postseason' | 'WinterBanana' | 'SpringTraining';
  type: 'regular' | 'all-star' | 'postseason' | 'winter' | 'spring';
  attendance?: number;
  location?: string;
  weather?: WeatherCondition;
  winningPitcherId?: string;
  losingPitcherId?: string;
  mvpId?: string;
  boxScore?: {
    home: number[];
    away: number[];
  };
}

export interface StandingsRecord {
  teamId: string;
  wins: number;
  losses: number;
  ties: number;
  gamesPlayed: number;
  winPercentage: number;
  runsScored: number;
  runsAllowed: number;
}

export interface NewsItem {
  id: string;
  date: string;
  title: string;
  content: string;
  type: 'game' | 'roster' | 'league';
}
