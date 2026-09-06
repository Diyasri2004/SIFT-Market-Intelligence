import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = path.resolve(process.cwd(), 'data.db');

export const db = new Database(DB_PATH);

// Enable foreign keys and WAL mode for high concurrency
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

export function initDatabase() {
  const schemaPath = path.resolve(__dirname, 'schema.sql');
  const schema = fs.readFileSync(schemaPath, 'utf8');
  db.exec(schema);
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
