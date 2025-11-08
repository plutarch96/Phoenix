import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TestTube, Settings, X } from 'lucide-react';
import { searchAPI } from '../services/api';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tests: [], calibrations: [] });
  const [showResults, setShowResults] = useState(false);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length >= 2) {
        performSearch();
      } else {
        setResults({ tests: [], calibrations: [] });
        setShowResults(false);
      }
    }, 300);

    return () => clearTimeout(searchTimeout);
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const res = await searchAPI.global(query);
      setResults(res.data);
      setShowResults(true);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (type, id) => {
    if (type === 'test') {
      navigate(`/tests/${id}`);
    } else if (type === 'calibration') {
      navigate(`/calibrations`);
    }
    setQuery('');
    setShowResults(false);
  };

  const totalResults = results.tests.length + results.calibrations.length;

  return (
    <div ref={searchRef} style={{ position: 'relative', width: '100%', maxWidth: '400px' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: '12px',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748b'
          }}
        />
        <input
          type="text"
          className="form-input"
          style={{
            paddingLeft: '40px',
            paddingRight: query ? '40px' : '12px',
            fontSize: '0.875rem'
          }}
          placeholder="Search tests, equipment..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setShowResults(false);
            }}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <X size={16} color="#64748b" />
          </button>
        )}
      </div>

      {showResults && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          right: 0,
          background: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          maxHeight: '400px',
          overflowY: 'auto',
          zIndex: 1000
        }}>
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center', color: '#64748b' }}>
              Searching...
            </div>
          ) : totalResults > 0 ? (
            <>
              {results.tests.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f9fafb',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Tests ({results.tests.length})
                  </div>
                  {results.tests.map(test => (
                    <div
                      key={test.id}
                      onClick={() => handleResultClick('test', test.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#fee2e2',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <TestTube size={16} color="#dc2626" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '0.125rem' }}>
                            {test.title}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {test.client_name && `${test.client_name} • `}
                            {test.test_type || 'Test'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.calibrations.length > 0 && (
                <div>
                  <div style={{
                    padding: '0.75rem 1rem',
                    background: '#f9fafb',
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: '#64748b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em'
                  }}>
                    Equipment ({results.calibrations.length})
                  </div>
                  {results.calibrations.map(cal => (
                    <div
                      key={cal.id}
                      onClick={() => handleResultClick('calibration', cal.id)}
                      style={{
                        padding: '0.75rem 1rem',
                        borderBottom: '1px solid #e5e7eb',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = '#f9fafb'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#d1fae5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Settings size={16} color="#10b981" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '0.125rem' }}>
                            {cal.equipment_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {cal.equipment_id} • {cal.equipment_type}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
              <Search size={32} style={{ marginBottom: '0.5rem', opacity: 0.5 }} />
              <p>No results found for "{query}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GlobalSearch;
