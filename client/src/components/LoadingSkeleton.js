import React from 'react';

/**
 * Skeleton loading component for better perceived performance
 */
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {[...Array(count)].map((_, index) => (
        <div key={index} className="card skeleton-card" style={{ marginBottom: '1rem' }}>
          <div className="skeleton skeleton-title" style={{ width: '60%', height: '24px', marginBottom: '1rem' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '100%', height: '16px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '80%', height: '16px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton skeleton-text" style={{ width: '90%', height: '16px' }}></div>
        </div>
      ))}
    </>
  );
};

export const SkeletonTable = ({ rows = 5, columns = 4 }) => {
  return (
    <div className="card">
      <table className="data-table">
        <thead>
          <tr>
            {[...Array(columns)].map((_, index) => (
              <th key={index}>
                <div className="skeleton" style={{ width: '80%', height: '16px' }}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rows)].map((_, rowIndex) => (
            <tr key={rowIndex}>
              {[...Array(columns)].map((_, colIndex) => (
                <td key={colIndex}>
                  <div className="skeleton" style={{ width: '90%', height: '16px' }}></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const SkeletonList = ({ count = 5 }) => {
  return (
    <div className="card">
      {[...Array(count)].map((_, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            padding: '1rem 0',
            borderBottom: index < count - 1 ? '1px solid var(--border-color)' : 'none'
          }}
        >
          <div className="skeleton" style={{ width: '40px', height: '40px', borderRadius: '50%' }}></div>
          <div style={{ flex: 1 }}>
            <div className="skeleton" style={{ width: '40%', height: '18px', marginBottom: '0.5rem' }}></div>
            <div className="skeleton" style={{ width: '60%', height: '14px' }}></div>
          </div>
        </div>
      ))}
    </div>
  );
};

export const SkeletonForm = () => {
  return (
    <div className="card">
      <div className="skeleton" style={{ width: '200px', height: '24px', marginBottom: '1.5rem' }}></div>
      {[...Array(4)].map((_, index) => (
        <div key={index} style={{ marginBottom: '1.5rem' }}>
          <div className="skeleton" style={{ width: '100px', height: '16px', marginBottom: '0.5rem' }}></div>
          <div className="skeleton" style={{ width: '100%', height: '40px' }}></div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
        <div className="skeleton" style={{ width: '100px', height: '40px' }}></div>
        <div className="skeleton" style={{ width: '100px', height: '40px' }}></div>
      </div>
    </div>
  );
};

export const LoadingSpinner = ({ size = 'medium', message = 'Loading...' }) => {
  const sizeMap = {
    small: '20px',
    medium: '40px',
    large: '60px'
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      gap: '1rem'
    }}>
      <div
        className="loading-spinner"
        style={{
          width: sizeMap[size],
          height: sizeMap[size],
          border: '3px solid var(--border-color)',
          borderTop: '3px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}
      ></div>
      {message && (
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
          {message}
        </div>
      )}
    </div>
  );
};

// Add animation keyframes if not already in global CSS
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }

    .skeleton {
      background: linear-gradient(90deg, var(--bg-tertiary) 25%, var(--bg-elevated) 50%, var(--bg-tertiary) 75%);
      background-size: 200% 100%;
      animation: loading 1.5s ease-in-out infinite;
      border-radius: 4px;
    }

    @keyframes loading {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;
  document.head.appendChild(style);
}

export default {
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonForm,
  LoadingSpinner
};
