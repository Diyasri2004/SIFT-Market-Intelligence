import React from 'react';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Activity,
  Flame,
  CheckCheck,
  Award,
  ChevronRight,
  Clock
} from 'lucide-react';
import { DigestItem, MeaningfulChangeType } from '../../shared/types.js';

interface DigestStripProps {
  items: DigestItem[];
  hasMeaningfulChanges: boolean;
  summaryText: string;
  onSelectSymbol: (symbol: string) => void;
  onAcknowledgeAll: () => void;
  isAcknowledging: boolean;
}

export const DigestStrip: React.FC<DigestStripProps> = ({
  items,
  hasMeaningfulChanges,
  summaryText: _summaryText,
  onSelectSymbol,
  onAcknowledgeAll,
  isAcknowledging
}) => {
  const getReasonBadge = (reason: MeaningfulChangeType) => {
    switch (reason) {
      case 'PRICE_SURGE':
        return { label: 'Price Surge', icon: <TrendingUp size={13} />, className: 'badge-bull' };
      case 'PRICE_DROP':
        return { label: 'Price Drop', icon: <TrendingDown size={13} />, className: 'badge-bear' };
      case 'VOLUME_SPIKE':
        return { label: 'Volume Spike', icon: <Activity size={13} />, className: 'badge-amber' };
      case 'MILESTONE_52W_HIGH':
        return { label: '52W High Break', icon: <Award size={13} />, className: 'badge-purple' };
      case 'MILESTONE_52W_LOW':
        return { label: '52W Low', icon: <TrendingDown size={13} />, className: 'badge-bear' };
      case 'ROUND_NUMBER_BREAKOUT':
        return { label: 'Milestone Level', icon: <Flame size={13} />, className: 'badge-bull' };
      case 'ROUND_NUMBER_BREAKDOWN':
        return { label: 'Broke Support', icon: <Flame size={13} />, className: 'badge-bear' };
      default:
        return { label: 'Major Move', icon: <Sparkles size={13} />, className: 'badge-amber' };
    }
  };

  return (
    <section className="digest-section" style={{ marginBottom: '32px' }}>
      {/* Digest Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '14px',
        flexWrap: 'wrap',
        gap: '10px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '24px',
            height: '24px',
            borderRadius: '6px',
            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
            color: '#fff'
          }}>
            <Sparkles size={14} />
          </div>
          <h2 style={{
            fontSize: '1rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)'
          }}>
            Since You Last Checked
          </h2>
          <span style={{
            fontSize: '0.75rem',
            color: 'var(--text-secondary)',
            fontWeight: 500
          }}>
            • Ranked by magnitude
          </span>
        </div>

        {hasMeaningfulChanges && (
          <button
            onClick={onAcknowledgeAll}
            disabled={isAcknowledging}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontWeight: 500
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.1)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(255, 255, 255, 0.05)';
              (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
            }}
          >
            <CheckCheck size={14} />
            <span>Mark All as Seen</span>
          </button>
        )}
      </div>

      {/* Digest Content Strip */}
      {!hasMeaningfulChanges ? (
        <div style={{
          background: 'var(--bg-card)',
          border: '1px dashed var(--border-subtle)',
          borderRadius: 'var(--radius-md)',
          padding: '24px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.04)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--bull-green)'
          }}>
            <Clock size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.925rem' }}>
              No major moves since your last visit
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              All watched assets are trading within normal baseline bands. We will surface items here as soon as thresholds are crossed.
            </div>
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          gap: '14px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollSnapType: 'x mandatory'
        }}>
          {items.map((item, idx) => {
            const badge = getReasonBadge(item.primaryReason);
            const isPositive = item.priceDeltaPercent >= 0;
            const sign = isPositive ? '+' : '';

            return (
              <div
                key={item.symbol}
                onClick={() => onSelectSymbol(item.symbol)}
                style={{
                  flex: '0 0 320px',
                  scrollSnapAlign: 'start',
                  background: 'linear-gradient(145deg, rgba(26, 34, 56, 0.9) 0%, rgba(17, 23, 38, 0.8) 100%)',
                  border: isPositive
                    ? '1px solid rgba(16, 185, 129, 0.3)'
                    : '1px solid rgba(244, 63, 94, 0.3)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  cursor: 'pointer',
                  boxShadow: isPositive
                    ? '0 6px 20px rgba(16, 185, 129, 0.12)'
                    : '0 6px 20px rgba(244, 63, 94, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  gap: '12px',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Top Strip info */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div className={`badge ${badge.className}`}>
                      {badge.icon}
                      <span>{badge.label}</span>
                    </div>

                    <div style={{
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      background: 'rgba(0,0,0,0.3)',
                      padding: '2px 6px',
                      borderRadius: '4px'
                    }}>
                      #{idx + 1} IMPACT
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: '1.15rem', color: '#fff' }}>
                        {item.symbol}
                      </span>
                      <span style={{ fontSize: '0.775rem', color: 'var(--text-secondary)', marginLeft: '6px' }}>
                        {item.name}
                      </span>
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 700,
                      fontSize: '1rem',
                      color: isPositive ? 'var(--bull-green)' : 'var(--bear-red)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px'
                    }}>
                      {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                      {sign}{item.priceDeltaPercent.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* Plain language explanation */}
                <div style={{
                  background: 'rgba(0, 0, 0, 0.35)',
                  border: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 12px',
                  fontSize: '0.8rem',
                  color: 'var(--text-primary)',
                  lineHeight: '1.4'
                }}>
                  {item.explanation}
                </div>

                {/* Bottom CTA / Ack clue */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '0.75rem',
                  color: 'var(--text-secondary)',
                  paddingTop: '4px',
                  borderTop: '1px solid var(--border-subtle)'
                }}>
                  <span>Now: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>${item.currentPrice.toFixed(2)}</strong></span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#818cf8', fontWeight: 600 }}>
                    View & Acknowledge <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};
