import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data.db');

export const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Schema inlined — tsc does not copy .sql assets to dist/
const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    device_id TEXT NOT NULL UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS watchlist_items (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, symbol)
);

CREATE TABLE IF NOT EXISTS price_snapshots (
    id TEXT PRIMARY KEY,
    symbol TEXT NOT NULL,
    price REAL NOT NULL,
    day_change REAL NOT NULL,
    day_change_percent REAL NOT NULL,
    volume REAL NOT NULL,
    avg_volume REAL NOT NULL,
    high_52w REAL NOT NULL,
    low_52w REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_symbol_checkpoints (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    symbol TEXT NOT NULL,
    last_viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_seen_price REAL NOT NULL,
    last_seen_volume REAL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE(user_id, symbol)
);

CREATE INDEX IF NOT EXISTS idx_watchlist_user_symbol ON watchlist_items(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol_time ON price_snapshots(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checkpoints_user_symbol ON user_symbol_checkpoints(user_id, symbol);
`;

export function initDatabase() {
  db.exec(SCHEMA);
}

export interface UserRow {
  id: string;
  device_id: string;
  created_at: string;
  last_active_at: string;
}

export interface WatchlistRow {
  id: string;
  user_id: string;
  symbol: string;
  added_at: string;
}

export interface SnapshotRow {
  id: string;
  symbol: string;
  price: number;
  day_change: number;
  day_change_percent: number;
  volume: number;
  avg_volume: number;
  high_52w: number;
  low_52w: number;
  timestamp: string;
}

export interface CheckpointRow {
  id: string;
  user_id: string;
  symbol: string;
  last_viewed_at: string;
  last_seen_price: number;
  last_seen_volume: number;
}
