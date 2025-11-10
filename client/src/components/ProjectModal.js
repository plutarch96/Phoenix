import React, { useState } from 'react';
import { X } from 'lucide-react';
import { projectsAPI } from '../services/api';

function ProjectModal({ project, client, clients = [], onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    client_id: project?.client_id || client?.id || '',
    project_number: project?.project_number || '',
    project_name: project?.project_name || '',
    description: project?.description || '',
    status: project?.status || 'active'
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const formatProjectNumber = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 3 digits and pad with zeros
    const limited = digits.slice(0, 3);

    if (limited.length === 0) return '';
    return limited.padStart(3, '0');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Ensure client_id is set correctly and format project number
      const submitData = {
        ...formData,
        client_id: formData.client_id || client?.id,
        project_number: formatProjectNumber(formData.project_number)
      };

      console.log('Submitting project:', submitData); // Debug log

      if (project) {
        await projectsAPI.update(project.id, submitData);
      } else {
        const response = await projectsAPI.create(submitData);
        console.log('Project created:', response.data); // Debug log
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error saving project:', error);
      console.error('Error details:', error.response?.data); // More debug info
      alert('Failed to save project: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only digits for project_number and limit to 3 characters
    if (name === 'project_number') {
      const digits = value.replace(/\D/g, '').slice(0, 3);
      setFormData({
        ...formData,
        [name]: digits
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  // Get the selected client for display purposes
  const selectedClient = clients.find(c => c.id === parseInt(formData.client_id)) || client;

  return (
    <div className="modal-overlay" onClick={success ? onSuccess : onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'Create New Project'}</h2>
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
              Project has been {project ? 'updated' : 'created'} successfully.
            </p>
            <button className="btn btn-primary" onClick={onSuccess}>
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Client *</label>
            <select
              name="client_id"
              className="form-select"
              value={formData.client_id}
              onChange={handleChange}
              disabled={!!project}
              required
            >
              <option value="">Select a client...</option>
              {clients.map(c => (
                <option key={c.id} value={c.id}>
                  {c.client_number} - {c.name}
                </option>
              ))}
            </select>
            {project && (
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Client cannot be changed when editing a project
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Project Number *</label>
            <input
              type="text"
              name="project_number"
              className="form-input"
              value={formData.project_number}
              onChange={handleChange}
              placeholder="e.g., 2, 87, or 120"
              maxLength="3"
              required
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              3 digits (auto-padded). Will be formatted as: {selectedClient?.client_number || '###'}-{formData.project_number ? formatProjectNumber(formData.project_number) : '###'}-XXX
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Project Name *</label>
            <input
              type="text"
              name="project_name"
              className="form-input"
              value={formData.project_name}
              onChange={handleChange}
              placeholder="e.g., Building 3 Fire Safety Upgrades"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              name="description"
              className="form-textarea"
              value={formData.description}
              onChange={handleChange}
              rows="4"
              placeholder="Project details, scope, objectives..."
            />
          </div>

          <div className="form-group">
            <label className="form-label">Status</label>
            <select
              name="status"
              className="form-select"
              value={formData.status}
              onChange={handleChange}
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
}

export default ProjectModal;
