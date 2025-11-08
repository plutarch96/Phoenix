import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { calibrationsAPI, testsAPI } from '../services/api';

function CalibrationSelector({ testId, onClose, onSuccess }) {
  const [calibrations, setCalibrations] = useState([]);
  const [filteredCalibrations, setFilteredCalibrations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCalibration, setSelectedCalibration] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCalibrations();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const filtered = calibrations.filter(cal =>
        cal.equipment_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cal.equipment_id.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCalibrations(filtered);
    } else {
      setFilteredCalibrations(calibrations);
    }
  }, [searchQuery, calibrations]);

  const loadCalibrations = async () => {
    try {
      const res = await calibrationsAPI.getAll();
      // Only show valid calibrations
      const validCals = res.data.filter(cal => cal.status === 'valid');
      setCalibrations(validCals);
      setFilteredCalibrations(validCals);
    } catch (error) {
      console.error('Error loading calibrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedCalibration) {
      alert('Please select a calibration');
      return;
    }

    try {
      await testsAPI.addCalibration(testId, selectedCalibration.id);
      onSuccess();
    } catch (error) {
      console.error('Error adding calibration:', error);
      alert(error.response?.data?.error || 'Failed to add calibration');
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Add Calibration Equipment</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div className="form-group">
          <label className="form-label">Search Equipment</label>
          <div style={{ position: 'relative' }}>
            <Search
              size={20}
              style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem' }}
              placeholder="Search by name or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading calibrations...</div>
        ) : filteredCalibrations.length > 0 ? (
          <div style={{ maxHeight: '400px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
            {filteredCalibrations.map(cal => (
              <div
                key={cal.id}
                onClick={() => setSelectedCalibration(cal)}
                style={{
                  padding: '1rem',
                  borderBottom: '1px solid var(--border-color)',
                  cursor: 'pointer',
                  background: selectedCalibration?.id === cal.id ? '#dbeafe' : 'var(--bg-secondary)',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => {
                  if (selectedCalibration?.id !== cal.id) {
                    e.currentTarget.style.background = 'var(--bg-item-hover)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (selectedCalibration?.id !== cal.id) {
                    e.currentTarget.style.background = 'var(--bg-secondary)';
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem' }}>
                      {cal.equipment_name}
                    </div>
                    <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                      ID: {cal.equipment_id}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
                      Expires: {new Date(cal.expiration_date).toLocaleDateString()}
                    </div>
                  </div>
                  {selectedCalibration?.id === cal.id && (
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'white', fontSize: '1rem' }}>✓</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>{searchQuery ? 'No calibrations found matching your search' : 'No valid calibrations available'}</p>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleAdd}
            disabled={!selectedCalibration}
          >
            <Plus size={16} />
            Add to Test
          </button>
        </div>
      </div>
    </div>
  );
}

export default CalibrationSelector;
