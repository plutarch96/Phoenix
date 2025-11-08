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
  TrendingUp
} from 'lucide-react';
import { analyticsAPI } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [statsRes, activityRes] = await Promise.all([
        analyticsAPI.getDashboard(),
        analyticsAPI.getRecentActivity(5)
      ]);
      setStats(statsRes.data);
      setRecentActivity(activityRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
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
        <p>Overview of your test tracking system</p>
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
              <span className="badge badge-info">{getStatusCount('pending')} Pending</span>
              <span className="badge badge-success">{getStatusCount('completed')} Completed</span>
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
        <div className="card" style={{ background: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <AlertTriangle size={24} color="#f59e0b" />
            <div>
              <h3 style={{ marginBottom: '0.5rem', color: '#92400e' }}>Calibration Alerts</h3>
              {stats.expiredCalibrations > 0 && (
                <p style={{ color: '#78350f', marginBottom: '0.25rem' }}>
                  ⚠️ {stats.expiredCalibrations} calibration(s) have expired
                </p>
              )}
              {stats.upcomingExpirations > 0 && (
                <p style={{ color: '#78350f' }}>
                  📅 {stats.upcomingExpirations} calibration(s) expiring within 30 days
                </p>
              )}
              <Link to="/calibrations" style={{ color: '#92400e', fontWeight: 600, marginTop: '0.5rem', display: 'inline-block' }}>
                View Calibrations →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Recent Activity</h3>
          <TrendingUp size={20} color="#64748b" />
        </div>
        {recentActivity.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recentActivity.map((activity, index) => (
                  <tr key={index}>
                    <td>
                      <span className={`badge ${activity.type === 'test' ? 'badge-info' : 'badge-success'}`}>
                        {activity.type}
                      </span>
                    </td>
                    <td>{activity.title}</td>
                    <td>{new Date(activity.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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
