import React, { useState } from 'react';
import { X } from 'lucide-react';
import { testsAPI } from '../services/api';

function TestModal({ test, clients, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: test?.title || '',
    description: test?.description || '',
    test_type: test?.test_type || '',
    governing_standard: test?.governing_standard || '',
    location: test?.location || '',
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
        client_id: formData.client_id || null, // Convert empty string to null
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t)
      };

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
              <label className="form-label">Test Type</label>
              <input
                type="text"
                name="test_type"
                className="form-input"
                value={formData.test_type}
                onChange={handleChange}
                placeholder="e.g., Fire Resistance, Smoke Development"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Governing Standard</label>
              <input
                type="text"
                name="governing_standard"
                className="form-input"
                value={formData.governing_standard}
                onChange={handleChange}
                placeholder="e.g., ASTM E119, UL 263"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Location</label>
            <input
              type="text"
              name="location"
              className="form-input"
              value={formData.location}
              onChange={handleChange}
              placeholder="e.g., Lab A, Building 3, Maryland Facility"
            />
          </div>

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
