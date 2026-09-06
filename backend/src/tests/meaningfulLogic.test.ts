import test from 'node:test';
import assert from 'node:assert';
import { evaluateMeaningfulChange, DEFAULT_CONFIG } from '../services/meaningfulLogic.js';
import { PriceSnapshot, UserSymbolCheckpoint } from '../shared/types.js';

test('Diff Logic: triggers PRICE_SURGE when price increases >= 2%', () => {
  const snapshot: PriceSnapshot = {
    id: 's1',
    symbol: 'NVDA',
    price: 130.0,
    dayChange: 5.0,
    dayChangePercent: 4.0,
    volume: 50000000,
    avgVolume: 50000000,
    high52w: 150.0,
    low52w: 50.0,
    timestamp: new Date().toISOString()
  };

  const checkpoint: UserSymbolCheckpoint = {
    id: 'c1',
    userId: 'u1',
    symbol: 'NVDA',
    lastViewedAt: new Date(Date.now() - 3600000).toISOString(),
    lastSeenPrice: 125.0 // +4.0% move
  };

  const result = evaluateMeaningfulChange(snapshot, checkpoint, DEFAULT_CONFIG);
  assert.ok(result !== null);
  assert.strictEqual(result.symbol, 'NVDA');
  assert.ok(result.reasons.includes('PRICE_SURGE'));
  assert.ok(result.priceDeltaPercent >= 4.0);
  assert.ok(result.explanation.includes('Up +4.0%'));
});

test('Diff Logic: triggers VOLUME_SPIKE when volume >= 1.5x average', () => {
  const snapshot: PriceSnapshot = {
    id: 's2',
    symbol: 'AAPL',
    price: 202.5,
    dayChange: 0.5,
    dayChangePercent: 0.25, // Less than 2% price move, not crossing round number
    volume: 90000000,       // 1.8x average
    avgVolume: 50000000,
    high52w: 230.0,
    low52w: 160.0,
    timestamp: new Date().toISOString()
  };

  const checkpoint: UserSymbolCheckpoint = {
    id: 'c2',
    userId: 'u1',
    symbol: 'AAPL',
    lastViewedAt: new Date(Date.now() - 3600000).toISOString(),
    lastSeenPrice: 202.0 // +0.25% move
  };

  const result = evaluateMeaningfulChange(snapshot, checkpoint, DEFAULT_CONFIG);
  assert.ok(result !== null);
  assert.ok(result.reasons.includes('VOLUME_SPIKE'));
  assert.strictEqual(result.primaryReason, 'VOLUME_SPIKE');
  assert.ok(result.explanation.includes('volume surge') || result.explanation.includes('above avg'));
});

test('Diff Logic: returns null when changes are below threshold (quiet)', () => {
  const snapshot: PriceSnapshot = {
    id: 's3',
    symbol: 'MSFT',
    price: 421.50,
    dayChange: 0.5,
    dayChangePercent: 0.12,
    volume: 21000000,
    avgVolume: 20000000, // 1.05x average
    high52w: 468.0,
    low52w: 310.0,
    timestamp: new Date().toISOString()
  };

  const checkpoint: UserSymbolCheckpoint = {
    id: 'c3',
    userId: 'u1',
    symbol: 'MSFT',
    lastViewedAt: new Date(Date.now() - 3600000).toISOString(),
    lastSeenPrice: 421.0 // +0.12% move (below 2%)
  };

  const result = evaluateMeaningfulChange(snapshot, checkpoint, DEFAULT_CONFIG);
  assert.strictEqual(result, null, 'Quiet stock should not be flagged as meaningful');
});

test('Diff Logic: triggers ROUND_NUMBER_BREAKOUT when crossing round levels', () => {
  const snapshot: PriceSnapshot = {
    id: 's4',
    symbol: 'PLTR',
    price: 31.50,
    dayChange: 2.0,
    dayChangePercent: 6.7,
    volume: 50000000,
    avgVolume: 45000000,
    high52w: 34.0,
    low52w: 15.0,
    timestamp: new Date().toISOString()
  };

  const checkpoint: UserSymbolCheckpoint = {
    id: 'c4',
    userId: 'u1',
    symbol: 'PLTR',
    lastViewedAt: new Date(Date.now() - 3600000).toISOString(),
    lastSeenPrice: 29.20 // Crossed above $30
  };

  const result = evaluateMeaningfulChange(snapshot, checkpoint, DEFAULT_CONFIG);
  assert.ok(result !== null);
  assert.ok(result.reasons.includes('ROUND_NUMBER_BREAKOUT'));
});
