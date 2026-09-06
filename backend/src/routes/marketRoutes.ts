import { Router, Request, Response } from 'express';
import { db } from '../db/database.js';
import { getLatestSnapshot, getSymbolHistory } from '../services/marketService.js';
import { getSymbolMetadata, searchSymbols } from '../services/marketDirectory.js';
import { evaluateMeaningfulChange, DEFAULT_CONFIG } from '../services/meaningfulLogic.js';
import { SymbolDetailResponse, UserSymbolCheckpoint } from '../../../shared/types.js';

export const marketRouter = Router();

/**
 * GET /api/market/search?q=...
 */
marketRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const query = (req.query.q as string) || '';
    const rawResults = searchSymbols(query);

    const results = await Promise.all(
      rawResults.map(async (meta) => {
        const snapshot = await getLatestSnapshot(meta.symbol);
        return {
          symbol: meta.symbol,
          name: meta.name,
          exchange: meta.exchange,
          type: meta.type,
          currentPrice: snapshot.price,
          dayChangePercent: snapshot.dayChangePercent
        };
      })
    );

    res.json({ success: true, results });
  } catch (err: any) {
    console.error('Search error:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});

/**
 * GET /api/market/:symbol - Detailed view with history, explanation, checkpoint diff
 */
marketRouter.get('/:symbol', async (req: Request, res: Response) => {
  try {
    const symbol = req.params.symbol.toUpperCase().trim();
    const deviceId = (req.headers['x-device-id'] as string) || 'device_demo_browser_1';

    const user = db.prepare(`SELECT id FROM users WHERE device_id = ?`).get(deviceId) as { id: string } | undefined;
    const userId = user ? user.id : 'user_demo_device_1';

    const metadata = getSymbolMetadata(symbol);
    const snapshot = await getLatestSnapshot(symbol);
    const history = getSymbolHistory(symbol);

    // Get checkpoint if available
    const chkRow = db.prepare(`
      SELECT last_seen_price, last_viewed_at, last_seen_volume 
      FROM user_symbol_checkpoints 
      WHERE user_id = ? AND symbol = ?
    `).get(userId, symbol) as any;

    let sinceLastCheckedChange: number | undefined = undefined;
    let sinceLastCheckedChangePercent: number | undefined = undefined;
    let explanation: string | undefined = undefined;

    let checkpoint: UserSymbolCheckpoint | null = null;
    if (chkRow && chkRow.last_seen_price !== null) {
      sinceLastCheckedChange = Number((snapshot.price - chkRow.last_seen_price).toFixed(2));
      sinceLastCheckedChangePercent = chkRow.last_seen_price > 0
        ? Number(((sinceLastCheckedChange / chkRow.last_seen_price) * 100).toFixed(2))
        : 0;

      checkpoint = {
        id: `chk_${userId}_${symbol}`,
        userId,
        symbol,
        lastViewedAt: chkRow.last_viewed_at,
        lastSeenPrice: chkRow.last_seen_price,
        lastSeenVolume: chkRow.last_seen_volume
      };

      const digestEval = evaluateMeaningfulChange(snapshot, checkpoint);
      if (digestEval) {
        explanation = digestEval.explanation;
      }
    }

    if (!explanation) {
      explanation = `Trading at $${snapshot.price.toFixed(2)}, ${snapshot.dayChangePercent >= 0 ? 'up' : 'down'} ${Math.abs(snapshot.dayChangePercent).toFixed(1)}% today.`;
    }

    const detail: SymbolDetailResponse = {
      symbol,
      name: metadata.name,
      exchange: metadata.exchange,
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
      lastSeenPrice: chkRow?.last_seen_price ?? undefined,
      lastViewedAt: chkRow?.last_viewed_at ?? undefined,
      sinceLastCheckedChange,
      sinceLastCheckedChangePercent,
      explanation,
      history,
      thresholds: {
        priceMoveThresholdPercent: DEFAULT_CONFIG.priceMoveThresholdPercent,
        volumeSpikeThresholdMultiplier: DEFAULT_CONFIG.volumeSpikeMultiplier
      }
    };

    res.json({ success: true, symbol: detail });
  } catch (err: any) {
    console.error('Error fetching symbol details:', err);
    res.status(500).json({ success: false, error: err.message || 'Internal server error' });
  }
});
