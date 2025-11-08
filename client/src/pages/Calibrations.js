import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, AlertTriangle, FileText, Trash2, Edit2, Download, Upload, X } from 'lucide-react';
import { calibrationsAPI } from '../services/api';
import CalibrationModal from '../components/CalibrationModal';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';

function Calibrations() {
  const [calibrations, setCalibrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedCalibration, setSelectedCalibration] = useState(null);
  const [filter, setFilter] = useState('all'); // all, valid, expired
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [equipmentTypeFilter, setEquipmentTypeFilter] = useState('');
  const [showBulkImport, setShowBulkImport] = useState(false);
  const fileInputRef = useRef(null);
  const toast = useToast();

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

  const handleExportCSV = () => {
    const headers = [
      'Equipment Name',
      'Equipment ID',
      'Equipment Type',
      'Serial Number',
      'Calibration Date',
      'Expiration Date',
      'Calibrated By',
      'Status',
      'Calibration Sheet',
      'Notes'
    ];

    const rows = calibrations.map(cal => [
      cal.equipment_name,
      cal.equipment_id,
      cal.equipment_type,
      cal.serial_number || '',
      cal.calibration_date,
      cal.expiration_date,
      cal.calibrated_by || '',
      cal.status,
      cal.pdf_path ? 'Yes' : 'No',
      cal.notes || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `calibrations_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  };

  const handleImportCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target.result;
        const lines = text.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());

        // Validate headers
        const requiredHeaders = ['Equipment Name', 'Equipment ID', 'Equipment Type', 'Calibration Date', 'Expiration Date'];
        const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
        if (missingHeaders.length > 0) {
          toast.error(`Missing required columns: ${missingHeaders.join(', ')}`);
          return;
        }

        const dataLines = lines.slice(1);
        let successCount = 0;
        let errorCount = 0;

        for (const line of dataLines) {
          if (!line.trim()) continue;

          // Parse CSV line (handle quoted fields)
          const values = line.match(/(".*?"|[^",]+)(?=\s*,|\s*$)/g).map(v => v.replace(/^"|"$/g, '').trim());

          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = values[index] || '';
          });

          try {
            const formData = new FormData();
            formData.append('equipment_name', rowData['Equipment Name']);
            formData.append('equipment_type', rowData['Equipment Type']);
            formData.append('equipment_id', rowData['Equipment ID']);
            formData.append('serial_number', rowData['Serial Number'] || '');
            formData.append('calibration_date', rowData['Calibration Date']);
            formData.append('expiration_date', rowData['Expiration Date']);
            formData.append('calibrated_by', rowData['Calibrated By'] || '');
            formData.append('notes', rowData['Notes'] || '');

            await calibrationsAPI.create(formData);
            successCount++;
          } catch (error) {
            console.error('Error importing row:', rowData, error);
            errorCount++;
          }
        }

        if (successCount > 0) {
          toast.success(`Successfully imported ${successCount} calibration record${successCount > 1 ? 's' : ''}`);
          loadCalibrations();
        }
        if (errorCount > 0) {
          toast.error(`Failed to import ${errorCount} record${errorCount > 1 ? 's' : ''}`);
        }

        setShowBulkImport(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (error) {
        console.error('CSV parsing error:', error);
        toast.error('Failed to parse CSV file. Please check the format.');
      }
    };

    reader.readAsText(file);
  };

  const filteredCalibrations = calibrations.filter(cal => {
    // Status filter
    if (filter !== 'all') {
      if (filter === 'valid' && cal.status !== 'valid') return false;
      if (filter === 'expired' && cal.status !== 'expired') return false;
    }

    // Equipment type filter
    if (equipmentTypeFilter && cal.equipment_type !== equipmentTypeFilter) return false;

    // Search query filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        cal.equipment_name.toLowerCase().includes(query) ||
        cal.equipment_id.toLowerCase().includes(query) ||
        cal.equipment_type.toLowerCase().includes(query) ||
        (cal.serial_number && cal.serial_number.toLowerCase().includes(query)) ||
        (cal.calibrated_by && cal.calibrated_by.toLowerCase().includes(query)) ||
        (cal.notes && cal.notes.toLowerCase().includes(query))
      );
    }

    return true;
  });

  const expiredCount = calibrations.filter(c => c.status === 'expired').length;
  const validCount = calibrations.filter(c => c.status === 'valid').length;

  // Get unique equipment types for filter dropdown
  const equipmentTypes = [...new Set(calibrations.map(cal => cal.equipment_type))].sort();

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Calibration Equipment</h2>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button className="btn btn-secondary" onClick={handleExportCSV}>
            <Download size={20} />
            Export CSV
          </button>
          <button className="btn btn-secondary" onClick={() => setShowBulkImport(true)}>
            <Upload size={20} />
            Bulk Import
          </button>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={20} />
            Add Calibration
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Search */}
          <div style={{ flex: '1 1 300px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#64748b'
              }}
            />
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '40px', paddingRight: searchQuery ? '40px' : '12px' }}
              placeholder="Search by name, ID, type, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <X size={16} color="#64748b" />
              </button>
            )}
          </div>

          {/* Equipment Type Filter */}
          <select
            className="form-select"
            style={{ width: 'auto', minWidth: '200px' }}
            value={equipmentTypeFilter}
            onChange={(e) => setEquipmentTypeFilter(e.target.value)}
          >
            <option value="">All Equipment Types</option>
            {equipmentTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Status Filters */}
        <div className="filter-buttons">
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

        {(searchQuery || equipmentTypeFilter) && (
          <div style={{ marginTop: '1rem', fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
            Showing {filteredCalibrations.length} of {calibrations.length} records
          </div>
        )}
      </div>

      {/* Calibrations List */}
      <div className="card">
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

      {showBulkImport && (
        <div className="modal-overlay" onClick={() => setShowBulkImport(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Bulk Import Calibrations</h2>
              <button onClick={() => setShowBulkImport(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>

            <div style={{ padding: '1.5rem' }}>
              <div style={{ marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.75rem' }}>CSV Format Requirements</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                  Your CSV file must include the following columns:
                </p>
                <ul style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', paddingLeft: '1.5rem' }}>
                  <li><strong>Equipment Name</strong> (required)</li>
                  <li><strong>Equipment ID</strong> (required)</li>
                  <li><strong>Equipment Type</strong> (required)</li>
                  <li><strong>Calibration Date</strong> (required, format: YYYY-MM-DD)</li>
                  <li><strong>Expiration Date</strong> (required, format: YYYY-MM-DD)</li>
                  <li>Serial Number (optional)</li>
                  <li>Calibrated By (optional)</li>
                  <li>Notes (optional)</li>
                </ul>
              </div>

              <div style={{ marginBottom: '1.5rem', padding: '1rem', background: 'var(--bg-tertiary)', borderRadius: '8px' }}>
                <h4 style={{ fontSize: '0.875rem', fontWeight: 600, marginBottom: '0.5rem' }}>Example CSV:</h4>
                <pre style={{ fontSize: '0.75rem', overflow: 'auto', whiteSpace: 'pre-wrap' }}>
Equipment Name,Equipment ID,Equipment Type,Serial Number,Calibration Date,Expiration Date,Calibrated By,Notes
"Heat Flux Gauge","HFG-001","Heat Flux Gauge","SN12345","2024-01-15","2025-01-15","NIST","Primary standard"
"TC Mod","TCM-002","TC Mod","","2024-02-20","2025-02-20","Cal Lab","Type K thermocouple"
                </pre>
              </div>

              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleImportCSV}
                  style={{ display: 'none' }}
                />
                <button
                  className="btn btn-primary"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ width: '100%' }}
                >
                  <Upload size={20} />
                  Select CSV File to Import
                </button>
              </div>

              <div style={{ marginTop: '1rem', padding: '0.75rem', background: 'var(--color-warning-light)', borderRadius: '8px', fontSize: '0.875rem' }}>
                <strong>Note:</strong> This will add new calibration records. Existing records will not be modified.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Calibrations;
