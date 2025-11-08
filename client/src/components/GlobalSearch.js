import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, TestTube, Settings, X, Users, FolderOpen } from 'lucide-react';
import { searchAPI } from '../services/api';

function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ tests: [], calibrations: [], clients: [], projects: [] });
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
        setResults({ tests: [], calibrations: [], clients: [], projects: [] });
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
    } else if (type === 'client' || type === 'project') {
      navigate(`/clients`);
    }
    setQuery('');
    setShowResults(false);
  };

  const handleSeeAllResults = () => {
    navigate(`/search?q=${encodeURIComponent(query)}`);
    setQuery('');
    setShowResults(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      handleSeeAllResults();
    }
  };

  const totalResults = results.tests.length + results.calibrations.length +
                       results.clients.length + results.projects.length;

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
          placeholder="Search tests, clients, projects, equipment..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
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
        <div className="search-dropdown">
          {loading ? (
            <div style={{ padding: '1rem', textAlign: 'center' }} className="text-muted">
              Searching...
            </div>
          ) : totalResults > 0 ? (
            <>
              {results.tests.length > 0 && (
                <div>
                  <div className="search-section-header">
                    Tests ({results.tests.length})
                  </div>
                  {results.tests.map(test => (
                    <div
                      key={test.id}
                      onClick={() => handleResultClick('test', test.id)}
                      className="search-result-item"
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
                  <div className="search-section-header">
                    Equipment ({results.calibrations.length})
                  </div>
                  {results.calibrations.map(cal => (
                    <div
                      key={cal.id}
                      onClick={() => handleResultClick('calibration', cal.id)}
                      className="search-result-item"
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

              {results.clients.length > 0 && (
                <div>
                  <div className="search-section-header">
                    Clients ({results.clients.length})
                  </div>
                  {results.clients.map(client => (
                    <div
                      key={client.id}
                      onClick={() => handleResultClick('client', client.id)}
                      className="search-result-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#dbeafe',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <Users size={16} color="#3b82f6" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '0.125rem' }}>
                            {client.name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {client.client_number && `#${client.client_number} • `}
                            {client.contact_email || 'Client'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {results.projects.length > 0 && (
                <div>
                  <div className="search-section-header">
                    Projects ({results.projects.length})
                  </div>
                  {results.projects.map(project => (
                    <div
                      key={project.id}
                      onClick={() => handleResultClick('project', project.id)}
                      className="search-result-item"
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div style={{
                          width: '32px',
                          height: '32px',
                          borderRadius: '6px',
                          background: '#fef3c7',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}>
                          <FolderOpen size={16} color="#f59e0b" />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 500, marginBottom: '0.125rem' }}>
                            {project.project_name}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                            {project.client_name && `${project.client_name} • `}
                            #{project.client_number}-{project.project_number}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {totalResults > 0 && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderTop: '1px solid var(--border)',
                    textAlign: 'center',
                    cursor: 'pointer',
                    background: 'var(--bg-secondary)'
                  }}
                  onClick={handleSeeAllResults}
                  className="search-result-item"
                >
                  <div style={{ fontWeight: 500, color: 'var(--color-primary)' }}>
                    See all {totalResults} result{totalResults !== 1 ? 's' : ''} →
                  </div>
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
