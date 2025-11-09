import React from 'react';
import useOnlineStatus from '../hooks/useOnlineStatus';

/**
 * Offline Indicator Component
 * Displays a banner when the user loses network connection
 */
function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: '#ef4444',
      color: 'white',
      padding: '0.75rem',
      textAlign: 'center',
      zIndex: 10000,
      fontSize: '0.875rem',
      fontWeight: 500,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
    }}>
      <span style={{ marginRight: '0.5rem' }}>⚠️</span>
      No internet connection. Some features may not be available.
    </div>
  );
}

export default OfflineIndicator;
