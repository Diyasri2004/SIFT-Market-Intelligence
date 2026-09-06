import { WatchlistItem, DigestResponse, SymbolDetailResponse, SearchResultItem } from '../../shared/types.js';

const API_BASE = '/api';

function getDeviceId(): string {
  let id = localStorage.getItem('grow_device_id');
  if (!id) {
    id = `device_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('grow_device_id', id);
  }
  return id;
}

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'x-device-id': getDeviceId()
});

export const api = {
  getDeviceId,

  async getWatchlist(): Promise<WatchlistItem[]> {
    const res = await fetch(`${API_BASE}/watchlist`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch watchlist');
    const data = await res.json();
    return data.items || [];
  },

  async addSymbol(symbol: string): Promise<void> {
    const res = await fetch(`${API_BASE}/watchlist`, {
      method: 'POST',
      headers: defaultHeaders(),
      body: JSON.stringify({ symbol })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to add symbol');
    }
  },

  async removeSymbol(symbol: string): Promise<void> {
    const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}`, {
      method: 'DELETE',
      headers: defaultHeaders()
    });
    if (!res.ok) throw new Error('Failed to remove symbol');
  },

  async getDigest(): Promise<DigestResponse> {
    const res = await fetch(`${API_BASE}/watchlist/digest`, { headers: defaultHeaders() });
    if (!res.ok) throw new Error('Failed to fetch digest');
    const data = await res.json();
    return data.digest;
  },

  async acknowledgeSymbol(symbol: string): Promise<{ symbol: string; lastSeenPrice: number }> {
    const res = await fetch(`${API_BASE}/watchlist/${encodeURIComponent(symbol)}/ack`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    if (!res.ok) throw new Error('Failed to acknowledge symbol');
    const data = await res.json();
    return data.checkpoint;
  },

  async acknowledgeAll(): Promise<void> {
    const res = await fetch(`${API_BASE}/watchlist/ack-all`, {
      method: 'POST',
      headers: defaultHeaders()
    });
    if (!res.ok) throw new Error('Failed to acknowledge all');
  },

  async getSymbolDetail(symbol: string): Promise<SymbolDetailResponse> {
    const res = await fetch(`${API_BASE}/market/${encodeURIComponent(symbol)}`, {
      headers: defaultHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch symbol details');
    const data = await res.json();
    return data.symbol;
  },

  async searchSymbols(query: string): Promise<SearchResultItem[]> {
    if (!query || query.trim().length === 0) return [];
    const res = await fetch(`${API_BASE}/market/search?q=${encodeURIComponent(query)}`, {
      headers: defaultHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  }
};
