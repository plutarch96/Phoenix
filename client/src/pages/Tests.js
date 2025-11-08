import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Eye } from 'lucide-react';
import { testsAPI, clientsAPI, analyticsAPI } from '../services/api';
import TestModal from '../components/TestModal';

function Tests() {
  const [tests, setTests] = useState([]);
  const [clients, setClients] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [filters, setFilters] = useState({
    client_id: '',
    status: '',
    tag: ''
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [testsRes, clientsRes, tagsRes] = await Promise.all([
        testsAPI.getAll(filters),
        clientsAPI.getAll(),
        analyticsAPI.getAllTags()
      ]);
      setTests(testsRes.data);
      setClients(clientsRes.data);
      setTags(tagsRes.data);
    } catch (error) {
      console.error('Error loading tests:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestCreated = () => {
    setShowModal(false);
    loadData();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({ client_id: '', status: '', tag: '' });
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      'in-progress': 'badge-info',
      completed: 'badge-success',
      failed: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Tests</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          New Test
        </button>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Filter size={20} />
            <span className="card-title">Filters</span>
          </div>
          {(filters.client_id || filters.status || filters.tag) && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Client</label>
            <select
              className="form-select"
              value={filters.client_id}
              onChange={(e) => handleFilterChange('client_id', e.target.value)}
            >
              <option value="">All Clients</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Tag</label>
            <select
              className="form-select"
              value={filters.tag}
              onChange={(e) => handleFilterChange('tag', e.target.value)}
            >
              <option value="">All Tags</option>
              {tags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tests List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Tests ({tests.length})</h3>
        </div>
        {loading ? (
          <div className="loading">Loading tests...</div>
        ) : tests.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Client</th>
                  <th>Status</th>
                  <th>Date</th>
                  <th>Tags</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <tr key={test.id}>
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
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={48} />
            </div>
            <p>No tests found</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Create Your First Test
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <TestModal
          onClose={() => setShowModal(false)}
          onSuccess={handleTestCreated}
          clients={clients}
        />
      )}
    </div>
  );
}

export default Tests;
