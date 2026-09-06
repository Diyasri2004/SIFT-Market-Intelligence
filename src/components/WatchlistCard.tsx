import React from 'react';
import { TrendingUp, TrendingDown, Trash2, AlertTriangle, Eye } from 'lucide-react';
import { WatchlistItem } from '../../shared/types.js';
import { formatTimeAgo } from '../utils/formatters.js';

interface SparklineProps {
  positive: boolean;
  seed: number;
}

const Sparkline: React.FC<SparklineProps> = ({ positive, seed }) => {
  const points = Array.from({ length: 9 }, (_, i) => {
    const wave = Math.sin((i + seed) * 1.7) * 6;
    const trend = positive ? i * -2.1 : i * 2.1;
    return `${i * 12.5},${28 + wave + trend}`;
  }).join(' ');
  const color = positive ? 'var(--bull-green)' : 'var(--bear-red)';
  return (
    <svg className="card-sparkline" viewBox="0 0 100 40" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`0,40 ${points} 100,40`} fill={positive ? 'url(#sparkGreen)' : 'url(#sparkRed)'} stroke="none" opacity=".22" />
      <defs>
        <linearGradient id="sparkGreen" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#b9ed65" />
          <stop offset="1" stopColor="#b9ed65" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sparkRed" x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="#ff7b78" />
          <stop offset="1" stopColor="#ff7b78" stopOpacity="0" />
        </linearGradient>
      </defs>
    </svg>
  );
};

export interface WatchlistCardProps {
  item: WatchlistItem;
  onSelect: (symbol: string) => void;
  onDeleteRequest: (symbol: string) => void;
}

export const WatchlistCard: React.FC<WatchlistCardProps> = ({
  item,
  onSelect,
  onDeleteRequest
}) => {
  const isDayPositive = item.dayChangePercent >= 0;
  const daySign = isDayPositive ? '+' : '';

  const hasCheckpoint = item.sinceLastCheckedChangePercent !== undefined && item.sinceLastCheckedChangePercent !== null;
  const isCheckpointPositive = (item.sinceLastCheckedChangePercent || 0) >= 0;
  const checkpointSign = isCheckpointPositive ? '+' : '';

  const handleCardClick = () => {
    onSelect(item.symbol);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.borderColor = 'var(--border-highlight)';
    target.style.background = 'var(--bg-card-hover)';
    target.style.transform = 'translateY(-1px)';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.style.borderColor = 'var(--border-subtle)';
    target.style.background = 'var(--bg-card)';
    target.style.transform = 'translateY(0)';
  };

  const handleDeleteClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDeleteRequest(item.symbol);
  };

  const handleDeleteMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.color = 'var(--bear-red)';
    target.style.background = 'rgba(244, 63, 94, 0.1)';
  };

  const handleDeleteMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget;
    target.style.color = 'var(--text-muted)';
    target.style.background = 'transparent';
  };

  return (
    <div
      className="watchlist-card"
      onClick={handleCardClick}
      style={{
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative'
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Symbol & Name info */}
      <div style={{ flex: '1 1 200px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
          <span style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
            {item.symbol}
          </span>
          <span style={{
            fontSize: '0.675rem',
            padding: '1px 6px',
            borderRadius: '4px',
            background: 'rgba(255, 255, 255, 0.07)',
            color: 'var(--text-secondary)'
          }}>
            {item.exchange}
          </span>

          {item.isStale && (
            <span
              title={item.staleReason || 'Cached snapshot'}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                fontSize: '0.675rem',
                color: 'var(--amber-warning)',
                background: 'var(--amber-bg)',
                border: '1px solid var(--amber-border)',
                padding: '1px 6px',
                borderRadius: '4px'
              }}
            >
              <AlertTriangle size={11} /> Stale
            </span>
          )}
        </div>
        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
          {item.name}
        </div>
      </div>

      {/* Since You Last Viewed Delta (Distinct Spec Requirement) */}
      <div style={{
        flex: '1 1 180px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '0 12px',
        borderLeft: '1px solid var(--border-subtle)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '0.7rem',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          fontWeight: 600
        }}>
          <Eye size={12} /> Since last viewed
        </div>
        {hasCheckpoint ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            marginTop: '2px'
          }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.875rem',
              fontWeight: 700,
              color: isCheckpointPositive ? 'var(--bull-green)' : 'var(--bear-red)',
              display: 'flex',
              alignItems: 'center',
              gap: '2px'
            }}>
              {isCheckpointPositive ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {checkpointSign}{item.sinceLastCheckedChangePercent?.toFixed(1)}%
            </span>
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              ({formatTimeAgo(item.lastViewedAt)})
            </span>
          </div>
        ) : (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Baseline set on view
          </span>
        )}
      </div>

      {/* Live Price & Day Change */}
      <div style={{ textAlign: 'right', flex: '0 0 130px' }}>
        <Sparkline positive={isDayPositive} seed={item.symbol.length} />
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontWeight: 700,
          fontSize: '1.05rem',
          color: '#fff'
        }}>
          ${item.currentPrice.toFixed(2)}
        </div>

        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '2px',
          fontSize: '0.8rem',
          fontWeight: 600,
          fontFamily: 'var(--font-mono)',
          color: isDayPositive ? 'var(--bull-green)' : 'var(--bear-red)',
          marginTop: '2px'
        }}>
          {isDayPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
          <span>{daySign}{item.dayChangePercent.toFixed(2)}%</span>
        </div>
      </div>

      {/* Delete Action */}
      <button
        onClick={handleDeleteClick}
        title={`Remove ${item.symbol}`}
        style={{
          padding: '8px',
          borderRadius: 'var(--radius-sm)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
        onMouseEnter={handleDeleteMouseEnter}
        onMouseLeave={handleDeleteMouseLeave}
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
