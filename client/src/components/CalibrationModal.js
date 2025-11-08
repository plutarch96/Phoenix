import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { calibrationsAPI } from '../services/api';

function CalibrationModal({ calibration, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    equipment_name: calibration?.equipment_name || '',
    equipment_id: calibration?.equipment_id || '',
    calibration_date: calibration?.calibration_date || '',
    expiration_date: calibration?.expiration_date || '',
    calibrated_by: calibration?.calibrated_by || '',
    notes: calibration?.notes || ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });

      if (pdfFile) {
        formDataToSend.append('pdf', pdfFile);
      }

      if (calibration) {
        await calibrationsAPI.update(calibration.id, formDataToSend);
      } else {
        await calibrationsAPI.create(formDataToSend);
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving calibration:', error);
      alert(error.response?.data?.error || 'Failed to save calibration');
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'application/pdf') {
      setPdfFile(file);
    } else {
      alert('Please select a PDF file');
      e.target.value = '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {calibration ? 'Edit Calibration' : 'Add New Calibration'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Equipment Name *</label>
            <input
              type="text"
              name="equipment_name"
              className="form-input"
              value={formData.equipment_name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Equipment ID *</label>
            <input
              type="text"
              name="equipment_id"
              className="form-input"
              value={formData.equipment_id}
              onChange={handleChange}
              required
              placeholder="Unique identifier for the equipment"
            />
          </div>

          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Calibration Date *</label>
              <input
                type="date"
                name="calibration_date"
                className="form-input"
                value={formData.calibration_date}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Expiration Date *</label>
              <input
                type="date"
                name="expiration_date"
                className="form-input"
                value={formData.expiration_date}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Calibrated By</label>
            <input
              type="text"
              name="calibrated_by"
              className="form-input"
              value={formData.calibrated_by}
              onChange={handleChange}
              placeholder="Lab or technician name"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Notes</label>
            <textarea
              name="notes"
              className="form-textarea"
              value={formData.notes}
              onChange={handleChange}
              rows="3"
              placeholder="Additional notes or details"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Calibration Certificate (PDF)</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ flex: 1 }}
              />
              {pdfFile && (
                <span style={{ color: '#10b981', fontSize: '0.875rem' }}>
                  ✓ {pdfFile.name}
                </span>
              )}
            </div>
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
              Upload the calibration certificate PDF (max 10MB)
            </p>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : calibration ? 'Update' : 'Add Calibration'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalibrationModal;
