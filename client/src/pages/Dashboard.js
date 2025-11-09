import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  TestTube,
  Users,
  Settings,
  AlertTriangle,
  FileText,
  Image,
  Video,
  TrendingUp,
  Activity
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentTests, setRecentTests] = useState([]);
  const [expiringCalibrations, setExpiringCalibrations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, testsRes, calibrationsRes, activityRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getRecentTests(5),
        analyticsAPI.getExpiringSoonCalibrations(),
        analyticsAPI.getRecentActivity(10)
      ]);
      setStats(statsRes.data);
      setRecentTests(testsRes.data);
      setExpiringCalibrations(calibrationsRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  const getDaysUntilExpiration = (expirationDate) => {
    const today = new Date();
    const expDate = new Date(expirationDate);
    const diffTime = expDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return <div className="page"><div className="loading">Loading dashboard...</div></div>;
  }

  const getStatusCount = (status) => {
    const found = stats?.testsByStatus?.find(s => s.status === status);
    return found ? found.count : 0;
  };

  const getMediaCount = (type) => {
    const found = stats?.mediaByType?.find(m => m.media_type === type);
    return found ? found.count : 0;
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Dashboard</h2>
      </div>

      {/* Main Stats */}
      <div className="stats-grid">
        <Link to="/tests" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon blue">
                <TestTube size={24} />
              </div>
            </div>
            <div className="stat-value">{stats?.totalTests || 0}</div>
            <div className="stat-label">Total Tests</div>
            <div className="tags" style={{ marginTop: '0.75rem' }}>
              <span className="badge badge-warning">{getStatusCount('Planning')} Planning</span>
              <span className="badge badge-success">{getStatusCount('Complete')} Complete</span>
            </div>
          </div>
        </Link>

        <Link to="/clients" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon green">
                <Users size={24} />
              </div>
            </div>
            <div className="stat-value">{stats?.totalClients || 0}</div>
            <div className="stat-label">Clients</div>
          </div>
        </Link>

        <Link to="/calibrations" style={{ textDecoration: 'none' }}>
          <div className="stat-card">
            <div className="stat-header">
              <div className="stat-icon yellow">
                <Settings size={24} />
              </div>
            </div>
            <div className="stat-value">{stats?.totalCalibrations || 0}</div>
            <div className="stat-label">Calibration Equipment</div>
            {stats?.expiredCalibrations > 0 && (
              <div className="tags" style={{ marginTop: '0.75rem' }}>
                <span className="badge badge-danger">
                  {stats.expiredCalibrations} Expired
                </span>
              </div>
            )}
          </div>
        </Link>

        <div className="stat-card">
          <div className="stat-header">
            <div className="stat-icon blue">
              <FileText size={24} />
            </div>
          </div>
          <div className="stat-value">{stats?.totalMediaFiles || 0}</div>
          <div className="stat-label">Media Files</div>
          <div className="tags" style={{ marginTop: '0.75rem' }}>
            <span className="tag">
              <Image size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {getMediaCount('image')} Images
            </span>
            <span className="tag">
              <Video size={12} style={{ display: 'inline', marginRight: '4px' }} />
              {getMediaCount('video')} Videos
            </span>
          </div>
        </div>
      </div>

      {/* Alerts */}
      {(stats?.expiredCalibrations > 0 || stats?.upcomingExpirations > 0) && (
        <div className="card alert-box">
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} style={{ color: 'var(--icon-yellow)' }} />
            <div>
              <h3>Calibration Alerts</h3>
              {stats.expiredCalibrations > 0 && (
                <p>
                  ⚠️ {stats.expiredCalibrations} calibration(s) have expired
                </p>
              )}
              {stats.upcomingExpirations > 0 && (
                <p>
                  📅 {stats.upcomingExpirations} calibration(s) expiring within 30 days
                </p>
              )}
              <Link to="/calibrations">
                View Calibrations →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Tests and Expiring Calibrations */}
      <div className="grid-2-cols">
        {/* Recent Tests */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Tests</h3>
          </div>
          {recentTests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {recentTests.map((test) => (
                <Link
                  key={test.id}
                  to={`/tests/${test.id}`}
                  className="dashboard-list-item"
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                    <strong className="dashboard-item-title">{test.title}</strong>
                    <span className={`badge ${
                      test.status === 'Complete' ? 'badge-success' :
                      test.status === 'Planning' ? 'badge-warning' :
                      test.status === 'Proposed' ? 'badge-secondary' : 'badge-danger'
                    }`}>
                      {test.status}
                    </span>
                  </div>
                  <div className="dashboard-item-meta">
                    {test.test_type && <span>Type: {test.test_type}</span>}
                    <span>Created: {formatDate(test.created_at)}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No recent tests</p>
            </div>
          )}
        </div>

        {/* Expiring Calibrations */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Equipment Expiring Soon</h3>
          </div>
          {expiringCalibrations.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {expiringCalibrations.map((calibration) => {
                const daysLeft = getDaysUntilExpiration(calibration.expiration_date);
                const isUrgent = daysLeft <= 7;
                return (
                  <Link
                    key={calibration.id}
                    to="/calibrations"
                    className={`dashboard-list-item ${isUrgent ? 'dashboard-list-item-urgent' : ''}`}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                      <strong className="dashboard-item-title">{calibration.equipment_name}</strong>
                      <span className={`badge ${isUrgent ? 'badge-danger' : 'badge-warning'}`}>
                        {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="dashboard-item-meta">
                      <span>ID: {calibration.equipment_id}</span>
                      <span>Expires: {formatDate(calibration.expiration_date)}</span>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>No equipment expiring in the next 30 days</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Activity size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Recent Activity
          </h3>
        </div>
        {recentActivity.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {recentActivity.map((activity, index) => {
              const ActivityWrapper = activity.link ? Link : 'div';
              const wrapperProps = activity.link
                ? { to: activity.link, className: 'dashboard-list-item' }
                : { className: 'dashboard-list-item', style: { cursor: 'default' } };

              return (
                <ActivityWrapper key={index} {...wrapperProps}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '0.25rem' }}>
                    <strong className="dashboard-item-title">{activity.description || 'Activity'}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {activity.action && (
                        <span className={`badge ${
                          activity.action === 'created' ? 'badge-success' :
                          activity.action === 'updated' ? 'badge-warning' :
                          'badge-secondary'
                        }`} style={{ fontSize: '0.7rem' }}>
                          {activity.action}
                        </span>
                      )}
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {formatDate(activity.timestamp || activity.created_at)}
                      </span>
                    </div>
                  </div>
                  {activity.details && (
                    <div className="dashboard-item-meta">
                      <span>{activity.details}</span>
                    </div>
                  )}
                </ActivityWrapper>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>No recent activity</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
