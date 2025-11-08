import React, { useState, useEffect } from 'react';
import { X, Wand2 } from 'lucide-react';
import { calibrationsAPI, equipmentTypesAPI } from '../services/api';

function CalibrationModal({ calibration, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    equipment_model: calibration?.equipment_name || '', // Using equipment_name field for model
    equipment_serial: calibration?.equipment_id || '', // Using equipment_id for serial
    equipment_type: calibration?.equipment_type || '',
    calibration_date: calibration?.calibration_date || '',
    expiration_date: calibration?.expiration_date || '',
    calibrated_by: calibration?.calibrated_by || '',
    notes: calibration?.notes || ''
  });
  const [pdfFile, setPdfFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [equipmentTypes, setEquipmentTypes] = useState([]);
  const [generatingId, setGeneratingId] = useState(false);

  useEffect(() => {
    loadEquipmentTypes();
  }, []);

  const loadEquipmentTypes = async () => {
    try {
      const res = await equipmentTypesAPI.getAll();
      setEquipmentTypes(res.data);
    } catch (error) {
      console.error('Error loading equipment types:', error);
    }
  };

  const handleGenerateSerial = async () => {
    if (!formData.equipment_type) {
      alert('Please select an equipment type first');
      return;
    }

    setGeneratingId(true);
    try {
      const res = await equipmentTypesAPI.generateId(formData.equipment_type);
      setFormData(prev => ({
        ...prev,
        equipment_serial: res.data.equipment_id
      }));
    } catch (error) {
      console.error('Error generating serial number:', error);
      alert('Failed to generate serial number');
    } finally {
      setGeneratingId(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataToSend = new FormData();

      // Map new field names to existing backend fields
      formDataToSend.append('equipment_name', formData.equipment_model);
      formDataToSend.append('equipment_id', formData.equipment_serial);
      formDataToSend.append('equipment_type', formData.equipment_type);
      formDataToSend.append('calibration_date', formData.calibration_date);
      formDataToSend.append('expiration_date', formData.expiration_date);
      formDataToSend.append('calibrated_by', formData.calibrated_by);
      formDataToSend.append('notes', formData.notes);

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
    const { name, value } = e.target;
    const updates = {
      ...formData,
      [name]: value
    };

    // Auto-calculate expiration date when calibration date changes
    if (name === 'calibration_date' && value) {
      const calDate = new Date(value);
      const expDate = new Date(calDate);
      expDate.setFullYear(expDate.getFullYear() + 1); // Add 1 year
      updates.expiration_date = expDate.toISOString().split('T')[0]; // Format as YYYY-MM-DD
    }

    setFormData(updates);
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
          <div className="grid grid-2">
            <div className="form-group">
              <label className="form-label">Equipment Type *</label>
              <select
                name="equipment_type"
                className="form-select"
                value={formData.equipment_type}
                onChange={handleChange}
                required
              >
                <option value="">Select type...</option>
                {equipmentTypes.map(type => (
                  <option key={type.id} value={type.type_code}>
                    {type.type_name} ({type.type_code})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Serial Number *</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  name="equipment_serial"
                  className="form-input"
                  value={formData.equipment_serial}
                  onChange={handleChange}
                  required
                  placeholder="e.g., PT-01, MM-05"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleGenerateSerial}
                  disabled={!formData.equipment_type || generatingId}
                  title="Auto-generate next serial number"
                >
                  <Wand2 size={16} />
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Click the wand to auto-generate the next sequential serial number
              </p>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Model *</label>
            <input
              type="text"
              name="equipment_model"
              className="form-input"
              value={formData.equipment_model}
              onChange={handleChange}
              required
              placeholder="e.g., Omega Type-K Thermocouple"
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
              <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                Due date will be auto-calculated (+1 year)
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Due Date *</label>
              <input
                type="date"
                name="expiration_date"
                className="form-input"
                value={formData.expiration_date}
                onChange={handleChange}
                required
              />
              <p style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '0.25rem' }}>
                {formData.expiration_date ? '✓ Calculated automatically' : 'Set calibration date first'}
              </p>
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
