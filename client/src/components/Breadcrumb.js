import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumb component for navigation hierarchy
 * @param {Array} items - Array of { label, path } objects
 * Example: [{ label: 'Clients', path: '/clients' }, { label: 'Acme Corp' }]
 */
function Breadcrumb({ items = [] }) {
  if (items.length === 0) return null;

  return (
    <nav style={{
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      padding: '0.75rem 0',
      fontSize: '0.875rem',
      color: 'var(--text-secondary)',
      marginBottom: '1rem'
    }}>
      <Link
        to="/"
        style={{
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-secondary)',
          textDecoration: 'none',
          transition: 'color 0.2s'
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
        onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
      >
        <Home size={16} />
      </Link>

      {items.map((item, index) => {
        const isLast = index === items.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight size={16} style={{ color: 'var(--border-color)' }} />

            {item.path && !isLast ? (
              <Link
                to={item.path}
                style={{
                  color: 'var(--text-secondary)',
                  textDecoration: 'none',
                  transition: 'color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#3b82f6'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {item.label}
              </Link>
            ) : (
              <span style={{
                color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)',
                fontWeight: isLast ? 600 : 400
              }}>
                {item.label}
              </span>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}

export default Breadcrumb;
