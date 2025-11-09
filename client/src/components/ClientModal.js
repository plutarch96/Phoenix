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
  const [success, setSuccess] = useState(false);

  const formatClientNumber = (value) => {
    // Remove any non-digit characters
    const digits = value.replace(/\D/g, '');

    // Limit to 4 digits max
    const limited = digits.slice(0, 4);

    // Pad with zeros to 3 or 4 digits
    if (limited.length === 0) return '';
    if (limited.length <= 3) return limited.padStart(3, '0');
    return limited; // 4 digits, no padding needed
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Format the client number before submitting
      const formattedData = {
        ...formData,
        client_number: formatClientNumber(formData.client_number)
      };

      console.log('Submitting client data:', formattedData);

      if (client) {
        await clientsAPI.update(client.id, formattedData);
      } else {
        const response = await clientsAPI.create(formattedData);
        console.log('Client created:', response.data);
      }

      setSuccess(true);
    } catch (error) {
      console.error('Error saving client:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to save client: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Allow only digits for client_number and limit to 4 characters
    if (name === 'client_number') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
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
    <div className="modal-overlay" onClick={success ? onSuccess : onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{client ? 'Edit Client' : 'Add New Client'}</h2>
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
              Client has been {client ? 'updated' : 'created'} successfully.
            </p>
            <button className="btn btn-primary" onClick={onSuccess}>
              Close
            </button>
          </div>
        ) : (
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
              placeholder="e.g., 7, 20, 341, or 1234"
              maxLength="4"
            />
            <small style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              3-4 digits (auto-padded). Will be formatted as: {formData.client_number ? formatClientNumber(formData.client_number) : '###'}-XXX-XXX
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
        )}
      </div>
    </div>
  );
}

export default ClientModal;
