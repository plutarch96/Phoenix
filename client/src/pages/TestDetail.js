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
  X
} from 'lucide-react';
import { testsAPI, mediaAPI, calibrationsAPI } from '../services/api';
import MediaUpload from '../components/MediaUpload';
import CalibrationSelector from '../components/CalibrationSelector';

function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [showCalibrationSelector, setShowCalibrationSelector] = useState(false);

  useEffect(() => {
    loadTest();
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

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this test?')) {
      try {
        await testsAPI.delete(id);
        navigate('/tests');
      } catch (error) {
        console.error('Error deleting test:', error);
        alert('Failed to delete test');
      }
    }
  };

  const handleMediaUploaded = () => {
    setShowMediaUpload(false);
    loadTest();
  };

  const handleCalibrationAdded = () => {
    setShowCalibrationSelector(false);
    loadTest();
  };

  const handleRemoveCalibration = async (calibrationId) => {
    if (window.confirm('Remove this calibration from the test?')) {
      try {
        await testsAPI.removeCalibration(id, calibrationId);
        loadTest();
      } catch (error) {
        console.error('Error removing calibration:', error);
      }
    }
  };

  const handleDeleteMedia = async (mediaId) => {
    if (window.confirm('Delete this media file?')) {
      try {
        await mediaAPI.delete(mediaId);
        loadTest();
      } catch (error) {
        console.error('Error deleting media:', error);
      }
    }
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

  const renderMedia = (media) => {
    const fileUrl = `http://localhost:5000${media.file_path}`;

    if (media.media_type === 'image') {
      return (
        <div className="media-item">
          <img src={fileUrl} alt={media.file_name} />
          <div className="media-item-overlay">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{media.file_name}</span>
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
      );
    } else if (media.media_type === 'video') {
      return (
        <div className="media-item">
          <video controls>
            <source src={fileUrl} />
          </video>
          <div className="media-item-overlay">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{media.file_name}</span>
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
      );
    } else {
      return (
        <div className="card" style={{ marginBottom: '0.75rem' }}>
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
                href={fileUrl}
                download
                className="btn btn-primary btn-sm"
              >
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

  if (loading) {
    return <div className="page"><div className="loading">Loading test details...</div></div>;
  }

  if (!test) {
    return <div className="page"><div className="empty-state">Test not found</div></div>;
  }

  const images = test.media?.filter(m => m.media_type === 'image') || [];
  const videos = test.media?.filter(m => m.media_type === 'video') || [];
  const datafiles = test.media?.filter(m => m.media_type === 'datafile') || [];

  return (
    <div className="page">
      <div style={{ marginBottom: '2rem' }}>
        <Link to="/tests" className="btn btn-secondary" style={{ marginBottom: '1rem' }}>
          <ArrowLeft size={20} />
          Back to Tests
        </Link>
      </div>

      {/* Test Header */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1 }}>
            <h2 style={{ marginBottom: '0.5rem' }}>{test.title}</h2>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
              <span className={`badge ${getStatusBadge(test.status)}`}>
                {test.status}
              </span>
              {test.test_date && (
                <span style={{ color: '#64748b' }}>
                  📅 {new Date(test.test_date).toLocaleDateString()}
                </span>
              )}
            </div>
            {test.description && (
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>{test.description}</p>
            )}
            {test.client_name && (
              <div style={{ marginTop: '1rem' }}>
                <strong>Client:</strong> {test.client_name}
                {test.contact_email && (
                  <span style={{ marginLeft: '1rem', color: '#64748b' }}>
                    📧 {test.contact_email}
                  </span>
                )}
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary">
              <Edit size={20} />
              Edit
            </button>
            <button className="btn btn-danger" onClick={handleDelete}>
              <Trash2 size={20} />
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Calibration Equipment */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Settings size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Calibration Equipment
          </h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCalibrationSelector(true)}
          >
            <Plus size={16} />
            Add Equipment
          </button>
        </div>
        {test.calibrations && test.calibrations.length > 0 ? (
          <div className="table-container">
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
                      <td>{new Date(cal.calibration_date).toLocaleDateString()}</td>
                      <td>{new Date(cal.expiration_date).toLocaleDateString()}</td>
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
      </div>

      {/* Media Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Media Files</h3>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowMediaUpload(true)}
          >
            <Upload size={16} />
            Upload Media
          </button>
        </div>

        {/* Images */}
        {images.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ImageIcon size={20} /> Images ({images.length})
            </h4>
            <div className="media-grid">
              {images.map(media => renderMedia(media))}
            </div>
          </div>
        )}

        {/* Videos */}
        {videos.length > 0 && (
          <div style={{ marginBottom: '2rem' }}>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <VideoIcon size={20} /> Videos ({videos.length})
            </h4>
            <div className="media-grid">
              {videos.map(media => renderMedia(media))}
            </div>
          </div>
        )}

        {/* Data Files */}
        {datafiles.length > 0 && (
          <div>
            <h4 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} /> Data Files ({datafiles.length})
            </h4>
            {datafiles.map(media => renderMedia(media))}
          </div>
        )}

        {!test.media || test.media.length === 0 && (
          <div className="empty-state">
            <p>No media files uploaded yet</p>
          </div>
        )}
      </div>

      {showMediaUpload && (
        <MediaUpload
          testId={id}
          onClose={() => setShowMediaUpload(false)}
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
    </div>
  );
}

export default TestDetail;
