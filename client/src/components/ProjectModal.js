import React, { useState } from 'react';
import { X } from 'lucide-react';
import { projectsAPI } from '../services/api';

function ProjectModal({ project, client, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    client_id: project?.client_id || client?.id || '',
    project_number: project?.project_number || '',
    project_name: project?.project_name || '',
    description: project?.description || '',
    status: project?.status || 'active'
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (project) {
        await projectsAPI.update(project.id, formData);
      } else {
        await projectsAPI.create(formData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving project:', error);
      alert('Failed to save project: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{project ? 'Edit Project' : 'Create New Project'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Project Number *</label>
            <input
              type="text"
              name="project_number"
              className="form-input"
              value={formData.project_number}
              onChange={handleChange}
              placeholder="e.g., 007"
              required
            />
            <small style={{ color: '#64748b', fontSize: '0.875rem' }}>
              This will be part of the test ID: {client?.client_number || '###'}-{formData.project_number || '###'}-001
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
      </div>
    </div>
  );
}

export default ProjectModal;
