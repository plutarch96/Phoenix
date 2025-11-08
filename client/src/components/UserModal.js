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
        toast.success('User updated successfully');
      } else {
        await authAPI.register(data);
        toast.success('User created successfully! They can now log in with their credentials.');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(error.response?.data?.error || `Failed to ${user ? 'update' : 'create'} user`);
    } finally {
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
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Create New User</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

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
              <option value="admin">Admin - Full system access</option>
              <option value="employee">Employee (FRA) - Manage tests and clients</option>
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
              background: formData.role === 'admin' ? '#fef2f2' : formData.role === 'employee' ? '#eff6ff' : '#f0fdf4',
              borderRadius: '8px',
              borderLeft: `4px solid ${formData.role === 'admin' ? '#ef4444' : formData.role === 'employee' ? '#3b82f6' : '#10b981'}`,
              marginBottom: '1rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                {formData.role === 'admin' && <Shield size={18} color="#ef4444" />}
                {formData.role === 'employee' && <Briefcase size={18} color="#3b82f6" />}
                {formData.role === 'client' && <UserIcon size={18} color="#10b981" />}
                <strong style={{
                  color: formData.role === 'admin' ? '#991b1b' : formData.role === 'employee' ? '#1e40af' : '#065f46'
                }}>
                  {formData.role === 'admin' ? 'Admin Access' : formData.role === 'employee' ? 'FRA Employee Access' : 'Client Access'}
                </strong>
              </div>
              <ul style={{
                fontSize: '0.875rem',
                color: formData.role === 'admin' ? '#7f1d1d' : formData.role === 'employee' ? '#1e3a8a' : '#064e3b',
                marginLeft: '1.5rem',
                marginBottom: 0
              }}>
                {formData.role === 'admin' && (
                  <>
                    <li>Full access to all features</li>
                    <li>Can create and manage users</li>
                    <li>Can manage all clients, projects, and tests</li>
                    <li>Can view and modify calibration records</li>
                  </>
                )}
                {formData.role === 'employee' && (
                  <>
                    <li>Can create and manage tests</li>
                    <li>Can view and manage client information</li>
                    <li>Can manage calibration records</li>
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
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default UserModal;
