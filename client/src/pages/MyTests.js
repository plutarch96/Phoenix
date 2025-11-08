import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, Tag, Trash2, Search as SearchIcon, X } from 'lucide-react';
import { testsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

function MyTests() {
  const { user } = useAuth();
  const toast = useToast();
  const [tests, setTests] = useState([]);
  const [filteredTests, setFilteredTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTests, setSelectedTests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [clientFilter, setClientFilter] = useState('');
  const [clients, setClients] = useState([]);

  useEffect(() => {
    if (user?.id) {
      loadMyTests();
    }
  }, [user]);

  useEffect(() => {
    filterTests();
  }, [tests, searchQuery, statusFilter, clientFilter]);

  const loadMyTests = async () => {
    try {
      setLoading(true);
      const res = await testsAPI.getTaggedByUser(user.id);
      setTests(res.data);

      // Extract unique clients
      const uniqueClients = [...new Set(res.data.map(t => t.client_name).filter(Boolean))];
      setClients(uniqueClients);
    } catch (error) {
      console.error('Error loading my tests:', error);
      toast.error('Failed to load your tests');
    } finally {
      setLoading(false);
    }
  };

  const filterTests = () => {
    let filtered = [...tests];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(test =>
        test.title?.toLowerCase().includes(query) ||
        test.description?.toLowerCase().includes(query) ||
        test.client_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter) {
      filtered = filtered.filter(test => test.status === statusFilter);
    }

    // Client filter
    if (clientFilter) {
      filtered = filtered.filter(test => test.client_name === clientFilter);
    }

    setFilteredTests(filtered);
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedTests(filteredTests.map(t => t.id));
    } else {
      setSelectedTests([]);
    }
  };

  const handleSelectTest = (testId) => {
    setSelectedTests(prev => {
      if (prev.includes(testId)) {
        return prev.filter(id => id !== testId);
      } else {
        return [...prev, testId];
      }
    });
  };

  const handleBatchUntag = async () => {
    if (selectedTests.length === 0) return;

    const count = selectedTests.length;
    try {
      await Promise.all(
        selectedTests.map(testId => testsAPI.untagTest(testId, user.id))
      );

      toast.success(`${count} test${count > 1 ? 's' : ''} removed from My Tests`);
      setSelectedTests([]);
      loadMyTests();
    } catch (error) {
      console.error('Error untagging tests:', error);
      toast.error('Failed to untag some tests');
    }
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setClientFilter('');
  };

  const hasActiveFilters = searchQuery || statusFilter || clientFilter;

  const getStatusBadge = (status) => {
    const badges = {
      'Proposed': 'badge-secondary',
      'Planning': 'badge-warning',
      'Complete': 'badge-success',
      'Cancelled': 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>My Tests {!loading && filteredTests.length > 0 && <span style={{ fontSize: '1rem', fontWeight: 'normal', color: 'var(--text-secondary)' }}>({filteredTests.length}{tests.length !== filteredTests.length ? ` of ${tests.length}` : ''})</span>}</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Tests you've tagged for quick access
          </p>
        </div>
      </div>

      {/* Search and Filters */}
      {!loading && tests.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Search & Filter</h3>
            {hasActiveFilters && (
              <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
                <X size={16} />
                Clear Filters
              </button>
            )}
          </div>
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Search</label>
              <div style={{ position: 'relative' }}>
                <SearchIcon size={18} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
                <input
                  type="text"
                  className="form-input"
                  placeholder="Search by title, description, or client..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select
                className="form-select"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">All Statuses</option>
                <option value="Proposed">Proposed</option>
                <option value="Planning">Planning</option>
                <option value="Complete">Complete</option>
                <option value="Cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Client</label>
              <select
                className="form-select"
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
              >
                <option value="">All Clients</option>
                {clients.map(client => (
                  <option key={client} value={client}>{client}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Batch Actions */}
      {selectedTests.length > 0 && (
        <div className="card" style={{ backgroundColor: 'var(--badge-bg-info)', borderColor: 'var(--icon-blue)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Tag size={20} color="var(--icon-blue)" />
              <strong>{selectedTests.length} test{selectedTests.length > 1 ? 's' : ''} selected</strong>
            </div>
            <button className="btn btn-danger btn-sm" onClick={handleBatchUntag}>
              <Trash2 size={16} />
              Untag Selected
            </button>
          </div>
        </div>
      )}

      {/* Tests List */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading your tests...</div>
        ) : filteredTests.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>
                    <input
                      type="checkbox"
                      checked={selectedTests.length === filteredTests.length && filteredTests.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Tags</th>
                  <th>Tagged At</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTests.map(test => (
                  <tr key={test.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedTests.includes(test.id)}
                        onChange={() => handleSelectTest(test.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td>
                      <strong>{test.title}</strong>
                      {test.description && (
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {test.description.substring(0, 60)}
                          {test.description.length > 60 && '...'}
                        </div>
                      )}
                    </td>
                    <td>{test.client_name || 'N/A'}</td>
                    <td>
                      <span className={`badge ${getStatusBadge(test.status)}`}>
                        {test.status}
                      </span>
                    </td>
                    <td>
                      {test.test_date
                        ? new Date(test.test_date).toLocaleDateString()
                        : 'Not set'}
                    </td>
                    <td>
                      <div className="tags">
                        {test.tags && test.tags.slice(0, 3).map((tag, i) => (
                          <span key={i} className="tag">{tag}</span>
                        ))}
                        {test.tags && test.tags.length > 3 && (
                          <span className="tag">+{test.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {test.tagged_at
                        ? new Date(test.tagged_at).toLocaleDateString()
                        : 'N/A'}
                    </td>
                    <td>
                      <Link to={`/tests/${test.id}`} className="btn btn-primary btn-sm">
                        <Eye size={16} />
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : hasActiveFilters ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <SearchIcon size={48} />
            </div>
            <p>No tests match your filters</p>
            <button className="btn btn-primary" onClick={clearFilters} style={{ marginTop: '1rem' }}>
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Tag size={48} />
            </div>
            <p>No tests tagged yet</p>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
              Visit any test detail page and click "Tag as Mine" to add it here
            </p>
            <Link to="/tests" className="btn btn-primary" style={{ marginTop: '1rem' }}>
              Browse All Tests
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyTests;
