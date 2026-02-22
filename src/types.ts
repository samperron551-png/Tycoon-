export interface Generator {
  id: string;
  name: string;
  baseIncome: number;
  baseCost: number;
  level: number;
  unlocked: boolean;
  description: string;
  icon: string;
}

export interface Expansion {
  id: string;
  name: string;
  cost: number;
  unlocked: boolean;
  description: string;
}

export interface GameState {
  money: number;
  totalEarned: number;
  generators: Generator[];
  expansions: Expansion[];
  lastUpdate: number;
  prestigeLevel: number;
}

export interface LeaderboardEntry {
  username: string;
  totalEarned: number;
  prestigeLevel: number;
}

export type ServerMessage = 
  | { type: 'INIT'; state: GameState }
  | { type: 'LEADERBOARD_UPDATE'; leaderboard: LeaderboardEntry[] }
  | { type: 'ERROR'; message: string };

export type ClientMessage = 
  | { type: 'BUY_GENERATOR'; id: string }
  | { type: 'UPGRADE_GENERATOR'; id: string }
  | { type: 'BUY_EXPANSION'; id: string }
  | { type: 'PRESTIGE' }
  | { type: 'SYNC_STATE'; state: GameState };
