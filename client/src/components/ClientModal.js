import React, { useState } from 'react';
import { X } from 'lucide-react';
import { clientsAPI } from '../services/api';

function ClientModal({ client, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: client?.name || '',
    client_number: client?.client_number || '',
    contact_email: client?.contact_email || '',
    contact_phone: client?.contact_phone || '',
    address: client?.address || '',
    city: client?.city || '',
    state: client?.state || '',
    zip_code: client?.zip_code || ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      console.log('Submitting client data:', formData);

      if (client) {
        await clientsAPI.update(client.id, formData);
      } else {
        const response = await clientsAPI.create(formData);
        console.log('Client created:', response.data);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving client:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to save client: ' + (error.response?.data?.error || error.message));
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
            <label className="form-label">Client Number *</label>
            <input
              type="text"
              name="client_number"
              className="form-input"
              value={formData.client_number}
              onChange={handleChange}
              required
              placeholder="e.g., 549"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              This will be used in test IDs: {formData.client_number || '###'}-007-001
            </small>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
          </div>

          <div className="form-group">
            <label className="form-label">Address</label>
            <input
              type="text"
              name="address"
              className="form-input"
              value={formData.address}
              onChange={handleChange}
              placeholder="Street address"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                type="text"
                name="city"
                className="form-input"
                value={formData.city}
                onChange={handleChange}
                placeholder="City"
              />
            </div>

            <div className="form-group">
              <label className="form-label">State</label>
              <input
                type="text"
                name="state"
                className="form-input"
                value={formData.state}
                onChange={handleChange}
                placeholder="CA"
                maxLength="2"
              />
            </div>

            <div className="form-group">
              <label className="form-label">ZIP Code</label>
              <input
                type="text"
                name="zip_code"
                className="form-input"
                value={formData.zip_code}
                onChange={handleChange}
                placeholder="12345"
              />
            </div>
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
