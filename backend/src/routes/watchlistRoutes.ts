import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { getLatestSnapshot } from '../services/marketService.js';
import { getSymbolMetadata } from '../services/marketDirectory.js';
import { evaluateMeaningfulChange } from '../services/meaningfulLogic.js';
import { WatchlistItem, DigestItem, DigestResponse, UserSymbolCheckpoint } from '../shared/types.js';

export const watchlistRouter = Router();

// Helper to get or ensure user device
function getUserId(req: Request): string {
  const deviceId = (req.headers['x-device-id'] as string) || 'device_demo_browser_1';
  
  // Ensure user exists
  const existing = db.prepare(`SELECT id FROM users WHERE device_id = ?`).get(deviceId) as { id: string } | undefined;
  if (existing) {
    db.prepare(`UPDATE users SET last_active_at = datetime('now') WHERE id = ?`).run(existing.id);
    return existing.id;
  }

  const newId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  db.prepare(`
    INSERT INTO users (id, device_id, created_at, last_active_at)
    VALUES (?, ?, datetime('now'), datetime('now'))
  `).run(newId, deviceId);

  return newId;
}

/**
 * GET /api/watchlist - List all symbols watched by user with live data and checkpoint deltas
 */
watchlistRouter.get('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    const rows = db.prepare(`
      SELECT w.id, w.symbol, w.added_at,
             c.last_seen_price, c.last_viewed_at
      FROM watchlist_items w
      LEFT JOIN user_symbol_checkpoints c ON c.user_id = w.user_id AND c.symbol = w.symbol
      WHERE w.user_id = ?
      ORDER BY w.added_at DESC
    `).all(userId) as any[];

    const items: WatchlistItem[] = [];

    for (const row of rows) {
      const sym = row.symbol;
      const meta = getSymbolMetadata(sym);
      const snapshot = await getLatestSnapshot(sym);

      let sinceLastCheckedChange: number | undefined = undefined;
      let sinceLastCheckedChangePercent: number | undefined = undefined;

      if (row.last_seen_price !== null && row.last_seen_price !== undefined) {
        sinceLastCheckedChange = Number((snapshot.price - row.last_seen_price).toFixed(2));
        sinceLastCheckedChangePercent = row.last_seen_price > 0
          ? Number(((sinceLastCheckedChange / row.last_seen_price) * 100).toFixed(2))
          : 0;
      }

      items.push({
        id: row.id,
        userId,
        symbol: sym,
        name: meta.name,
        exchange: meta.exchange,
        addedAt: row.added_at,
        currentPrice: snapshot.price,
        dayChange: snapshot.dayChange,
        dayChangePercent: snapshot.dayChangePercent,
        volume: snapshot.volume,
        avgVolume: snapshot.avgVolume,
        high52w: snapshot.high52w,
        low52w: snapshot.low52w,
        lastUpdated: snapshot.timestamp,
        isStale: !!snapshot.isCached,
        staleReason: snapshot.isCached ? 'Serving cached provider data' : undefined,
        lastSeenPrice: row.last_seen_price ?? undefined,
        lastViewedAt: row.last_viewed_at ?? undefined,
        sinceLastCheckedChange,
        sinceLastCheckedChangePercent
      });
    }

    res.json({ success: true, items });
  } catch (err: any) {
    console.error('Error fetching watchlist:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/watchlist - Add symbol to watchlist
 */
watchlistRouter.post('/', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { symbol } = req.body;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({ success: false, error: 'Symbol is required' });
    }

    const cleanSymbol = symbol.toUpperCase().trim();
    const itemId = `wl_${userId}_${cleanSymbol}`;

    // Add to watchlist
    db.prepare(`
      INSERT OR IGNORE INTO watchlist_items (id, user_id, symbol, added_at)
      VALUES (?, ?, ?, datetime('now'))
    `).run(itemId, userId, cleanSymbol);

    // Fetch snapshot to initialize checkpoint
    const snapshot = await getLatestSnapshot(cleanSymbol);

    // Initial checkpoint
    db.prepare(`
      INSERT OR REPLACE INTO user_symbol_checkpoints (id, user_id, symbol, last_viewed_at, last_seen_price, last_seen_volume)
      VALUES (?, ?, ?, datetime('now'), ?, ?)
    `).run(`chk_${userId}_${cleanSymbol}`, userId, cleanSymbol, snapshot.price, snapshot.volume);

    res.json({
      success: true,
      message: `Added ${cleanSymbol} to watchlist`,
      symbol: cleanSymbol
    });
  } catch (err: any) {
    console.error('Error adding symbol to watchlist:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * DELETE /api/watchlist/:symbol - Remove symbol from watchlist
 */
watchlistRouter.delete('/:symbol', (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const symbol = req.params.symbol.toUpperCase().trim();

    db.prepare(`
      DELETE FROM watchlist_items 
      WHERE user_id = ? AND symbol = ?
    `).run(userId, symbol);

    res.json({ success: true, message: `Removed ${symbol} from watchlist` });
  } catch (err: any) {
    console.error('Error removing symbol:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/watchlist/digest - The Core Endpoint: Diffs current state vs. user checkpoint
 */
watchlistRouter.get('/digest', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);

    // Get all user's watched symbols and checkpoints
    const rows = db.prepare(`
      SELECT w.symbol,
             c.last_seen_price, c.last_viewed_at, c.last_seen_volume
      FROM watchlist_items w
      LEFT JOIN user_symbol_checkpoints c ON c.user_id = w.user_id AND c.symbol = w.symbol
      WHERE w.user_id = ?
    `).all(userId) as any[];

    const digestItems: DigestItem[] = [];

    for (const row of rows) {
      const sym = row.symbol;
      const snapshot = await getLatestSnapshot(sym);

      const checkpoint: UserSymbolCheckpoint | null = row.last_seen_price !== null ? {
        id: `chk_${userId}_${sym}`,
        userId,
        symbol: sym,
        lastViewedAt: row.last_viewed_at,
        lastSeenPrice: row.last_seen_price,
        lastSeenVolume: row.last_seen_volume
      } : null;

      const evalResult = evaluateMeaningfulChange(snapshot, checkpoint);
      if (evalResult) {
        digestItems.push(evalResult);
      }
    }

    // Rank by Magnitude Score (highest impact first)
    digestItems.sort((a, b) => b.magnitudeScore - a.magnitudeScore);

    const hasMeaningfulChanges = digestItems.length > 0;
    const summaryText = hasMeaningfulChanges
      ? `${digestItems.length} symbol${digestItems.length > 1 ? 's have' : ' has'} major moves since your last visit.`
      : 'No major moves since your last visit.';

    const response: DigestResponse = {
      userId,
      generatedAt: new Date().toISOString(),
      hasMeaningfulChanges,
      items: digestItems,
      totalWatched: rows.length,
      summaryText
    };

    res.json({ success: true, digest: response });
  } catch (err: any) {
    console.error('Error calculating watchlist digest:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/watchlist/:symbol/ack - Mark symbol as seen (updates user checkpoint)
 */
watchlistRouter.post('/:symbol/ack', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const symbol = req.params.symbol.toUpperCase().trim();

    const snapshot = await getLatestSnapshot(symbol);

    db.prepare(`
      INSERT OR REPLACE INTO user_symbol_checkpoints (id, user_id, symbol, last_viewed_at, last_seen_price, last_seen_volume)
      VALUES (?, ?, ?, datetime('now'), ?, ?)
    `).run(`chk_${userId}_${symbol}`, userId, symbol, snapshot.price, snapshot.volume);

    res.json({
      success: true,
      message: `Marked ${symbol} as seen at $${snapshot.price.toFixed(2)}`,
      checkpoint: {
        symbol,
        lastViewedAt: new Date().toISOString(),
        lastSeenPrice: snapshot.price
      }
    });
  } catch (err: any) {
    console.error('Error updating checkpoint:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * POST /api/watchlist/ack-all - Bulk acknowledge all current digest changes
 */
watchlistRouter.post('/ack-all', async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const rows = db.prepare(`SELECT symbol FROM watchlist_items WHERE user_id = ?`).all(userId) as { symbol: string }[];

    const updated: string[] = [];
    for (const r of rows) {
      const snapshot = await getLatestSnapshot(r.symbol);
      db.prepare(`
        INSERT OR REPLACE INTO user_symbol_checkpoints (id, user_id, symbol, last_viewed_at, last_seen_price, last_seen_volume)
        VALUES (?, ?, ?, datetime('now'), ?, ?)
      `).run(`chk_${userId}_${r.symbol}`, userId, r.symbol, snapshot.price, snapshot.volume);
      updated.push(r.symbol);
    }

    res.json({ success: true, message: `Acknowledged all ${updated.length} symbols`, updated });
  } catch (err: any) {
    console.error('Error ack-all:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});
