-- Schema for Smart Market Watchlist
-- Supporting users, watchlist_items, price_snapshots, and user_symbol_checkpoints

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

-- Checkpoint table: enables "what changed since you last checked"
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

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_watchlist_user_symbol ON watchlist_items(user_id, symbol);
CREATE INDEX IF NOT EXISTS idx_price_snapshots_symbol_time ON price_snapshots(symbol, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_checkpoints_user_symbol ON user_symbol_checkpoints(user_id, symbol);
