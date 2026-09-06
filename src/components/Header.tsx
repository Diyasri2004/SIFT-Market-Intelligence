import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, TrendingUp, RefreshCw, Check, Command, Wifi } from 'lucide-react';
import { api } from '../api/client.js';
import { SearchResultItem } from '../../shared/types.js';

interface HeaderProps {
  onAddSymbol: (symbol: string) => Promise<void>;
  onRefresh: () => void;
  isRefreshing: boolean;
  watchedSymbols: string[];
}

export const Header: React.FC<HeaderProps> = ({
  onAddSymbol,
  onRefresh,
  isRefreshing,
  watchedSymbols
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [addingSymbol, setAddingSymbol] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.searchSymbols(query);
        setResults(res);
        setIsOpen(true);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = async (sym: string) => {
    if (watchedSymbols.includes(sym)) return;
    setAddingSymbol(sym);
    try {
      await onAddSymbol(sym);
      setQuery('');
      setIsOpen(false);
    } finally {
      setAddingSymbol(null);
    }
  };

  const marketTape = ['S&P 500  +0.82%', 'NASDAQ  +1.14%', 'DOW  +0.34%', 'BTC  +2.61%', 'USD / INR  83.42', 'VIX  14.08'];

  return (
    <header className="modern-header" style={{
      position: 'sticky',
      top: 0,
      zIndex: 40,
      background: 'rgba(10, 13, 20, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid var(--border-subtle)',
      padding: '16px 24px',
      marginBottom: '24px'
    }}>
      <div className="header-inner" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '20px',
        flexWrap: 'wrap'
      }}>
        {/* Brand & Market Status */}
        <div className="brand-cluster" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1 0%, #10b981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)'
            }}>
              <TrendingUp size={22} color="#ffffff" strokeWidth={2.5} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{
                  fontSize: '1.25rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  background: 'linear-gradient(to right, #ffffff, #cbd5e1)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>
                  SIFT
                </span>
                <span style={{
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  background: 'rgba(99, 102, 241, 0.2)',
                  color: '#818cf8',
                  border: '1px solid rgba(99, 102, 241, 0.3)'
                }}>
                  Market Intelligence
                </span>
              </div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)'
              }}>
                <span style={{
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  background: 'var(--bull-green)',
                  boxShadow: '0 0 8px var(--bull-green)'
                }} />
                Live Market Engine
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Autocomplete Search Box */}
        <div ref={dropdownRef} className="header-search" style={{ position: 'relative', flex: '1 1 340px', maxWidth: '520px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '8px 14px',
            gap: '10px',
            boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
            transition: 'border-color 0.2s, box-shadow 0.2s'
          }}>
            <Search size={18} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search symbol (e.g. NVDA, AAPL, TSLA, BTC)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => { if (results.length > 0) setIsOpen(true); }}
              style={{
                background: 'transparent',
                border: 'none',
                outline: 'none',
                fontSize: '0.875rem',
                width: '100%',
                color: 'var(--text-primary)'
              }}
            />
            {loading && (
              <RefreshCw size={14} color="var(--text-muted)" style={{ animation: 'shimmer 1s infinite linear' }} />
            )}
            {!loading && <span className="search-shortcut"><Command size={11} /> K</span>}
          </div>

          {/* Autocomplete Dropdown */}
          {isOpen && (
            <div style={{
              position: 'absolute',
              top: 'calc(100% + 8px)',
              left: 0,
              right: 0,
              background: '#131929',
              border: '1px solid var(--border-highlight)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-lg)',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 50,
              padding: '6px'
            }}>
              {results.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.825rem' }}>
                  No symbols found for "{query}"
                </div>
              ) : (
                results.map((item) => {
                  const isWatched = watchedSymbols.includes(item.symbol);
                  return (
                    <div
                      key={item.symbol}
                      onClick={() => !isWatched && handleSelect(item.symbol)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 12px',
                        borderRadius: 'var(--radius-sm)',
                        cursor: isWatched ? 'default' : 'pointer',
                        background: 'transparent',
                        transition: 'background 0.15s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isWatched) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)';
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff' }}>{item.symbol}</span>
                          <span style={{
                            fontSize: '0.675rem',
                            padding: '1px 5px',
                            borderRadius: '3px',
                            background: 'rgba(255,255,255,0.08)',
                            color: 'var(--text-secondary)'
                          }}>
                            {item.exchange}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {item.name}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', fontFamily: 'var(--font-mono)' }}>
                            ${typeof item.currentPrice === 'number' ? item.currentPrice.toFixed(2) : '--'}
                          </div>
                        </div>

                        {isWatched ? (
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            color: 'var(--bull-green)',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            padding: '4px 8px',
                            background: 'var(--bull-bg)',
                            borderRadius: 'var(--radius-sm)'
                          }}>
                            <Check size={14} /> Added
                          </div>
                        ) : (
                          <button
                            disabled={addingSymbol === item.symbol}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '6px 12px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'var(--accent-primary)',
                              color: '#fff',
                              fontSize: '0.775rem',
                              fontWeight: 600
                            }}
                          >
                            <Plus size={14} /> Add
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={onRefresh}
            title="Refresh market data"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)',
              fontSize: '0.8rem',
              fontWeight: 500
            }}
          >
            <RefreshCw
              size={15}
              style={{
                animation: isRefreshing ? 'shimmer 1s infinite linear' : 'none',
                transform: isRefreshing ? 'rotate(180deg)' : 'none',
                transition: 'transform 0.4s'
              }}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>
      <div className="market-tape" aria-label="Market overview">
        <div className="market-tape-track">
          {[...marketTape, ...marketTape].map((item, index) => <span key={`${item}-${index}`}><i /> {item}</span>)}
        </div>
        <div className="tape-live"><Wifi size={12} /> LIVE</div>
      </div>
    </header>
  );
};
