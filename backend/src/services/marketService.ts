import { db } from '../db/database.js';
import { PriceSnapshot, MarketHistoryPoint } from '../shared/types.js';
import { getSymbolMetadata, SYMBOL_DIRECTORY } from './marketDirectory.js';

interface CacheEntry {
  snapshot: PriceSnapshot;
  cachedAt: number;
}

const memoryCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 30 * 1000; // 30 seconds
const STALE_THRESHOLD_MS = 120 * 1000; // 2 minutes

// Polling interval tracking
let pollTimer: NodeJS.Timeout | null = null;
let isPolling = false;

// Provider API Key configuration
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY || '';
const TWELVE_DATA_API_KEY = process.env.TWELVE_DATA_API_KEY || '';

/**
 * Fetch latest snapshot with cache-first and provider fallback.
 * Ensures resilience: never fails abruptly; serves last-known database snapshot or resilient simulated tick if provider is down.
 */
export async function getLatestSnapshot(symbol: string): Promise<PriceSnapshot> {
  const sym = symbol.toUpperCase().trim();
  const now = Date.now();

  // 1. Check memory cache
  const cached = memoryCache.get(sym);
  if (cached && (now - cached.cachedAt) < CACHE_TTL_MS) {
    return cached.snapshot;
  }

  // 2. Try fetching from live provider if API key is present
  if (FINNHUB_API_KEY) {
    try {
      const liveData = await fetchFinnhubQuote(sym);
      if (liveData) {
        saveSnapshot(liveData);
        memoryCache.set(sym, { snapshot: liveData, cachedAt: now });
        return liveData;
      }
    } catch (err) {
      console.warn(`[MarketService] Finnhub fetch failed for ${sym}, falling back to DB/Engine:`, err);
    }
  }

  // 3. Fallback to latest stored database snapshot
  const dbRow = db.prepare(`
    SELECT * FROM price_snapshots 
    WHERE symbol = ? 
    ORDER BY timestamp DESC 
    LIMIT 1
  `).get(sym) as any;

  if (dbRow) {
    const snapshotAge = now - new Date(dbRow.timestamp).getTime();
    const isStale = snapshotAge > STALE_THRESHOLD_MS;

    const snapshot: PriceSnapshot = {
      id: dbRow.id,
      symbol: dbRow.symbol,
      price: dbRow.price,
      dayChange: dbRow.day_change,
      dayChangePercent: dbRow.day_change_percent,
      volume: dbRow.volume,
      avgVolume: dbRow.avg_volume,
      high52w: dbRow.high_52w,
      low52w: dbRow.low_52w,
      timestamp: dbRow.timestamp,
      isCached: isStale
    };

    memoryCache.set(sym, { snapshot, cachedAt: now });
    return snapshot;
  }

  // 4. If no previous snapshot exists, generate a baseline snapshot
  const metadata = getSymbolMetadata(sym);
  const newSnapshot: PriceSnapshot = {
    id: `snap_${sym}_${Date.now()}`,
    symbol: sym,
    price: metadata.basePrice,
    dayChange: 0,
    dayChangePercent: 0,
    volume: metadata.avgVolume,
    avgVolume: metadata.avgVolume,
    high52w: metadata.high52w,
    low52w: metadata.low52w,
    timestamp: new Date().toISOString(),
    isCached: false
  };

  saveSnapshot(newSnapshot);
  memoryCache.set(sym, { snapshot: newSnapshot, cachedAt: now });
  return newSnapshot;
}

/**
 * Save snapshot to database
 */
export function saveSnapshot(snapshot: PriceSnapshot) {
  try {
    db.prepare(`
      INSERT INTO price_snapshots (id, symbol, price, day_change, day_change_percent, volume, avg_volume, high_52w, low_52w, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      snapshot.id,
      snapshot.symbol,
      snapshot.price,
      snapshot.dayChange,
      snapshot.dayChangePercent,
      snapshot.volume,
      snapshot.avgVolume,
      snapshot.high52w,
      snapshot.low52w,
      snapshot.timestamp
    );
  } catch (err) {
    console.error(`[MarketService] Failed to persist snapshot for ${snapshot.symbol}:`, err);
  }
}

/**
 * Get historical price points for detail view chart
 */
export function getSymbolHistory(symbol: string): MarketHistoryPoint[] {
  const sym = symbol.toUpperCase().trim();
  const rows = db.prepare(`
    SELECT timestamp, price, volume 
    FROM price_snapshots 
    WHERE symbol = ? 
    ORDER BY timestamp ASC 
    LIMIT 100
  `).all(sym) as any[];

  if (rows.length > 0) {
    return rows.map(r => ({
      timestamp: r.timestamp,
      price: r.price,
      volume: r.volume
    }));
  }

  // Fallback synthetic history
  const meta = getSymbolMetadata(sym);
  const now = Date.now();
  const history: MarketHistoryPoint[] = [];
  for (let i = 24; i >= 0; i--) {
    const t = new Date(now - i * 3600 * 1000).toISOString();
    const drift = Math.sin(i / 2.5) * meta.volatility * 0.4;
    history.push({
      timestamp: t,
      price: Number((meta.basePrice * (1 + drift)).toFixed(2)),
      volume: Math.round(meta.avgVolume * (0.8 + Math.random() * 0.4))
    });
  }
  return history;
}

/**
 * Live Finnhub fetcher
 */
async function fetchFinnhubQuote(symbol: string): Promise<PriceSnapshot | null> {
  const res = await fetch(`https://finnhub.io/api/v1/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`);
  if (!res.ok) return null;
  const data = await res.json() as any;
  if (!data || data.c === 0 || data.c === undefined) return null;

  const metadata = getSymbolMetadata(symbol);
  const currentPrice = data.c;
  const prevClose = data.pc || currentPrice;
  const dayChange = Number((currentPrice - prevClose).toFixed(2));
  const dayChangePercent = Number((((currentPrice - prevClose) / prevClose) * 100).toFixed(2));

  return {
    id: `snap_${symbol}_${Date.now()}`,
    symbol,
    price: currentPrice,
    dayChange,
    dayChangePercent,
    volume: data.v || metadata.avgVolume,
    avgVolume: metadata.avgVolume,
    high52w: data.h ? Math.max(data.h, metadata.high52w) : metadata.high52w,
    low52w: data.l ? Math.min(data.l, metadata.low52w) : metadata.low52w,
    timestamp: new Date().toISOString(),
    isCached: false
  };
}

/**
 * Background Polling Service
 * Deduplicates symbols across all active users and polls efficiently.
 */
export function startMarketPollingService(intervalMs: number = 15000) {
  if (pollTimer) return;

  console.log(`⏱️ Market Polling Service started (Interval: ${intervalMs / 1000}s)`);

  const poll = async () => {
    if (isPolling) return;
    isPolling = true;

    try {
      // 1. Deduplicate watched symbols across all users
      const rows = db.prepare(`SELECT DISTINCT symbol FROM watchlist_items`).all() as { symbol: string }[];
      const symbolsToPoll = rows.map(r => r.symbol);

      // If empty, poll default major tickers
      if (symbolsToPoll.length === 0) {
        symbolsToPoll.push('NVDA', 'AAPL', 'TSLA', 'BTC-USD');
      }

      for (const sym of symbolsToPoll) {
        const metadata = getSymbolMetadata(sym);
        
        // Minor realistic market drift if no external API key
        if (!FINNHUB_API_KEY) {
          const current = await getLatestSnapshot(sym);
          const microDelta = (Math.random() - 0.48) * (metadata.basePrice * 0.003);
          const newPrice = Number(Math.max(1, current.price + microDelta).toFixed(2));
          const dayChange = Number((newPrice - (metadata.basePrice * 0.98)).toFixed(2));
          const dayChangePercent = Number(((dayChange / (metadata.basePrice * 0.98)) * 100).toFixed(2));

          const updatedSnapshot: PriceSnapshot = {
            id: `snap_${sym}_${Date.now()}`,
            symbol: sym,
            price: newPrice,
            dayChange,
            dayChangePercent,
            volume: current.volume + Math.floor(Math.random() * 5000),
            avgVolume: metadata.avgVolume,
            high52w: Math.max(metadata.high52w, newPrice),
            low52w: Math.min(metadata.low52w, newPrice),
            timestamp: new Date().toISOString(),
            isCached: false
          };

          saveSnapshot(updatedSnapshot);
          memoryCache.set(sym, { snapshot: updatedSnapshot, cachedAt: Date.now() });
        } else {
          await getLatestSnapshot(sym);
        }
      }
    } catch (err) {
      console.error('[MarketService] Polling cycle error:', err);
    } finally {
      isPolling = false;
    }
  };

  pollTimer = setInterval(poll, intervalMs);
}

export function stopMarketPollingService() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
