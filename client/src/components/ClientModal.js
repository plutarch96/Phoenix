import React, { useState } from 'react';
import { X } from 'lucide-react';
import { clientsAPI } from '../services/api';

function ClientModal({ client, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    contact_email: client?.contact_email || '',
    contact_phone: client?.contact_phone || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (client) {
        await clientsAPI.update(client.id, formData);
      } else {
        await clientsAPI.create(formData);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      alert('Failed to save client');
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
          <h2 className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Client Name *</label>
            <input
              type="text"
              name="name"
              className="form-input"
              value={formData.name}
              onChange={handleChange}
              required
              placeholder="Enter client name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Email</label>
            <input
              type="email"
              name="contact_email"
              className="form-input"
              value={formData.contact_email}
              onChange={handleChange}
              placeholder="client@example.com"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Contact Phone</label>
            <input
              type="tel"
              name="contact_phone"
              className="form-input"
              value={formData.contact_phone}
              onChange={handleChange}
              placeholder="(555) 123-4567"
            />
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : client ? 'Update' : 'Add Client'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ClientModal;
