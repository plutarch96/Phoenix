import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { testsAPI, projectsAPI } from '../services/api';

function TestModal({ test, clients, onClose, onSuccess }) {
  // Determine if location is a preset or custom
  const presetLocations = ['Rockville', 'York', 'Cambridge'];
  const isPresetLocation = test?.location && presetLocations.includes(test.location);

  const [formData, setFormData] = useState({
    title: test?.title || '',
    description: test?.description || '',
    test_type: test?.test_type || '',
    governing_standard: test?.governing_standard || '',
    location: isPresetLocation ? test.location : (test?.location ? 'Other' : ''),
    customLocation: isPresetLocation || !test?.location ? '' : test.location,
    client_id: test?.client_id || '',
    project_id: test?.project_id || '',
    test_number: test?.test_number || '',
    test_date: test?.test_date || '',
    status: test?.status || 'Proposed',
    tags: test?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);
  const [projects, setProjects] = useState([]);

  // Load projects when client is selected
  useEffect(() => {
    if (formData.client_id) {
      loadProjects(formData.client_id);
    } else {
      setProjects([]);
      setFormData(prev => ({ ...prev, project_id: '' }));
    }
  }, [formData.client_id]);

  const loadProjects = async (clientId) => {
    try {
      const res = await projectsAPI.getAll({ client_id: clientId });
      // Handle new paginated response format
      setProjects(res.data.data || res.data);
    } catch (error) {
      console.error('Error loading projects:', error);
    }
  };

  const formatTestNumber = (value) => {
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
      const data = {
        ...formData,
        location: formData.location === 'Other' ? formData.customLocation : formData.location,
        client_id: formData.client_id || null, // Convert empty string to null
        project_id: formData.project_id || null,
        test_number: formData.test_number ? formatTestNumber(formData.test_number) : null,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

      // Remove customLocation from data as it's not a database field
      delete data.customLocation;

      if (test) {
        await testsAPI.update(test.id, data);
      } else {
        await testsAPI.create(data);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving test:', error);
      alert('Failed to save test: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only digits for test_number and limit to 3 characters
    if (name === 'test_number') {
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

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">{test ? 'Edit Test' : 'Create New Test'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Title *</label>
            <input
              type="text"
              name="title"
              className="form-input"
              value={formData.title}
              onChange={handleChange}
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
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Test Type *</label>
              <select
                name="test_type"
                className="form-select"
                value={formData.test_type}
                onChange={handleChange}
                required
              >
                <option value="">Select test type</option>
                <option value="Unit">Unit</option>
                <option value="Module">Module</option>
                <option value="Cell">Cell</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Governing Standard *</label>
              <select
                name="governing_standard"
                className="form-select"
                value={formData.governing_standard}
                onChange={handleChange}
                required
              >
                <option value="">Select standard</option>
                <option value="UL 9540A">UL 9540A</option>
                <option value="CSA 800">CSA 800</option>
                <option value="NFPA 855">NFPA 855</option>
                <option value="Other">Other</option>
                <option value="None">None</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <select
              name="location"
              className="form-select"
              value={formData.location}
              onChange={handleChange}
            >
              <option value="">Select location</option>
              <option value="Rockville">Rockville</option>
              <option value="York">York</option>
              <option value="Cambridge">Cambridge</option>
              <option value="Other">Other</option>
            </select>
          </div>

          {formData.location === 'Other' && (
            <div className="form-group">
              <label className="form-label">Custom Location</label>
              <input
                type="text"
                name="customLocation"
                className="form-input"
                value={formData.customLocation}
                onChange={handleChange}
                placeholder="Enter custom location"
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Client *</label>
            <select
              name="client_id"
              className="form-select"
              value={formData.client_id}
              onChange={handleChange}
              required
            >
              <option value="">Select a client</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Project *</label>
            <select
              name="project_id"
              className="form-select"
              value={formData.project_id}
              onChange={handleChange}
              required
              disabled={!formData.client_id}
            >
              <option value="">Select a project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.project_name} (#{project.project_number})
                </option>
              ))}
            </select>
            {!formData.client_id && (
              <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
                Select a client first
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Test Number *</label>
            <input
              type="text"
              name="test_number"
              className="form-input"
              value={formData.test_number}
              onChange={handleChange}
              placeholder="e.g., 1, 15, or 120"
              maxLength="3"
              required
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              3 digits (auto-padded). Will be formatted as: {formData.test_number ? formatTestNumber(formData.test_number) : 'XXX'}
            </small>
          </div>

          <div className="form-group">
            <label className="form-label">Test Date</label>
            <input
              type="date"
              name="test_date"
              className="form-input"
              value={formData.test_date}
              onChange={handleChange}
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
              <option value="Proposed">Proposed</option>
              <option value="Planning">Planning</option>
              <option value="Complete">Complete</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tags (comma-separated)</label>
            <input
              type="text"
              name="tags"
              className="form-input"
              value={formData.tags}
              onChange={handleChange}
              placeholder="e.g., thermal, vibration, acoustic"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : test ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TestModal;
