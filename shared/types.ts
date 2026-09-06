export interface User {
  id: string;
  deviceId: string;
  createdAt: string;
  lastActiveAt: string;
}

export interface WatchlistItem {
  id: string;
  userId: string;
  symbol: string;
  name: string;
  exchange: string;
  addedAt: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  lastUpdated: string;
  isStale: boolean;
  staleReason?: string;
  // Checkpoint metrics for "since you last checked"
  lastSeenPrice?: number;
  lastViewedAt?: string;
  sinceLastCheckedChange?: number;
  sinceLastCheckedChangePercent?: number;
}

export interface PriceSnapshot {
  id: string;
  symbol: string;
  price: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  timestamp: string;
  isCached?: boolean;
}

export interface UserSymbolCheckpoint {
  id: string;
  userId: string;
  symbol: string;
  lastViewedAt: string;
  lastSeenPrice: number;
  lastSeenVolume?: number;
}

export type MeaningfulChangeType = 
  | 'PRICE_SURGE' 
  | 'PRICE_DROP' 
  | 'VOLUME_SPIKE' 
  | 'MILESTONE_52W_HIGH' 
  | 'MILESTONE_52W_LOW' 
  | 'ROUND_NUMBER_BREAKOUT'
  | 'ROUND_NUMBER_BREAKDOWN'
  | 'TREND_REVERSAL';

export interface DigestItem {
  symbol: string;
  name: string;
  currentPrice: number;
  lastSeenPrice: number;
  priceDelta: number;
  priceDeltaPercent: number;
  dayChangePercent: number;
  lastViewedAt: string;
  lastUpdated: string;
  primaryReason: MeaningfulChangeType;
  reasons: MeaningfulChangeType[];
  explanation: string;
  magnitudeScore: number; // For ranking
  volumeRatio: number; // current volume / avg volume
  isStale: boolean;
}

export interface DigestResponse {
  userId: string;
  generatedAt: string;
  hasMeaningfulChanges: boolean;
  items: DigestItem[];
  totalWatched: number;
  summaryText: string;
}

export interface MarketHistoryPoint {
  timestamp: string;
  price: number;
  volume: number;
}

export interface SymbolDetailResponse {
  symbol: string;
  name: string;
  exchange: string;
  currentPrice: number;
  dayChange: number;
  dayChangePercent: number;
  volume: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  lastUpdated: string;
  isStale: boolean;
  staleReason?: string;
  lastSeenPrice?: number;
  lastViewedAt?: string;
  sinceLastCheckedChange?: number;
  sinceLastCheckedChangePercent?: number;
  explanation?: string;
  history: MarketHistoryPoint[];
  thresholds: {
    priceMoveThresholdPercent: number;
    volumeSpikeThresholdMultiplier: number;
  };
}

export interface SearchResultItem {
  symbol: string;
  name: string;
  exchange: string;
  type: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX';
  currentPrice: number;
  dayChangePercent: number;
}
