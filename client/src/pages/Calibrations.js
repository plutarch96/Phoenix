import React, { useState, useEffect } from 'react';
import { Plus, Search, AlertTriangle, FileText, Trash2, Edit2 } from 'lucide-react';
import { calibrationsAPI } from '../services/api';
import CalibrationModal from '../components/CalibrationModal';
import ConfirmDialog from '../components/ConfirmDialog';

function Calibrations() {
  const [calibrations, setCalibrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCalibration, setSelectedCalibration] = useState(null);
  const [filter, setFilter] = useState('all'); // all, valid, expired
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    loadCalibrations();
  }, []);

  const loadCalibrations = async () => {
    try {
      const res = await calibrationsAPI.getAll();
      setCalibrations(res.data);
    } catch (error) {
      console.error('Error loading calibrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (id) => {
    setConfirmDialog({
      title: 'Delete Calibration',
      message: 'Are you sure you want to delete this calibration equipment record? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await calibrationsAPI.delete(id);
          loadCalibrations();
        } catch (error) {
          console.error('Error deleting calibration:', error);
          alert('Failed to delete calibration');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleCalibrationSaved = () => {
    setShowModal(false);
    setSelectedCalibration(null);
    loadCalibrations();
  };

  const handleEdit = (calibration) => {
    setSelectedCalibration(calibration);
    setShowModal(true);
  };

  const filteredCalibrations = calibrations.filter(cal => {
    if (filter === 'all') return true;
    if (filter === 'valid') return cal.status === 'valid';
    if (filter === 'expired') return cal.status === 'expired';
    return true;
  });

  const expiredCount = calibrations.filter(c => c.status === 'expired').length;
  const validCount = calibrations.filter(c => c.status === 'valid').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Calibration Equipment</h2>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={20} />
          Add Calibration
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{calibrations.length}</div>
          <div className="stat-label">Total Equipment</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#10b981' }}>{validCount}</div>
          <div className="stat-label">Valid Calibrations</div>
        </div>
        <div className="stat-card">
          <div className="stat-value" style={{ color: '#ef4444' }}>{expiredCount}</div>
          <div className="stat-label">Expired Calibrations</div>
        </div>
      </div>

      {/* Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('all')}
          >
            All ({calibrations.length})
          </button>
          <button
            className={`btn ${filter === 'valid' ? 'btn-success' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('valid')}
          >
            Valid ({validCount})
          </button>
          <button
            className={`btn ${filter === 'expired' ? 'btn-danger' : 'btn-secondary'} btn-sm`}
            onClick={() => setFilter('expired')}
          >
            Expired ({expiredCount})
          </button>
        </div>
      </div>

      {/* Calibrations List */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Equipment List ({filteredCalibrations.length})</h3>
        </div>
        {loading ? (
          <div className="loading">Loading calibrations...</div>
        ) : filteredCalibrations.length > 0 ? (
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment Name</th>
                  <th>Equipment ID</th>
                  <th>Calibration Date</th>
                  <th>Expiration Date</th>
                  <th>Calibrated By</th>
                  <th>Status</th>
                  <th>Certificate</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCalibrations.map(cal => {
                  const isExpired = cal.status === 'expired';
                  const daysUntilExpiration = Math.ceil(
                    (new Date(cal.expiration_date) - new Date()) / (1000 * 60 * 60 * 24)
                  );
                  const isExpiringSoon = daysUntilExpiration > 0 && daysUntilExpiration <= 30;

                  return (
                    <tr key={cal.id} style={isExpired ? { background: '#fee2e2' } : {}}>
                      <td>
                        <strong>{cal.equipment_name}</strong>
                        {cal.notes && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.25rem' }}>
                            {cal.notes}
                          </div>
                        )}
                      </td>
                      <td>{cal.equipment_id}</td>
                      <td>{new Date(cal.calibration_date).toLocaleDateString()}</td>
                      <td>
                        {new Date(cal.expiration_date).toLocaleDateString()}
                        {isExpiringSoon && !isExpired && (
                          <div style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                            <AlertTriangle size={12} style={{ display: 'inline', marginRight: '4px' }} />
                            Expires in {daysUntilExpiration} days
                          </div>
                        )}
                      </td>
                      <td>{cal.calibrated_by || 'N/A'}</td>
                      <td>
                        <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
                          {isExpired ? 'Expired' : 'Valid'}
                        </span>
                      </td>
                      <td>
                        {cal.pdf_path ? (
                          <a
                            href={`http://localhost:5000${cal.pdf_path}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-primary btn-sm"
                          >
                            <FileText size={16} />
                            View PDF
                          </a>
                        ) : (
                          <span style={{ color: '#64748b', fontSize: '0.875rem' }}>No PDF</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => handleEdit(cal)}
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(cal.id)}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Search size={48} />
            </div>
            <p>No calibrations found</p>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>
              Add Your First Calibration
            </button>
          </div>
        )}
      </div>

      {showModal && (
        <CalibrationModal
          calibration={selectedCalibration}
          onClose={() => {
            setShowModal(false);
            setSelectedCalibration(null);
          }}
          onSuccess={handleCalibrationSaved}
        />
      )}

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  );
}

export default Calibrations;
