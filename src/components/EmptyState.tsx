import React from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';

interface EmptyStateProps {
  onAddPreset: (symbol: string) => void;
  addingSymbol: string | null;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddPreset, addingSymbol }) => {
  const starterTickers = [
    { symbol: 'NVDA', name: 'NVIDIA Corp', desc: 'AI hardware leader with high volatility' },
    { symbol: 'AAPL', name: 'Apple Inc.', desc: 'Consumer tech benchmark' },
    { symbol: 'TSLA', name: 'Tesla Inc.', desc: 'EV & energy tech with fast swings' },
    { symbol: 'BTC-USD', name: 'Bitcoin USD', desc: 'Leading crypto asset' }
  ];

  return (
    <div style={{
      background: 'var(--bg-card)',
      border: '1px dashed var(--border-subtle)',
      borderRadius: 'var(--radius-lg)',
      padding: '48px 24px',
      textAlign: 'center',
      maxWidth: '640px',
      margin: '40px auto 0 auto'
    }}>
      <div style={{
        width: '56px',
        height: '56px',
        borderRadius: '16px',
        background: 'rgba(99, 102, 241, 0.12)',
        color: '#818cf8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 16px auto'
      }}>
        <Sparkles size={28} />
      </div>

      <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>
        Your Watchlist is Empty
      </h3>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 24px auto', lineHeight: '1.5' }}>
        Start by adding your favorite assets. SIFT will track your checkpoints and alert you only when meaningful moves happen.
      </p>

      <div style={{
        fontSize: '0.75rem',
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
        color: 'var(--text-muted)',
        marginBottom: '12px'
      }}>
        Quick Add Starter Tickers
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
        gap: '10px',
        maxWidth: '520px',
        margin: '0 auto'
      }}>
        {starterTickers.map(t => (
          <button
            key={t.symbol}
            onClick={() => onAddPreset(t.symbol)}
            disabled={addingSymbol === t.symbol}
            style={{
              background: 'rgba(255, 255, 255, 0.04)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              padding: '12px',
              textAlign: 'left',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(99, 102, 241, 0.15)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(99, 102, 241, 0.4)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.04)';
              (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-subtle)';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 800, color: '#fff', fontSize: '0.95rem' }}>{t.symbol}</span>
              <PlusCircle size={15} color="#818cf8" />
            </div>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-secondary)' }}>{t.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
