export interface SymbolMetadata {
  symbol: string;
  name: string;
  exchange: string;
  type: 'STOCK' | 'CRYPTO' | 'ETF' | 'INDEX';
  basePrice: number;
  avgVolume: number;
  high52w: number;
  low52w: number;
  volatility: number;
}

export const SYMBOL_DIRECTORY: Record<string, SymbolMetadata> = {
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 228.50,
    avgVolume: 48000000,
    high52w: 237.23,
    low52w: 164.08,
    volatility: 0.015
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corporation',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 124.80,
    avgVolume: 85000000,
    high52w: 140.76,
    low52w: 45.01,
    volatility: 0.035
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla, Inc.',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 218.30,
    avgVolume: 65000000,
    high52w: 271.00,
    low52w: 138.80,
    volatility: 0.04
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corporation',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 422.15,
    avgVolume: 22000000,
    high52w: 468.35,
    low52w: 309.45,
    volatility: 0.012
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com, Inc.',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 178.60,
    avgVolume: 38000000,
    high52w: 201.20,
    low52w: 118.35,
    volatility: 0.02
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet Inc.',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 165.40,
    avgVolume: 26000000,
    high52w: 191.75,
    low52w: 120.21,
    volatility: 0.018
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms, Inc.',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 512.20,
    avgVolume: 15000000,
    high52w: 544.23,
    low52w: 279.40,
    volatility: 0.025
  },
  'BTC-USD': {
    symbol: 'BTC-USD',
    name: 'Bitcoin USD',
    exchange: 'CRYPTO',
    type: 'CRYPTO',
    basePrice: 62450.00,
    avgVolume: 28000000000,
    high52w: 73750.07,
    low52w: 26500.00,
    volatility: 0.045
  },
  'ETH-USD': {
    symbol: 'ETH-USD',
    name: 'Ethereum USD',
    exchange: 'CRYPTO',
    type: 'CRYPTO',
    basePrice: 2460.00,
    avgVolume: 14000000000,
    high52w: 4092.28,
    low52w: 1520.00,
    volatility: 0.05
  },
  SPY: {
    symbol: 'SPY',
    name: 'SPDR S&P 500 ETF Trust',
    exchange: 'NYSEARCA',
    type: 'ETF',
    basePrice: 558.40,
    avgVolume: 45000000,
    high52w: 565.16,
    low52w: 410.07,
    volatility: 0.008
  },
  QQQ: {
    symbol: 'QQQ',
    name: 'Invesco QQQ Trust',
    exchange: 'NASDAQ',
    type: 'ETF',
    basePrice: 476.90,
    avgVolume: 35000000,
    high52w: 503.52,
    low52w: 345.10,
    volatility: 0.012
  },
  AMD: {
    symbol: 'AMD',
    name: 'Advanced Micro Devices, Inc.',
    exchange: 'NASDAQ',
    type: 'STOCK',
    basePrice: 142.10,
    avgVolume: 52000000,
    high52w: 227.30,
    low52w: 94.04,
    volatility: 0.038
  },
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir Technologies Inc.',
    exchange: 'NYSE',
    type: 'STOCK',
    basePrice: 32.75,
    avgVolume: 48000000,
    high52w: 34.20,
    low52w: 14.48,
    volatility: 0.042
  }
};

export function getSymbolMetadata(symbol: string): SymbolMetadata {
  const upper = symbol.toUpperCase().trim();
  if (SYMBOL_DIRECTORY[upper]) {
    return SYMBOL_DIRECTORY[upper];
  }
  // Generic fallback for custom symbols
  return {
    symbol: upper,
    name: `${upper} Corp`,
    exchange: 'US',
    type: 'STOCK',
    basePrice: 100.0,
    avgVolume: 10000000,
    high52w: 120.0,
    low52w: 80.0,
    volatility: 0.025
  };
}

export function searchSymbols(query: string) {
  const q = query.toUpperCase().trim();
  if (!q) return [];
  return Object.values(SYMBOL_DIRECTORY).filter(
    item => item.symbol.includes(q) || item.name.toUpperCase().includes(q)
  );
}
