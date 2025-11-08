import React, { useState, useEffect } from 'react';
import { Users as UsersIcon, Plus, Shield, User as UserIcon, Briefcase } from 'lucide-react';
import { authAPI, clientsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserModal from '../components/UserModal';

function Users() {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAdmin()) {
      // Only admins can access this page
      window.location.href = '/';
      return;
    }
    loadUsers();
    loadClients();
  }, []);

  const loadUsers = async () => {
    try {
      const res = await authAPI.getUsers();
      setUsers(res.data);
    } catch (error) {
      console.error('Error loading users:', error);
      alert('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await clientsAPI.getAll();
      setClients(res.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleUserCreated = () => {
    setShowModal(false);
    loadUsers();
  };

  const getRoleIcon = (role) => {
    switch (role) {
      case 'admin':
        return <Shield size={16} color="#ef4444" />;
      case 'employee':
        return <Briefcase size={16} color="#3b82f6" />;
      case 'client':
        return <UserIcon size={16} color="#10b981" />;
      default:
        return <UserIcon size={16} />;
    }
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'badge-danger',
      employee: 'badge-info',
      client: 'badge-success'
    };
    return badges[role] || 'badge-secondary';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  const getClientName = (clientId) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || 'N/A';
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading">Loading users...</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>User Management</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add User
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <UsersIcon size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            All Users ({users.length})
          </h3>
        </div>

        {users.length === 0 ? (
          <div className="empty-state">
            No users found. Click "Add User" to create one.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>User</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Email</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Role</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Client</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Status</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Created</th>
                  <th style={{ padding: '0.75rem', fontWeight: 600, color: '#64748b' }}>Last Login</th>
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {getRoleIcon(user.role)}
                        <strong>{user.username}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>{user.email}</td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${getRoleBadge(user.role)}`}>
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b' }}>
                      {user.role === 'client' ? getClientName(user.client_id) : '-'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge ${user.is_active ? 'badge-success' : 'badge-danger'}`}>
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                      {formatDate(user.created_at)}
                    </td>
                    <td style={{ padding: '0.75rem', color: '#64748b', fontSize: '0.875rem' }}>
                      {formatDate(user.last_login)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Role Explanations */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">User Roles</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1rem', background: '#fef2f2', borderRadius: '8px', borderLeft: '4px solid #ef4444' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Shield size={20} color="#ef4444" />
              <strong style={{ color: '#991b1b' }}>Admin</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#7f1d1d', margin: 0 }}>
              Full access to all features, can manage users, clients, tests, and calibrations.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#eff6ff', borderRadius: '8px', borderLeft: '4px solid #3b82f6' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <Briefcase size={20} color="#3b82f6" />
              <strong style={{ color: '#1e40af' }}>Employee (FRA)</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#1e3a8a', margin: 0 }}>
              FRA employees can view and manage tests, calibrations, and client information.
            </p>
          </div>

          <div style={{ padding: '1rem', background: '#f0fdf4', borderRadius: '8px', borderLeft: '4px solid #10b981' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
              <UserIcon size={20} color="#10b981" />
              <strong style={{ color: '#065f46' }}>Client</strong>
            </div>
            <p style={{ fontSize: '0.875rem', color: '#064e3b', margin: 0 }}>
              Limited access to view only their own tests, projects, and reports. No editing capabilities.
            </p>
          </div>
        </div>
      </div>

      {showModal && (
        <UserModal
          clients={clients}
          onClose={() => setShowModal(false)}
          onSuccess={handleUserCreated}
        />
      )}
    </div>
  );
}

export default Users;
