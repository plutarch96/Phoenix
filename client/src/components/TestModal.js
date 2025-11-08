import React, { useState } from 'react';
import { X } from 'lucide-react';
import { testsAPI } from '../services/api';

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
    test_date: test?.test_date || '',
    status: test?.status || 'pending',
    tags: test?.tags?.join(', ') || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const data = {
        ...formData,
        location: formData.location === 'Other' ? formData.customLocation : formData.location,
        client_id: formData.client_id || null, // Convert empty string to null
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
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
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
            <label className="form-label">Client</label>
            <select
              name="client_id"
              className="form-select"
              value={formData.client_id}
              onChange={handleChange}
            >
              <option value="">Select a client (optional)</option>
              {clients.map(client => (
                <option key={client.id} value={client.id}>{client.name}</option>
              ))}
            </select>
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
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
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
