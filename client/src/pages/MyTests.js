import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Search, Eye, Tag } from 'lucide-react';
import { testsAPI } from '../services/api';
import { AuthContext } from '../context/AuthContext';

function MyTests() {
  const { user } = useContext(AuthContext);
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadMyTests();
    }
  }, [user]);

  const loadMyTests = async () => {
    try {
      setLoading(true);
      const res = await testsAPI.getTaggedByUser(user.id);
      setTests(res.data);
    } catch (error) {
      console.error('Error loading my tests:', error);
    } finally {
      setLoading(false);
    }
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
          <h2>My Tests</h2>
          <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
            Tests you've tagged for quick access
          </p>
        </div>
      </div>

      {/* Tests List */}
      <div className="card">
        {loading ? (
          <div className="loading">Loading your tests...</div>
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
                  <th>Tagged At</th>
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
