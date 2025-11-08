import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Upload,
  Image as ImageIcon,
  Video as VideoIcon,
  FileText,
  Settings,
  Plus,
  X,
  Download,
  FolderArchive
} from 'lucide-react';
import { testsAPI, mediaAPI, calibrationsAPI, clientsAPI } from '../services/api';
import MediaUpload from '../components/MediaUpload';
import CalibrationSelector from '../components/CalibrationSelector';
import TestStream from '../components/TestStream';
import TestModal from '../components/TestModal';
import ConfirmDialog from '../components/ConfirmDialog';

function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState(null);
  const [showCalibrationSelector, setShowCalibrationSelector] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);

  useEffect(() => {
    loadTest();
    loadClients();
  }, [id]);

  const loadTest = async () => {
    try {
      const res = await testsAPI.getById(id);
      setTest(res.data);
    } catch (error) {
      console.error('Error loading test:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClients = async () => {
    try {
      const res = await clientsAPI.getAll();
      setClients(res.data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const handleTestUpdated = () => {
    setShowTestModal(false);
    loadTest();
  };

  const handleDelete = () => {
    setConfirmDialog({
      title: 'Delete Test',
      message: 'Are you sure you want to delete this test? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await testsAPI.delete(id);
          navigate('/tests');
        } catch (error) {
          console.error('Error deleting test:', error);
          alert('Failed to delete test');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleMediaUploaded = () => {
    setShowMediaUpload(false);
    setUploadCategory(null);
    loadTest();
  };

  const handleCalibrationAdded = () => {
    setShowCalibrationSelector(false);
    loadTest();
  };

  const handleRemoveCalibration = (calibrationId) => {
    setConfirmDialog({
      title: 'Remove Calibration',
      message: 'Are you sure you want to remove this calibration equipment from the test?',
      onConfirm: async () => {
        try {
          await testsAPI.removeCalibration(id, calibrationId);
          loadTest();
        } catch (error) {
          console.error('Error removing calibration:', error);
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDeleteMedia = (mediaId) => {
    setConfirmDialog({
      title: 'Delete Media File',
      message: 'Are you sure you want to delete this media file? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await mediaAPI.delete(mediaId);
          loadTest();
        } catch (error) {
          console.error('Error deleting media:', error);
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDownloadCategory = (category) => {
    window.open(`/api/media/test/${id}/download-category/${category}`, '_blank');
  };

  const handleDownloadAllCalibrationPDFs = () => {
    window.open(`/api/tests/${id}/download-calibration-pdfs`, '_blank');
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'badge-warning',
      'in-progress': 'badge-info',
      completed: 'badge-success',
      failed: 'badge-danger'
    };
    return badges[status] || 'badge-info';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear().toString().slice(-2)}`;
  };

  const renderMediaFile = (media, showPreview = true) => {
    const fileUrl = `http://localhost:5000${media.file_path}`;

    if (showPreview && media.media_type === 'image') {
      return (
        <div key={media.id} className="media-item">
          <img src={fileUrl} alt={media.file_name} />
          <div className="media-item-overlay">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{media.file_name}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <a
                  href={`/api/media/download/${media.id}`}
                  download
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <Download size={14} />
                </a>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteMedia(media.id)}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else if (showPreview && media.media_type === 'video') {
      return (
        <div key={media.id} className="media-item">
          <video controls>
            <source src={fileUrl} />
          </video>
          <div className="media-item-overlay">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis' }}>{media.file_name}</span>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                <a
                  href={`/api/media/download/${media.id}`}
                  download
                  className="btn btn-primary btn-sm"
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <Download size={14} />
                </a>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteMedia(media.id)}
                  style={{ padding: '0.25rem 0.5rem' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    } else {
      return (
        <div key={media.id} className="card" style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={24} color="#64748b" />
              <div>
                <div style={{ fontWeight: 500 }}>{media.file_name}</div>
                <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                  {(media.file_size / 1024).toFixed(2)} KB
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <a
                href={`/api/media/download/${media.id}`}
                download
                className="btn btn-primary btn-sm"
              >
                <Download size={16} />
                Download
              </a>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeleteMedia(media.id)}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      );
    }
  };

  const openUploadModal = (category) => {
    setUploadCategory(category);
    setShowMediaUpload(true);
  };

  if (loading) {
    return <div className="page"><div className="loading">Loading test details...</div></div>;
  }

  if (!test) {
    return <div className="page"><div className="empty-state">Test not found</div></div>;
  }

  // Organize media by category
  const testDataFiles = test.media?.filter(m => m.category === 'test_data') || [];
  const mediaFiles = test.media?.filter(m => m.category === 'media') || [];
  const calibrationDocs = test.media?.filter(m => m.category === 'calibration') || [];
  const otherDocs = test.media?.filter(m => m.category === 'other') || [];

  const images = mediaFiles.filter(m => m.media_type === 'image');
  const videos = mediaFiles.filter(m => m.media_type === 'video');

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/tests" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={20} />
          Back to Tests
        </Link>
      </div>

      {/* 1. TEST SUMMARY */}
      <div className="card">
        <h2 style={{ marginBottom: '0.5rem' }}>{test.title}</h2>
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          <span className={`badge ${getStatusBadge(test.status)}`}>
            {test.status}
          </span>
          {test.test_date && (
            <span style={{ color: '#64748b' }}>
              📅 {formatDate(test.test_date)}
            </span>
          )}
          {test.test_type && (
            <span style={{ color: '#64748b' }}>
              📊 Type: {test.test_type}
            </span>
          )}
          {test.governing_standard && (
            <span style={{ color: '#64748b', fontWeight: 500 }}>
              📋 Standard: {test.governing_standard}
            </span>
          )}
        </div>
        {test.description && (
          <p style={{ color: '#64748b', marginBottom: '1rem' }}>{test.description}</p>
        )}
        {test.location && (
          <div style={{ marginBottom: '0.5rem' }}>
            <strong>Location:</strong> {test.location}
          </div>
        )}
        {test.client_name && (
          <div>
            <strong>Client:</strong> {test.client_name}
          </div>
        )}
        {test.tags && test.tags.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            <strong>Tags:</strong>
            <div className="tags" style={{ marginTop: '0.5rem' }}>
              {test.tags.map((tag, i) => (
                <span key={i} className="tag">{tag}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. LIVE STREAM */}
      <TestStream testId={id} testTitle={test.title} />

      {/* 3. TEST DATA */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Test Data Files ({testDataFiles.length})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {testDataFiles.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadCategory('test_data')}
              >
                <FolderArchive size={16} />
                Download All as ZIP
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openUploadModal('test_data')}
            >
              <Upload size={16} />
              Upload Data Files
            </button>
          </div>
        </div>
        {testDataFiles.length > 0 ? (
          testDataFiles.map(media => renderMediaFile(media, false))
        ) : (
          <div className="empty-state">
            <p>No test data files uploaded yet</p>
          </div>
        )}
      </div>

      {/* 4. MEDIA (Images & Videos) */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <ImageIcon size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Media ({mediaFiles.length})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {mediaFiles.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadCategory('media')}
              >
                <FolderArchive size={16} />
                Download All as ZIP
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openUploadModal('media')}
            >
              <Upload size={16} />
              Upload Media
            </button>
          </div>
        </div>

        {images.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={18} /> Images ({images.length})
            </h4>
            <div className="media-grid">
              {images.map(media => renderMediaFile(media, true))}
            </div>
          </div>
        )}

        {videos.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <VideoIcon size={18} /> Videos ({videos.length})
            </h4>
            <div className="media-grid">
              {videos.map(media => renderMediaFile(media, true))}
            </div>
          </div>
        )}

        {mediaFiles.length === 0 && (
          <div className="empty-state">
            <p>No media files uploaded yet</p>
          </div>
        )}
      </div>

      {/* 5. CALIBRATION DOCUMENTS */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Settings size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Calibration Equipment ({test.calibrations?.length || 0})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {test.calibrations && test.calibrations.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadAllCalibrationPDFs}
              >
                <FolderArchive size={16} />
                Download All PDFs
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowCalibrationSelector(true)}
            >
              <Plus size={16} />
              Add Equipment
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openUploadModal('calibration')}
            >
              <Upload size={16} />
              Upload PDF
            </button>
          </div>
        </div>
        {test.calibrations && test.calibrations.length > 0 ? (
          <div className="table-container" style={{ marginBottom: '1.5rem' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>ID</th>
                  <th>Calibration Date</th>
                  <th>Expiration</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {test.calibrations.map(cal => {
                  const isExpired = new Date(cal.expiration_date) < new Date();
                  return (
                    <tr key={cal.id}>
                      <td><strong>{cal.equipment_name}</strong></td>
                      <td>{cal.equipment_id}</td>
                      <td>{formatDate(cal.calibration_date)}</td>
                      <td>{formatDate(cal.expiration_date)}</td>
                      <td>
                        <span className={`badge ${isExpired ? 'badge-danger' : 'badge-success'}`}>
                          {isExpired ? 'Expired' : 'Valid'}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          {cal.pdf_path && (
                            <a
                              href={`http://localhost:5000${cal.pdf_path}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-primary btn-sm"
                            >
                              View PDF
                            </a>
                          )}
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleRemoveCalibration(cal.id)}
                          >
                            <X size={16} />
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
            <p>No calibration equipment linked to this test</p>
          </div>
        )}

        {calibrationDocs.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '1rem' }}>Uploaded Calibration PDFs:</h4>
            {calibrationDocs.map(media => renderMediaFile(media, false))}
          </div>
        )}
      </div>

      {/* 6. OTHER DOCUMENTS */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <FileText size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Other Documents ({otherDocs.length})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {otherDocs.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadCategory('other')}
              >
                <FolderArchive size={16} />
                Download All as ZIP
              </button>
            )}
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openUploadModal('other')}
            >
              <Upload size={16} />
              Upload Document
            </button>
          </div>
        </div>
        {otherDocs.length > 0 ? (
          otherDocs.map(media => renderMediaFile(media, false))
        ) : (
          <div className="empty-state">
            <p>No other documents uploaded yet</p>
          </div>
        )}
      </div>

      {/* EDIT/DELETE ACTIONS */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <button className="btn btn-secondary" onClick={() => setShowTestModal(true)}>
            <Edit size={20} />
            Edit Test
          </button>
          <button className="btn btn-danger" onClick={handleDelete}>
            <Trash2 size={20} />
            Delete Test
          </button>
        </div>
      </div>

      {showMediaUpload && (
        <MediaUpload
          testId={id}
          category={uploadCategory}
          onClose={() => {
            setShowMediaUpload(false);
            setUploadCategory(null);
          }}
          onSuccess={handleMediaUploaded}
        />
      )}

      {showCalibrationSelector && (
        <CalibrationSelector
          testId={id}
          onClose={() => setShowCalibrationSelector(false)}
          onSuccess={handleCalibrationAdded}
        />
      )}

      {showTestModal && (
        <TestModal
          test={test}
          clients={clients}
          onClose={() => setShowTestModal(false)}
          onSuccess={handleTestUpdated}
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

export default TestDetail;
