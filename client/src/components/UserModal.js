import React, { useState } from 'react';
import { X, Shield, Briefcase, User as UserIcon } from 'lucide-react';
import { authAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

function UserModal({ user, clients, onClose, onSuccess }) {
  const toast = useToast();
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    password: '',
    role: user?.role || '',
    client_id: user?.client_id || '',
    is_active: user?.is_active !== undefined ? user.is_active : 1
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        client_id: formData.role === 'client' ? formData.client_id : null
      };

      // Remove password if empty (when editing and not changing password)
      if (user && !data.password) {
        delete data.password;
      }

      if (user) {
        await authAPI.updateUser(user.id, data);
      } else {
        await authAPI.register(data);
      }
      setSuccess(true);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || `Failed to ${user ? 'update' : 'create'} user`);
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <div className="modal-overlay" onClick={success ? onSuccess : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{user ? 'Edit User' : 'Create New User'}</h2>
          <button onClick={success ? onSuccess : onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {success ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div style={{
              width: '64px',
              height: '64px',
              background: '#10b981',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem'
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>
            <h3 style={{ marginBottom: '0.5rem' }}>Success!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
              User has been {user ? 'updated' : 'created'} successfully.
              {!user && ' They can now log in with their credentials.'}
            </p>
            <button className="btn btn-primary" onClick={onSuccess}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Username *</label>
            <input
              type="text"
              name="username"
              className="form-input"
              value={formData.username}
              onChange={handleChange}
              required
              placeholder="e.g., jsmith"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Email *</label>
            <input
              type="email"
              name="email"
              className="form-input"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="e.g., jsmith@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password *</label>
            <input
              type="password"
              name="password"
              className="form-input"
              value={formData.password}
              onChange={handleChange}
              required
              minLength="6"
              placeholder="Minimum 6 characters"
            />
            <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              User will be able to change this after their first login
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">User Role *</label>
            <select
              name="role"
              className="form-select"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="">Select a role...</option>
              <option value="admin">Admin - Full system access & logs</option>
              <option value="project_manager">Project Manager - Edit & delete everything</option>
              <option value="staff">Staff - Manage calibrations</option>
              <option value="client">Client - Limited view-only access</option>
            </select>
          </div>

          {formData.role === 'client' && (
            <div className="form-group">
              <label className="form-label">Assign to Client *</label>
              <select
                name="client_id"
                className="form-select"
                value={formData.client_id}
                onChange={handleChange}
                required
              >
                <option value="">Select a client...</option>
                {clients.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                This user will only see information for this client
              </p>
            </div>
          )}

          {/* Role descriptions */}
          {formData.role && (
            <div style={{
              padding: '1rem',
              background: formData.role === 'admin' ? '#fef2f2' : formData.role === 'project_manager' ? '#fef3c7' : formData.role === 'staff' ? '#eff6ff' : '#f0fdf4',
              borderRadius: '8px',
              borderLeft: `4px solid ${formData.role === 'admin' ? '#ef4444' : formData.role === 'project_manager' ? '#f59e0b' : formData.role === 'staff' ? '#3b82f6' : '#10b981'}`,
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {formData.role === 'admin' && <Shield size={18} color="#ef4444" />}
                {formData.role === 'project_manager' && <Shield size={18} color="#f59e0b" />}
                {formData.role === 'staff' && <Briefcase size={18} color="#3b82f6" />}
                {formData.role === 'client' && <UserIcon size={18} color="#10b981" />}
                <strong style={{
                  color: formData.role === 'admin' ? '#991b1b' : formData.role === 'project_manager' ? '#92400e' : formData.role === 'staff' ? '#1e40af' : '#065f46'
                }}>
                  {formData.role === 'admin' ? 'Admin Access' : formData.role === 'project_manager' ? 'Project Manager Access' : formData.role === 'staff' ? 'Staff Access' : 'Client Access'}
                </strong>
              </div>
              <ul style={{
                fontSize: '0.875rem',
                color: formData.role === 'admin' ? '#7f1d1d' : formData.role === 'project_manager' ? '#78350f' : formData.role === 'staff' ? '#1e3a8a' : '#064e3b',
                marginLeft: '1.5rem',
                marginBottom: 0
              }}>
                {formData.role === 'admin' && (
                  <>
                    <li>Full access to all features</li>
                    <li>Can access audit logs</li>
                    <li>Can create and manage users</li>
                    <li>Can manage all clients, projects, and tests</li>
                    <li>Can view and modify calibration records</li>
                  </>
                )}
                {formData.role === 'project_manager' && (
                  <>
                    <li>Can edit and delete everything</li>
                    <li>Can manage all clients, projects, and tests</li>
                    <li>Can manage calibration records</li>
                    <li>Cannot access audit logs</li>
                    <li>Cannot create or manage users</li>
                  </>
                )}
                {formData.role === 'staff' && (
                  <>
                    <li>Can upload and download files</li>
                    <li>Can edit and delete calibrations</li>
                    <li>Can view clients, projects, and tests</li>
                    <li>Cannot edit or delete clients/projects/tests</li>
                    <li>Cannot create or manage users</li>
                  </>
                )}
                {formData.role === 'client' && (
                  <>
                    <li>View-only access to their own information</li>
                    <li>Can view their projects and tests</li>
                    <li>Can view test results and media</li>
                    <li>Cannot edit or delete anything</li>
                  </>
                )}
              </ul>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : user ? 'Update User' : 'Create User'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default UserModal;
