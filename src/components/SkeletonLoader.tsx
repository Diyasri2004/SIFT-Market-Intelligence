export const SkeletonLoader: React.FC = () => {
  return (
    <div>
      {/* Digest strip skeleton */}
      <div style={{ marginBottom: '32px' }}>
        <div className="skeleton" style={{ height: '24px', width: '220px', marginBottom: '14px' }} />
        <div style={{ display: 'flex', gap: '14px', overflowX: 'hidden' }}>
          <div className="skeleton" style={{ flex: '0 0 320px', height: '140px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ flex: '0 0 320px', height: '140px', borderRadius: 'var(--radius-md)' }} />
          <div className="skeleton" style={{ flex: '0 0 320px', height: '140px', borderRadius: 'var(--radius-md)' }} />
        </div>
      </div>

      {/* Watchlist list skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div className="skeleton" style={{ height: '20px', width: '160px', marginBottom: '6px' }} />
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{
              height: '76px',
              width: '100%',
              borderRadius: 'var(--radius-md)'
            }}
          />
        ))}
      </div>
    </div>
  );
};
