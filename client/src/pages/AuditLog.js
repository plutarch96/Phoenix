import React, { useState, useEffect } from 'react';
import { Activity, Filter, User, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { auditAPI } from '../services/auditAPI';

function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    entity_type: '',
    start_date: '',
    end_date: '',
    page: 1,
    limit: 50
  });

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const res = await auditAPI.getAll(filters);
      setLogs(res.data.logs);
      setPagination(res.data.pagination);
    } catch (error) {
      console.error('Error loading audit logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };

  const clearFilters = () => {
    setFilters({
      action: '',
      entity_type: '',
      start_date: '',
      end_date: '',
      page: 1,
      limit: 50
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getActionBadge = (action) => {
    const badges = {
      CREATE: 'badge-success',
      UPDATE: 'badge-info',
      DELETE: 'badge-danger',
      LOGIN: 'badge-success',
      LOGOUT: 'badge-info',
      VIEW: 'badge-info'
    };
    return badges[action] || 'badge-info';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Audit Log</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Filters</h3>
          {(filters.action || filters.entity_type || filters.start_date || filters.end_date) && (
            <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
        <div className="grid grid-2">
          <div className="form-group">
            <label className="form-label">Action</label>
            <select
              className="form-select"
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="LOGIN">Login</option>
              <option value="LOGOUT">Logout</option>
              <option value="VIEW">View</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Entity Type</label>
            <select
              className="form-select"
              value={filters.entity_type}
              onChange={(e) => handleFilterChange('entity_type', e.target.value)}
            >
              <option value="">All Entity Types</option>
              <option value="test">Test</option>
              <option value="calibration">Calibration</option>
              <option value="client">Client</option>
              <option value="project">Project</option>
              <option value="user">User</option>
              <option value="media">Media</option>
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Start Date</label>
            <input
              type="datetime-local"
              className="form-input"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label className="form-label">End Date</label>
            <input
              type="datetime-local"
              className="form-input"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading audit logs...</div>
        ) : logs.length > 0 ? (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>User</th>
                    <th>Action</th>
                    <th>Entity</th>
                    <th>Details</th>
                    <th>IP Address</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map(log => (
                    <tr key={log.id}>
                      <td style={{ whiteSpace: 'nowrap' }}>{formatDate(log.timestamp)}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <User size={16} />
                          <div>
                            <strong>{log.username || 'Unknown'}</strong>
                            {log.user_id && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                ID: {log.user_id}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${getActionBadge(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>
                        {log.entity_type ? (
                          <div>
                            <strong>{log.entity_type}</strong>
                            {log.entity_id && (
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                                ID: {log.entity_id}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>N/A</span>
                        )}
                      </td>
                      <td>
                        {log.details ? (
                          <div style={{
                            maxWidth: '300px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            fontSize: '0.875rem'
                          }}>
                            {log.details}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-secondary)' }}>-</span>
                        )}
                      </td>
                      <td style={{ fontSize: '0.875rem' }}>
                        {log.ip_address || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '1.5rem',
                padding: '1rem 0'
              }}>
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                  Showing page {pagination.page} of {pagination.totalPages} ({pagination.total} total records)
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page === 1}
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page === pagination.totalPages}
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Activity size={48} />
            </div>
            <p>No audit logs found</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuditLog;
