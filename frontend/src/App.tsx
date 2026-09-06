import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { DigestStrip } from './components/DigestStrip.js';
import { WatchlistCard } from './components/WatchlistCard.js';
import { SymbolDetailModal } from './components/SymbolDetailModal.js';
import { EmptyState } from './components/EmptyState.js';
import { ConfirmModal } from './components/ConfirmModal.js';
import { SkeletonLoader } from './components/SkeletonLoader.js';
import { api } from './api/client.js';
import { WatchlistItem, DigestResponse, SymbolDetailResponse } from '../../shared/types.js';
import { AlertCircle, RefreshCw, Layers, ShieldCheck, ArrowUpRight, Activity, Radar } from 'lucide-react';

export function App() {
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
  const [digest, setDigest] = useState<DigestResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modals & Details State
  const [selectedSymbol, setSelectedSymbol] = useState<string | null>(null);
  const [symbolDetail, setSymbolDetail] = useState<SymbolDetailResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailAcknowledged, setDetailAcknowledged] = useState(false);

  // Deletion Modal
  const [symbolToDelete, setSymbolToDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addingPreset, setAddingPreset] = useState<string | null>(null);
  const [isAcknowledgingAll, setIsAcknowledgingAll] = useState(false);

  // Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Fetch Watchlist & Digest
  const fetchData = useCallback(async (isBackground = false) => {
    if (!isBackground) setRefreshing(true);
    setError(null);
    try {
      const [wlData, digData] = await Promise.all([
        api.getWatchlist(),
        api.getDigest()
      ]);
      setWatchlist(wlData);
      setDigest(digData);
    } catch (err: any) {
      console.error('Error fetching market data:', err);
      setError(err.message || 'Failed to connect to market backend');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial Load & Periodic Background Refresh
  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData(true);
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchData]);

  // Open Symbol Detail and acknowledge checkpoint (spec requirement)
  const handleSelectSymbol = async (symbol: string) => {
    setSelectedSymbol(symbol);
    setDetailLoading(true);
    setDetailAcknowledged(false);

    try {
      // 1. Fetch details
      const detail = await api.getSymbolDetail(symbol);
      setSymbolDetail(detail);

      // 2. Acknowledge checkpoint (marks as seen in backend)
      await api.acknowledgeSymbol(symbol);
      setDetailAcknowledged(true);

      // 3. Silently refresh digest & watchlist so the strip updates
      fetchData(true);
    } catch (err) {
      console.error('Error loading detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Add Symbol
  const handleAddSymbol = async (sym: string) => {
    try {
      await api.addSymbol(sym);
      showToast(`Added ${sym} to watchlist`);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || `Failed to add ${sym}`);
    }
  };

  // Delete Symbol Confirm
  const handleConfirmDelete = async () => {
    if (!symbolToDelete) return;
    setDeleting(true);
    try {
      await api.removeSymbol(symbolToDelete);
      showToast(`Removed ${symbolToDelete} from watchlist`);
      setSymbolToDelete(null);
      await fetchData();
    } catch (err: any) {
      showToast(err.message || `Failed to remove ${symbolToDelete}`);
    } finally {
      setDeleting(false);
    }
  };

  // Bulk Acknowledge All
  const handleAcknowledgeAll = async () => {
    setIsAcknowledgingAll(true);
    try {
      await api.acknowledgeAll();
      showToast('All changes marked as seen');
      await fetchData();
    } catch (err: any) {
      showToast(err.message || 'Failed to acknowledge changes');
    } finally {
      setIsAcknowledgingAll(false);
    }
  };

  const watchedSymbols = watchlist.map(w => w.symbol);

  return (
    <div className="app-shell" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Sticky Header with Search */}
      <Header
        onAddSymbol={handleAddSymbol}
        onRefresh={() => fetchData()}
        isRefreshing={refreshing}
        watchedSymbols={watchedSymbols}
      />

      {/* Main Container */}
      <main className="main-container" style={{
        maxWidth: '1200px',
        width: '100%',
        margin: '0 auto',
        padding: '0 20px 48px 20px',
        flex: 1
      }}>
        <section className="hero-intro">
          <div className="eyebrow"><span className="eyebrow-dot" /> Market intelligence, distilled</div>
          <h1>Know what changed<br /><em>before it matters.</em></h1>
          <p className="hero-copy">A calmer way to track the markets. SIFT watches the noise, finds the signal, and shows you exactly what deserves your attention.</p>
          <div className="hero-meta"><span><Radar size={14} /> Live signal engine</span><span><Activity size={14} /> Updating every 15s</span><span className="hero-link">Explore your watchlist <ArrowUpRight size={14} /></span></div>
        </section>

        {!loading && watchlist.length > 0 && (
          <div className="overview-grid">
            <div className="overview-card overview-card-primary"><span className="overview-label">Tracked assets</span><strong>{watchlist.length.toString().padStart(2, '0')}</strong><span className="overview-foot"><span className="status-dot" /> In sync</span></div>
            <div className="overview-card"><span className="overview-label">Market pulse</span><strong>{digest?.hasMeaningfulChanges ? 'Active' : 'Quiet'}</strong><span className="overview-foot">{digest?.hasMeaningfulChanges ? 'New signals detected' : 'No major moves'}</span></div>
            <div className="overview-card overview-card-wide"><span className="overview-label">Your edge</span><strong>Signal over noise.</strong><span className="overview-foot">Meaningful changes, ranked by impact</span></div>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div style={{
            background: 'var(--bear-bg)',
            border: '1px solid var(--bear-border)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--bear-red)' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>{error}</span>
            </div>
            <button
              onClick={() => fetchData()}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: 'var(--radius-sm)',
                background: 'rgba(255, 255, 255, 0.1)',
                color: '#fff',
                fontSize: '0.8rem',
                fontWeight: 600
              }}
            >
              <RefreshCw size={14} /> Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <SkeletonLoader />
        ) : watchlist.length === 0 ? (
          /* Empty / First-Run State */
          <EmptyState
            onAddPreset={async (sym) => {
              setAddingPreset(sym);
              try {
                await handleAddSymbol(sym);
              } finally {
                setAddingPreset(null);
              }
            }}
            addingSymbol={addingPreset}
          />
        ) : (
          <div>
            {/* 1. "Since You Last Checked" Digest Strip (Top Priority) */}
            {digest && (
              <DigestStrip
                items={digest.items}
                hasMeaningfulChanges={digest.hasMeaningfulChanges}
                summaryText={digest.summaryText}
                onSelectSymbol={handleSelectSymbol}
                onAcknowledgeAll={handleAcknowledgeAll}
                isAcknowledging={isAcknowledgingAll}
              />
            )}

            {/* 2. Full Watchlist List */}
            <section>
              <div className="section-heading" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '14px'
              }}>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Layers size={18} color="var(--text-secondary)" />
                  <h2 style={{
                    fontSize: '1rem',
                    fontWeight: 700,
                    letterSpacing: '-0.02em',
                    color: 'var(--text-primary)'
                  }}>
                    Watched Assets ({watchlist.length})
                  </h2>
                </div>
                <div className="section-meta" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Auto-syncs every 15s
                </div>
              </div>

              <div className="watchlist-stack" style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}>
                {watchlist.map((item) => (
                  <WatchlistCard
                    key={item.id}
                    item={item}
                    onSelect={handleSelectSymbol}
                    onDeleteRequest={(sym) => setSymbolToDelete(sym)}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '20px 24px',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            SIFT • Built for high-signal market intelligence
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="var(--bull-green)" />
            <span>Persistent Checkpoint Diff Engine</span>
          </div>
        </div>
      </footer>

      {/* Symbol Detail Modal */}
      {selectedSymbol && (
        <SymbolDetailModal
          symbol={selectedSymbol}
          detail={symbolDetail}
          loading={detailLoading}
          onClose={() => {
            setSelectedSymbol(null);
            setSymbolDetail(null);
          }}
          isAcknowledged={detailAcknowledged}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={!!symbolToDelete}
        symbol={symbolToDelete || ''}
        onConfirm={handleConfirmDelete}
        onCancel={() => setSymbolToDelete(null)}
        isDeleting={deleting}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 120,
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-highlight)',
          borderRadius: 'var(--radius-md)',
          padding: '12px 20px',
          color: '#fff',
          fontSize: '0.85rem',
          fontWeight: 600,
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }} className="animate-fade-in">
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)' }} />
          {toastMessage}
        </div>
      )}
    </div>
  );
}
