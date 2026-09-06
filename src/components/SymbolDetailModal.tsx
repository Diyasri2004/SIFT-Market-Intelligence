import React, { useState, useEffect } from 'react';
import {
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { SymbolDetailResponse } from '../../shared/types.js';
import { formatTimeAgo, formatVolume } from '../utils/formatters.js';

interface SymbolDetailModalProps {
  symbol: string;
  detail: SymbolDetailResponse | null;
  loading: boolean;
  onClose: () => void;
  isAcknowledged: boolean;
}

export const SymbolDetailModal: React.FC<SymbolDetailModalProps> = ({
  symbol: _symbol,
  detail,
  loading,
  onClose,
  isAcknowledged
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ price: number; timestamp: string; x: number; y: number } | null>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!detail && loading) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5, 8, 15, 0.8)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}>
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '580px',
          padding: '32px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div className="skeleton" style={{ height: '32px', width: '40%' }} />
          <div className="skeleton" style={{ height: '56px', width: '60%' }} />
          <div className="skeleton" style={{ height: '180px', width: '100%' }} />
          <div className="skeleton" style={{ height: '60px', width: '100%' }} />
        </div>
      </div>
    );
  }

  if (!detail) return null;

  const isDayPositive = detail.dayChangePercent >= 0;
  const daySign = isDayPositive ? '+' : '';

  // Calculate SVG Chart Dimensions & Coordinates
  const chartWidth = 500;
  const chartHeight = 160;
  const padding = 20;

  const prices = detail.history.map(h => h.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) * 0.998 : detail.currentPrice * 0.95;
  const maxPrice = prices.length > 0 ? Math.max(...prices) * 1.002 : detail.currentPrice * 1.05;
  const priceRange = Math.max(0.01, maxPrice - minPrice);

  const points = detail.history.map((pt, index) => {
    const x = padding + (index / Math.max(1, detail.history.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((pt.price - minPrice) / priceRange) * (chartHeight - padding * 2);
    return { x, y, price: pt.price, timestamp: pt.timestamp };
  });

  const pathD = points.length > 0
    ? points.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`, '')
    : '';

  const areaD = points.length > 0
    ? `${pathD} L ${(chartWidth - padding).toFixed(1)} ${(chartHeight - padding).toFixed(1)} L ${padding} ${(chartHeight - padding).toFixed(1)} Z`
    : '';

  const strokeColor = isDayPositive ? '#10b981' : '#f43f5e';
  const fillColor = isDayPositive ? 'url(#greenGrad)' : 'url(#redGrad)';

  // 52-week position percentage
  const range52w = Math.max(1, detail.high52w - detail.low52w);
  const pos52wPct = Math.min(100, Math.max(0, ((detail.currentPrice - detail.low52w) / range52w) * 100));

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        background: 'rgba(5, 8, 15, 0.82)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'linear-gradient(160deg, #161e31 0%, #0d121f 100%)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: '620px',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: '0 24px 60px rgba(0,0,0,0.6)',
          padding: '28px',
          position: 'relative'
        }}
        className="animate-fade-in"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-secondary)'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.color = '#fff';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.06)';
          }}
        >
          <X size={18} />
        </button>

        {/* Header Block: Symbol & Name */}
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
              {detail.symbol}
            </h1>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '2px 8px',
              borderRadius: '4px',
              background: 'rgba(255, 255, 255, 0.08)',
              color: 'var(--text-secondary)'
            }}>
              {detail.exchange}
            </span>

            {detail.isStale && (
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.75rem',
                color: 'var(--amber-warning)',
                background: 'var(--amber-bg)',
                border: '1px solid var(--amber-border)',
                padding: '2px 8px',
                borderRadius: '4px'
              }}>
                <AlertTriangle size={13} /> {detail.staleReason || 'Cached snapshot'}
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
            {detail.name}
          </div>
        </div>

        {/* Visible "Marked as Seen" Confirmation Banner (UI Spec requirement) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: isAcknowledged ? 'rgba(16, 185, 129, 0.12)' : 'rgba(99, 102, 241, 0.12)',
          border: isAcknowledged ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(99, 102, 241, 0.3)',
          borderRadius: 'var(--radius-sm)',
          padding: '8px 12px',
          marginBottom: '20px',
          fontSize: '0.8rem',
          color: isAcknowledged ? 'var(--bull-green)' : '#a5b4fc',
          transition: 'all 0.3s ease'
        }}>
          <CheckCircle2 size={16} />
          <span>
            <strong>Checkpoint Synced:</strong> Marked as seen at <strong>${detail.currentPrice.toFixed(2)}</strong>. Cross-device state updated.
          </span>
        </div>

        {/* Larger Price & Change Display */}
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid var(--border-subtle)'
        }}>
          <div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.4rem',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.03em'
            }}>
              ${detail.currentPrice.toFixed(2)}
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontFamily: 'var(--font-mono)',
              fontSize: '1rem',
              fontWeight: 700,
              color: isDayPositive ? 'var(--bull-green)' : 'var(--bear-red)'
            }}>
              {isDayPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
              <span>{daySign}${Math.abs(detail.dayChange).toFixed(2)} ({daySign}{detail.dayChangePercent.toFixed(2)}%)</span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-sans)', fontWeight: 400 }}>today</span>
            </div>
          </div>

          {/* Since Last Viewed Comparison Metric */}
          {detail.sinceLastCheckedChangePercent !== undefined && detail.sinceLastCheckedChangePercent !== null && (
            <div style={{
              textAlign: 'right',
              background: 'rgba(0,0,0,0.25)',
              padding: '8px 14px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border-subtle)'
            }}>
              <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Since last checked ({formatTimeAgo(detail.lastViewedAt)})
              </div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontWeight: 700,
                fontSize: '1.05rem',
                color: (detail.sinceLastCheckedChangePercent || 0) >= 0 ? 'var(--bull-green)' : 'var(--bear-red)'
              }}>
                {(detail.sinceLastCheckedChangePercent || 0) >= 0 ? '+' : ''}{detail.sinceLastCheckedChangePercent.toFixed(2)}%
                <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                  (from ${detail.lastSeenPrice?.toFixed(2)})
                </span>
              </div>
            </div>
          )}
        </div>

        {/* "What Changed" Plain Language Narrative (Core IP Box) */}
        {detail.explanation && (
          <div style={{
            background: 'rgba(99, 102, 241, 0.08)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 16px',
            marginBottom: '20px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#818cf8',
              letterSpacing: '0.05em',
              marginBottom: '6px'
            }}>
              <Sparkles size={14} /> What Changed & Why It Matters
            </div>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-primary)', lineHeight: '1.5' }}>
              {detail.explanation}
            </p>
          </div>
        )}

        {/* Interactive Price History Chart */}
        <div style={{
          background: 'rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '16px',
          marginBottom: '20px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '10px'
          }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              24-Hour Price Action
            </span>
            <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              Range: ${minPrice.toFixed(2)} – ${maxPrice.toFixed(2)}
            </span>
          </div>

          <div style={{ position: 'relative', width: '100%' }}>
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
            >
              <defs>
                <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="redGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid lines */}
              <line x1={padding} y1={padding} x2={chartWidth - padding} y2={padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight / 2} x2={chartWidth - padding} y2={chartHeight / 2} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

              {/* Area fill */}
              {areaD && <path d={areaD} fill={fillColor} />}

              {/* Line stroke */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Points for hover interaction */}
              {points.map((pt, i) => (
                <circle
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  r={hoveredPoint?.timestamp === pt.timestamp ? 5 : 3}
                  fill={strokeColor}
                  stroke="#fff"
                  strokeWidth={hoveredPoint?.timestamp === pt.timestamp ? 2 : 0}
                  style={{ cursor: 'pointer' }}
                  onMouseEnter={() => setHoveredPoint(pt)}
                />
              ))}
            </svg>

            {/* Hover Tooltip */}
            {hoveredPoint && (
              <div style={{
                position: 'absolute',
                top: `${hoveredPoint.y - 45}px`,
                left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                transform: 'translateX(-50%)',
                background: '#0f172a',
                border: '1px solid var(--border-highlight)',
                borderRadius: '6px',
                padding: '4px 8px',
                fontSize: '0.75rem',
                fontFamily: 'var(--font-mono)',
                color: '#fff',
                pointerEvents: 'none',
                boxShadow: 'var(--shadow-md)',
                whiteSpace: 'nowrap',
                zIndex: 10
              }}>
                <div>${hoveredPoint.price.toFixed(2)}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{formatTimeAgo(hoveredPoint.timestamp)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Key Metrics Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
          gap: '12px'
        }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Volume</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#fff' }}>
              {formatVolume(detail.volume)}
            </div>
            <div style={{ fontSize: '0.7rem', color: detail.volume > detail.avgVolume ? 'var(--bull-green)' : 'var(--text-muted)' }}>
              Avg: {formatVolume(detail.avgVolume)}
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>52-Week Range</div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'var(--font-mono)', color: '#fff' }}>
              ${detail.low52w.toFixed(2)} - ${detail.high52w.toFixed(2)}
            </div>
            {/* Progress Bar */}
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', marginTop: '6px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${pos52wPct}%`, background: 'var(--accent-primary)' }} />
            </div>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.03)', padding: '10px 12px', borderRadius: 'var(--radius-sm)' }}>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Meaningful Threshold</div>
            <div style={{ fontSize: '0.925rem', fontWeight: 700, fontFamily: 'var(--font-mono)', color: '#818cf8' }}>
              &gt; {detail.thresholds.priceMoveThresholdPercent}% move
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              or &gt; {detail.thresholds.volumeSpikeThresholdMultiplier}x volume
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
