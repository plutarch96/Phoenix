import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search, TestTube, Settings, Users, FolderOpen,
  Image as ImageIcon, Film, ArrowLeft, Filter, X
} from 'lucide-react';
import { searchAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const tab = searchParams.get('tab') || 'all';

  const [results, setResults] = useState({ tests: [], calibrations: [], clients: [], projects: [] });
  const [mediaResults, setMediaResults] = useState({ media: [], matchingTests: [] });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(tab);
  const [filters, setFilters] = useState({
    testType: '',
    status: '',
    standard: ''
  });
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    if (query.trim().length >= 2) {
      performSearch();
    }
  }, [query]);

  const performSearch = async () => {
    setLoading(true);
    try {
      const [globalRes, mediaRes] = await Promise.all([
        searchAPI.global(query),
        searchAPI.media(query)
      ]);
      setResults(globalRes.data);
      setMediaResults(mediaRes.data);
    } catch (error) {
      console.error('Search error:', error);
      toast.error('Failed to perform search');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams({ q: query, tab: newTab });
  };

  const handleTestClick = (id) => {
    navigate(`/tests/${id}`);
  };

  const handleCalibrationClick = () => {
    navigate('/calibrations');
  };

  const handleClientClick = () => {
    navigate('/clients');
  };

  const filteredTests = results.tests.filter(test => {
    if (filters.testType && test.test_type !== filters.testType) return false;
    if (filters.status && test.status !== filters.status) return false;
    if (filters.standard && test.governing_standard !== filters.standard) return false;
    return true;
  });

  const uniqueTestTypes = [...new Set(results.tests.map(t => t.test_type).filter(Boolean))];
  const uniqueStatuses = [...new Set(results.tests.map(t => t.status).filter(Boolean))];
  const uniqueStandards = [...new Set(results.tests.map(t => t.governing_standard).filter(Boolean))];

  const totalResults = results.tests.length + results.calibrations.length +
                       results.clients.length + results.projects.length;

  const hasActiveFilters = filters.testType || filters.status || filters.standard;

  const clearFilters = () => {
    setFilters({ testType: '', status: '', standard: '' });
  };

  return (
    <div className="page">
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <button
            onClick={() => navigate(-1)}
            className="btn btn-secondary"
            style={{ padding: '0.5rem' }}
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="page-title">Search Results</h1>
            <p className="text-muted" style={{ marginTop: '0.25rem' }}>
              {totalResults} result{totalResults !== 1 ? 's' : ''} for "{query}"
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs" style={{ marginBottom: '1.5rem' }}>
        <button
          className={`tab ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => handleTabChange('all')}
        >
          All Results ({totalResults})
        </button>
        <button
          className={`tab ${activeTab === 'tests' ? 'active' : ''}`}
          onClick={() => handleTabChange('tests')}
        >
          <TestTube size={16} />
          Tests ({results.tests.length})
        </button>
        <button
          className={`tab ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => handleTabChange('equipment')}
        >
          <Settings size={16} />
          Equipment ({results.calibrations.length})
        </button>
        <button
          className={`tab ${activeTab === 'clients' ? 'active' : ''}`}
          onClick={() => handleTabChange('clients')}
        >
          <Users size={16} />
          Clients ({results.clients.length})
        </button>
        <button
          className={`tab ${activeTab === 'projects' ? 'active' : ''}`}
          onClick={() => handleTabChange('projects')}
        >
          <FolderOpen size={16} />
          Projects ({results.projects.length})
        </button>
        <button
          className={`tab ${activeTab === 'media' ? 'active' : ''}`}
          onClick={() => handleTabChange('media')}
        >
          <ImageIcon size={16} />
          Media ({mediaResults.totalMedia || 0})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loading">Searching...</div>
        </div>
      ) : (
        <>
          {/* Filters for Tests */}
          {(activeTab === 'all' || activeTab === 'tests') && results.tests.length > 0 && (
            <div className="card" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Filter size={16} />
                  <span style={{ fontWeight: 500 }}>Filters:</span>
                </div>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={filters.testType}
                  onChange={(e) => setFilters({ ...filters, testType: e.target.value })}
                >
                  <option value="">All Test Types</option>
                  {uniqueTestTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  {uniqueStatuses.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>

                <select
                  className="form-select"
                  style={{ width: 'auto', minWidth: '150px' }}
                  value={filters.standard}
                  onChange={(e) => setFilters({ ...filters, standard: e.target.value })}
                >
                  <option value="">All Standards</option>
                  {uniqueStandards.map(standard => (
                    <option key={standard} value={standard}>{standard}</option>
                  ))}
                </select>

                {hasActiveFilters && (
                  <button
                    className="btn btn-secondary"
                    onClick={clearFilters}
                    style={{ padding: '0.5rem 0.75rem' }}
                  >
                    <X size={16} />
                    Clear Filters
                  </button>
                )}
              </div>
            </div>
          )}

          {/* All Results View */}
          {activeTab === 'all' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
              {filteredTests.length > 0 && (
                <ResultSection
                  title="Tests"
                  icon={<TestTube size={20} />}
                  count={filteredTests.length}
                >
                  {filteredTests.map(test => (
                    <TestCard key={test.id} test={test} onClick={() => handleTestClick(test.id)} />
                  ))}
                </ResultSection>
              )}

              {results.calibrations.length > 0 && (
                <ResultSection
                  title="Equipment"
                  icon={<Settings size={20} />}
                  count={results.calibrations.length}
                >
                  {results.calibrations.map(cal => (
                    <EquipmentCard key={cal.id} equipment={cal} onClick={handleCalibrationClick} />
                  ))}
                </ResultSection>
              )}

              {results.clients.length > 0 && (
                <ResultSection
                  title="Clients"
                  icon={<Users size={20} />}
                  count={results.clients.length}
                >
                  {results.clients.map(client => (
                    <ClientCard key={client.id} client={client} onClick={handleClientClick} />
                  ))}
                </ResultSection>
              )}

              {results.projects.length > 0 && (
                <ResultSection
                  title="Projects"
                  icon={<FolderOpen size={20} />}
                  count={results.projects.length}
                >
                  {results.projects.map(project => (
                    <ProjectCard key={project.id} project={project} onClick={handleClientClick} />
                  ))}
                </ResultSection>
              )}
            </div>
          )}

          {/* Tests Only View */}
          {activeTab === 'tests' && (
            <div className="grid grid-2">
              {filteredTests.length > 0 ? (
                filteredTests.map(test => (
                  <TestCard key={test.id} test={test} onClick={() => handleTestClick(test.id)} />
                ))
              ) : (
                <EmptyState message="No tests found" />
              )}
            </div>
          )}

          {/* Equipment Only View */}
          {activeTab === 'equipment' && (
            <div className="grid grid-2">
              {results.calibrations.length > 0 ? (
                results.calibrations.map(cal => (
                  <EquipmentCard key={cal.id} equipment={cal} onClick={handleCalibrationClick} />
                ))
              ) : (
                <EmptyState message="No equipment found" />
              )}
            </div>
          )}

          {/* Clients Only View */}
          {activeTab === 'clients' && (
            <div className="grid grid-2">
              {results.clients.length > 0 ? (
                results.clients.map(client => (
                  <ClientCard key={client.id} client={client} onClick={handleClientClick} />
                ))
              ) : (
                <EmptyState message="No clients found" />
              )}
            </div>
          )}

          {/* Projects Only View */}
          {activeTab === 'projects' && (
            <div className="grid grid-2">
              {results.projects.length > 0 ? (
                results.projects.map(project => (
                  <ProjectCard key={project.id} project={project} onClick={handleClientClick} />
                ))
              ) : (
                <EmptyState message="No projects found" />
              )}
            </div>
          )}

          {/* Media View */}
          {activeTab === 'media' && (
            <div>
              {mediaResults.media && mediaResults.media.length > 0 ? (
                <>
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ marginBottom: '0.5rem' }}>
                      Found {mediaResults.totalMedia} media file{mediaResults.totalMedia !== 1 ? 's' : ''}
                      {' '}from {mediaResults.totalTests} test{mediaResults.totalTests !== 1 ? 's' : ''}
                    </h3>
                    <p className="text-muted">
                      Showing images and videos from tests matching "{query}"
                    </p>
                  </div>
                  <div className="grid grid-3">
                    {mediaResults.media.map(media => (
                      <MediaCard
                        key={media.id}
                        media={media}
                        onClick={() => handleTestClick(media.test_id)}
                      />
                    ))}
                  </div>
                </>
              ) : (
                <EmptyState message="No media found" />
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Helper Components
function ResultSection({ title, icon, count, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
        {icon}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 600 }}>
          {title} ({count})
        </h2>
      </div>
      <div className="grid grid-2">
        {children}
      </div>
    </div>
  );
}

function TestCard({ test, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'var(--color-danger-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <TestTube size={24} color="var(--color-danger)" />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {test.title}
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
            {test.client_name && <span>{test.client_name} • </span>}
            {test.test_type || 'Test'}
            {test.governing_standard && <span> • {test.governing_standard}</span>}
          </div>
          {test.tags && test.tags.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {test.tags.slice(0, 3).map((tag, idx) => (
                <span key={idx} className="badge badge-info">{tag}</span>
              ))}
              {test.tags.length > 3 && (
                <span className="badge badge-secondary">+{test.tags.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <span className={`badge badge-${test.status === 'Complete' ? 'success' : test.status === 'Planning' ? 'warning' : test.status === 'Cancelled' ? 'danger' : 'secondary'}`}>
          {test.status}
        </span>
      </div>
    </div>
  );
}

function EquipmentCard({ equipment, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'var(--color-success-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Settings size={24} color="var(--color-success)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {equipment.equipment_name}
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {equipment.equipment_id} • {equipment.equipment_type}
          </div>
        </div>
        <span className={`badge badge-${equipment.status === 'valid' ? 'success' : 'danger'}`}>
          {equipment.status}
        </span>
      </div>
    </div>
  );
}

function ClientCard({ client, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'var(--color-primary-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <Users size={24} color="var(--color-primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {client.name}
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {client.client_number && <span>#{client.client_number} • </span>}
            {client.contact_email || 'No contact email'}
          </div>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, onClick }) {
  return (
    <div className="card card-hover" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '8px',
          background: 'var(--color-warning-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0
        }}>
          <FolderOpen size={24} color="var(--color-warning)" />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>
            {project.project_name}
          </h3>
          <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            {project.client_name && <span>{project.client_name} • </span>}
            #{project.client_number}-{project.project_number}
          </div>
        </div>
      </div>
    </div>
  );
}

function MediaCard({ media, onClick }) {
  const isVideo = media.media_type === 'video';
  const fileUrl = media.file_path;

  return (
    <div className="card card-hover" onClick={onClick} style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
      <div style={{
        width: '100%',
        height: '200px',
        background: 'var(--bg-tertiary)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
      }}>
        {isVideo ? (
          <>
            <video
              src={fileUrl}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <div style={{
              position: 'absolute',
              top: '0.5rem',
              right: '0.5rem',
              background: 'rgba(0, 0, 0, 0.7)',
              borderRadius: '4px',
              padding: '0.25rem 0.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <Film size={14} color="white" />
              <span style={{ fontSize: '0.75rem', color: 'white' }}>Video</span>
            </div>
          </>
        ) : (
          <img
            src={fileUrl}
            alt={media.file_name}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.parentElement.innerHTML = '<div style="display: flex; flex-direction: column; align-items: center; gap: 0.5rem;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg><span style="font-size: 0.875rem; color: var(--text-secondary);">Image unavailable</span></div>';
            }}
          />
        )}
      </div>
      <div style={{ padding: '1rem' }}>
        <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>
          {media.file_name}
        </h4>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
          From: {media.test_title}
        </div>
        {media.test_type && (
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
            {media.test_type}
            {media.governing_standard && <span> • {media.governing_standard}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div style={{
      gridColumn: '1 / -1',
      textAlign: 'center',
      padding: '3rem',
      color: 'var(--text-secondary)'
    }}>
      <Search size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
      <p>{message}</p>
    </div>
  );
}

export default SearchResults;
