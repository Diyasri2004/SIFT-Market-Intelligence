import { DigestItem, MeaningfulChangeType, PriceSnapshot, UserSymbolCheckpoint } from '../shared/types.js';
import { getSymbolMetadata } from './marketDirectory.js';

export interface MeaningfulConfig {
  priceMoveThresholdPercent: number; // e.g. 2.0%
  volumeSpikeMultiplier: number;      // e.g. 1.5x
}

export const DEFAULT_CONFIG: MeaningfulConfig = {
  priceMoveThresholdPercent: 2.0,
  volumeSpikeMultiplier: 1.5
};

export function formatTimeAgo(isoString?: string): string {
  if (!isoString) return 'recently';
  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffSec = Math.max(0, Math.floor(diffMs / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'yesterday';
  return `${diffDays}d ago`;
}

function checkRoundNumberCrossing(lastPrice: number, currentPrice: number): { crossed: boolean; level: number; direction: 'ABOVE' | 'BELOW' } | null {
  // Determine relevant milestone step based on price magnitude
  let step = 10;
  if (currentPrice >= 1000) step = 1000;
  else if (currentPrice >= 500) step = 100;
  else if (currentPrice >= 100) step = 50;
  else if (currentPrice >= 20) step = 10;
  else step = 5;

  const lastLevel = Math.floor(lastPrice / step) * step;
  const currentLevel = Math.floor(currentPrice / step) * step;

  if (currentPrice > lastPrice && currentLevel > lastLevel) {
    return { crossed: true, level: currentLevel, direction: 'ABOVE' };
  }
  if (currentPrice < lastPrice && currentLevel < lastLevel) {
    return { crossed: true, level: lastLevel, direction: 'BELOW' };
  }
  return null;
}

export function evaluateMeaningfulChange(
  snapshot: PriceSnapshot,
  checkpoint: UserSymbolCheckpoint | null,
  config: MeaningfulConfig = DEFAULT_CONFIG
): DigestItem | null {
  const metadata = getSymbolMetadata(snapshot.symbol);
  const reasons: MeaningfulChangeType[] = [];
  
  // Baseline price to diff against
  const baselinePrice = checkpoint ? checkpoint.lastSeenPrice : (snapshot.price - snapshot.dayChange);
  const lastViewedAt = checkpoint ? checkpoint.lastViewedAt : snapshot.timestamp;

  const priceDelta = snapshot.price - baselinePrice;
  const priceDeltaPercent = baselinePrice > 0 ? (priceDelta / baselinePrice) * 100 : 0;
  const absDeltaPercent = Math.abs(priceDeltaPercent);

  // 1. Price Surge / Drop Threshold
  if (absDeltaPercent >= config.priceMoveThresholdPercent) {
    if (priceDeltaPercent > 0) {
      reasons.push('PRICE_SURGE');
    } else {
      reasons.push('PRICE_DROP');
    }
  }

  // 2. Volume Spike
  const volumeRatio = snapshot.avgVolume > 0 ? snapshot.volume / snapshot.avgVolume : 1.0;
  if (volumeRatio >= config.volumeSpikeMultiplier) {
    reasons.push('VOLUME_SPIKE');
  }

  // 3. 52-Week High / Low Milestones
  if (snapshot.price >= snapshot.high52w * 0.995) {
    reasons.push('MILESTONE_52W_HIGH');
  } else if (snapshot.price <= snapshot.low52w * 1.005) {
    reasons.push('MILESTONE_52W_LOW');
  }

  // 4. Round Number Milestone Break
  const roundCrossing = checkRoundNumberCrossing(baselinePrice, snapshot.price);
  if (roundCrossing && roundCrossing.crossed) {
    if (roundCrossing.direction === 'ABOVE') {
      reasons.push('ROUND_NUMBER_BREAKOUT');
    } else {
      reasons.push('ROUND_NUMBER_BREAKDOWN');
    }
  }

  // 5. Trend Reversal (e.g. was red since checkpoint, but green on the day strongly or vice versa)
  if (Math.sign(priceDeltaPercent) !== Math.sign(snapshot.dayChangePercent) && Math.abs(snapshot.dayChangePercent) >= 1.5) {
    reasons.push('TREND_REVERSAL');
  }

  // If no thresholds triggered, return null (not meaningful enough for the digest)
  if (reasons.length === 0) {
    return null;
  }

  // Primary Reason selection based on priority
  let primaryReason = reasons[0];
  if (reasons.includes('MILESTONE_52W_HIGH')) primaryReason = 'MILESTONE_52W_HIGH';
  else if (reasons.includes('MILESTONE_52W_LOW')) primaryReason = 'MILESTONE_52W_LOW';
  else if (reasons.includes('PRICE_SURGE')) primaryReason = 'PRICE_SURGE';
  else if (reasons.includes('PRICE_DROP')) primaryReason = 'PRICE_DROP';
  else if (reasons.includes('ROUND_NUMBER_BREAKOUT')) primaryReason = 'ROUND_NUMBER_BREAKOUT';
  else if (reasons.includes('VOLUME_SPIKE')) primaryReason = 'VOLUME_SPIKE';

  // Calculate Magnitude Score for Ranking (Price change % + volume surge weight + milestone bonus)
  let magnitudeScore = absDeltaPercent * 2.0;
  if (volumeRatio > 1.0) {
    magnitudeScore += (volumeRatio - 1.0) * 3.0;
  }
  if (reasons.includes('MILESTONE_52W_HIGH') || reasons.includes('MILESTONE_52W_LOW')) {
    magnitudeScore += 5.0;
  }
  if (reasons.includes('ROUND_NUMBER_BREAKOUT') || reasons.includes('ROUND_NUMBER_BREAKDOWN')) {
    magnitudeScore += 3.0;
  }

  // Generate plain language explanation
  const timeAgoStr = formatTimeAgo(lastViewedAt);
  const sign = priceDeltaPercent >= 0 ? '+' : '';
  const dirWord = priceDeltaPercent >= 0 ? 'Up' : 'Down';
  const deltaStr = `${dirWord} ${sign}${priceDeltaPercent.toFixed(1)}%`;

  let explanation = '';
  const volSurgePercent = Math.round((volumeRatio - 1.0) * 100);
  const volPart = volumeRatio >= 1.25 ? ` on volume ${volSurgePercent}% above avg` : '';

  switch (primaryReason) {
    case 'MILESTONE_52W_HIGH':
      explanation = `Broke to near 52-Week High ($${snapshot.high52w.toFixed(2)}), ${deltaStr} since you last checked (${timeAgoStr})${volPart}.`;
      break;
    case 'MILESTONE_52W_LOW':
      explanation = `Hit 52-Week Low ($${snapshot.low52w.toFixed(2)}), ${deltaStr} since you last checked (${timeAgoStr})${volPart}.`;
      break;
    case 'ROUND_NUMBER_BREAKOUT':
      explanation = `Crossed above $${roundCrossing?.level} milestone, ${deltaStr} since you last checked (${timeAgoStr})${volPart}.`;
      break;
    case 'ROUND_NUMBER_BREAKDOWN':
      explanation = `Dropped below $${roundCrossing?.level} level, ${deltaStr} since you last checked (${timeAgoStr})${volPart}.`;
      break;
    case 'VOLUME_SPIKE':
      explanation = `Heavy volume surge (${volumeRatio.toFixed(1)}x average), ${deltaStr} since you last checked (${timeAgoStr}).`;
      break;
    case 'PRICE_SURGE':
    case 'PRICE_DROP':
    default:
      explanation = `${deltaStr} since you last checked (${timeAgoStr})${volPart}.`;
      break;
  }

  return {
    symbol: snapshot.symbol,
    name: metadata.name,
    currentPrice: snapshot.price,
    lastSeenPrice: baselinePrice,
    priceDelta,
    priceDeltaPercent,
    dayChangePercent: snapshot.dayChangePercent,
    lastViewedAt,
    lastUpdated: snapshot.timestamp,
    primaryReason,
    reasons,
    explanation,
    magnitudeScore,
    volumeRatio,
    isStale: !!snapshot.isCached
  };
}
