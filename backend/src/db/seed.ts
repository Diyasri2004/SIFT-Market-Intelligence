import { db, initDatabase } from './database.js';
import { SYMBOL_DIRECTORY } from '../services/marketDirectory.js';

export function seedData() {
  console.log('🌱 Initializing Database Schema...');
  initDatabase();

  console.log('🌱 Seeding Demo Users and Watchlists...');
  
  // Default Demo User
  const defaultUserId = 'user_demo_device_1';
  const defaultDeviceId = 'device_demo_browser_1';

  db.prepare(`
    INSERT OR REPLACE INTO users (id, device_id, created_at, last_active_at)
    VALUES (?, ?, datetime('now', '-7 days'), datetime('now'))
  `).run(defaultUserId, defaultDeviceId);

  // Watchlist items for demo user
  const demoSymbols = ['NVDA', 'AAPL', 'TSLA', 'BTC-USD', 'MSFT', 'PLTR'];
  
  const insertWatchlist = db.prepare(`
    INSERT OR REPLACE INTO watchlist_items (id, user_id, symbol, added_at)
    VALUES (?, ?, ?, datetime('now', '-3 days'))
  `);

  for (const sym of demoSymbols) {
    insertWatchlist.run(`wl_${defaultUserId}_${sym}`, defaultUserId, sym);
  }

  // Generate historical snapshots & current snapshots
  const insertSnapshot = db.prepare(`
    INSERT INTO price_snapshots (id, symbol, price, day_change, day_change_percent, volume, avg_volume, high_52w, low_52w, timestamp)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  // Clear older snapshots for a clean demo state
  db.prepare(`DELETE FROM price_snapshots`).run();

  const now = Date.now();

  for (const [sym, meta] of Object.entries(SYMBOL_DIRECTORY)) {
    // Generate 24 historical points for chart history (last 24 hours)
    for (let i = 24; i >= 1; i--) {
      const pointTime = new Date(now - i * 3600 * 1000).toISOString();
      const wave = Math.sin(i / 3) * meta.volatility * 0.5;
      const histPrice = Number((meta.basePrice * (1 + wave)).toFixed(2));
      const histVol = Number((meta.avgVolume * (0.8 + Math.random() * 0.4)).toFixed(0));
      
      insertSnapshot.run(
        `snap_${sym}_hist_${i}`,
        sym,
        histPrice,
        Number((histPrice - meta.basePrice).toFixed(2)),
        Number((((histPrice - meta.basePrice) / meta.basePrice) * 100).toFixed(2)),
        histVol,
        meta.avgVolume,
        meta.high52w,
        meta.low52w,
        pointTime
      );
    }

    // Current latest snapshot with tailored scenarios:
    // NVDA: Price surge + volume spike
    // AAPL: Round number breakout ($228 from $220)
    // TSLA: Price drop / volatility
    // BTC-USD: Volatility spike
    // MSFT: Flat (no meaningful change, stays in full list only)
    let currentPrice = meta.basePrice;
    let volumeMultiplier = 1.1;
    let dayChangePct = 0.5;

    if (sym === 'NVDA') {
      currentPrice = 128.40; // Surged from 120
      volumeMultiplier = 2.4; // Huge volume spike
      dayChangePct = 4.8;
    } else if (sym === 'AAPL') {
      currentPrice = 230.15; // Crossing 230
      volumeMultiplier = 1.6;
      dayChangePct = 2.3;
    } else if (sym === 'TSLA') {
      currentPrice = 210.50; // Dropped from 222
      volumeMultiplier = 1.7;
      dayChangePct = -3.4;
    } else if (sym === 'PLTR') {
      currentPrice = 33.90; // Near 52-week high (34.20)
      volumeMultiplier = 2.1;
      dayChangePct = 5.2;
    } else if (sym === 'MSFT') {
      currentPrice = 422.50; // Quiet, flat
      volumeMultiplier = 0.95;
      dayChangePct = 0.15;
    } else if (sym === 'BTC-USD') {
      currentPrice = 64200.00;
      volumeMultiplier = 1.8;
      dayChangePct = 3.6;
    }

    const dayChange = Number((currentPrice * (dayChangePct / 100)).toFixed(2));
    const volume = Math.round(meta.avgVolume * volumeMultiplier);

    insertSnapshot.run(
      `snap_${sym}_latest`,
      sym,
      currentPrice,
      dayChange,
      dayChangePct,
      volume,
      meta.avgVolume,
      meta.high52w,
      meta.low52w,
      new Date().toISOString()
    );
  }

  // Checkpoints: Simulating that user last checked 4 hours ago
  // NVDA was seen at $121.20 (now 128.40 -> +5.9% move!)
  // AAPL was seen at $224.50 (now 230.15 -> +2.5% move + crossed $230)
  // TSLA was seen at $219.00 (now 210.50 -> -3.9% drop)
  // PLTR was seen at $31.80 (now 33.90 -> +6.6% + 52w high break)
  // MSFT was seen at $421.80 (now 422.50 -> +0.16% flat -> NOT in digest!)
  // BTC-USD was seen at $61800.00 (now 64200 -> +3.9%)

  const insertCheckpoint = db.prepare(`
    INSERT OR REPLACE INTO user_symbol_checkpoints (id, user_id, symbol, last_viewed_at, last_seen_price, last_seen_volume)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const checkpointTime = new Date(now - 4 * 3600 * 1000).toISOString();

  insertCheckpoint.run(`chk_${defaultUserId}_NVDA`, defaultUserId, 'NVDA', checkpointTime, 121.20, 45000000);
  insertCheckpoint.run(`chk_${defaultUserId}_AAPL`, defaultUserId, 'AAPL', checkpointTime, 224.50, 30000000);
  insertCheckpoint.run(`chk_${defaultUserId}_TSLA`, defaultUserId, 'TSLA', checkpointTime, 219.00, 40000000);
  insertCheckpoint.run(`chk_${defaultUserId}_PLTR`, defaultUserId, 'PLTR', checkpointTime, 31.80, 25000000);
  insertCheckpoint.run(`chk_${defaultUserId}_MSFT`, defaultUserId, 'MSFT', checkpointTime, 421.80, 20000000);
  insertCheckpoint.run(`chk_${defaultUserId}_BTC-USD`, defaultUserId, 'BTC-USD', checkpointTime, 61800.00, 20000000000);

  console.log('✅ Seeding complete: Demo user, watchlists, snapshots, and checkpoint diffs created.');
}

// Allow direct execution: `tsx src/db/seed.ts`
if (process.argv[1]?.endsWith('seed.ts') || process.argv[1]?.endsWith('seed.js')) {
  seedData();
}
