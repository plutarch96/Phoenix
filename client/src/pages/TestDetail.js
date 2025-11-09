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
  FolderArchive,
  Tag,
  File,
  Eye
} from 'lucide-react';
import { testsAPI, mediaAPI, calibrationsAPI, clientsAPI, reportsAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import MediaUpload from '../components/MediaUpload';
import CalibrationSelector from '../components/CalibrationSelector';
import TestStream from '../components/TestStream';
import TestModal from '../components/TestModal';
import ConfirmDialog from '../components/ConfirmDialog';
import ReportPreview from '../components/ReportPreview';
import OBSInstructions from '../components/OBSInstructions';
import { formatDate } from '../utils/exportUtils';

function TestDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isFRAEmployee } = useAuth();
  const toast = useToast();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMediaUpload, setShowMediaUpload] = useState(false);
  const [uploadCategory, setUploadCategory] = useState(null);
  const [uploadMediaType, setUploadMediaType] = useState(null);
  const [showCalibrationSelector, setShowCalibrationSelector] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [clients, setClients] = useState([]);
  const [confirmDialog, setConfirmDialog] = useState(null);
  const [showReportUpload, setShowReportUpload] = useState(false);
  const [reportFile, setReportFile] = useState(null);
  const [reportType, setReportType] = useState('draft');
  const [uploadingReport, setUploadingReport] = useState(false);
  const [previewReport, setPreviewReport] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadTest();
    loadClients();
  }, [id]);

  const loadTest = async () => {
    try {
      const res = await testsAPI.getById(id, user?.id);
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
          toast.error('Failed to delete test');
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleMediaUploaded = () => {
    setShowMediaUpload(false);
    setUploadCategory(null);
    setUploadMediaType(null);
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

  const handleDownloadCalibrationSheets = async () => {
    try {
      const response = await testsAPI.downloadCalibrationSheets(id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `test-${id}-calibration-sheets.zip`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading calibration sheets:', error);
      alert(error.response?.data?.error || 'Failed to download calibration sheets. Make sure calibration PDFs exist.');
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
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

  const openUploadModal = (category, mediaType = null) => {
    setUploadCategory(category);
    setUploadMediaType(mediaType);
    setShowMediaUpload(true);
  };

  const handleToggleTag = async () => {
    if (!user) return;

    try {
      if (test.isTaggedByUser) {
        await testsAPI.untagTest(id, user.id);
        toast.success('Test removed from My Tests');
      } else {
        await testsAPI.tagTest(id, user.id);
        toast.success('Test added to My Tests');
      }
      loadTest();
    } catch (error) {
      console.error('Error toggling tag:', error);
      const errorMsg = error.response?.data?.error || 'Failed to update tag';
      toast.error(errorMsg);
    }
  };

  const handleReportUpload = async () => {
    if (!reportFile || !user) return;

    // Validate file size (100MB limit)
    const maxSize = 100 * 1024 * 1024;
    if (reportFile.size > maxSize) {
      toast.error(`File size exceeds 100MB limit. Current size: ${(reportFile.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    try {
      setUploadingReport(true);
      const formData = new FormData();
      formData.append('file', reportFile);
      formData.append('test_id', id);
      formData.append('report_type', reportType);
      formData.append('uploaded_by', user.id);

      await reportsAPI.upload(formData);
      toast.success('Report uploaded successfully');
      setShowReportUpload(false);
      setReportFile(null);
      setReportType('draft');
      loadTest();
    } catch (error) {
      console.error('Error uploading report:', error);
      toast.error(error.response?.data?.error || 'Failed to upload report');
    } finally {
      setUploadingReport(false);
    }
  };

  const handleDeleteReport = (reportId) => {
    setConfirmDialog({
      title: 'Delete Report',
      message: 'Are you sure you want to delete this report? This action cannot be undone.',
      onConfirm: async () => {
        try {
          await reportsAPI.delete(reportId);
          loadTest();
        } catch (error) {
          console.error('Error deleting report:', error);
        }
        setConfirmDialog(null);
      },
      onCancel: () => setConfirmDialog(null)
    });
  };

  const handleDownloadReport = async (report) => {
    try {
      const response = await reportsAPI.download(report.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', report.file_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading report:', error);
      toast.error('Failed to download report');
    }
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

      {/* TEST SUMMARY - Always visible */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem', gap: '1rem' }}>
          <h2 style={{ marginBottom: '0' }}>{test.title}</h2>
          {test.reports && test.reports.length > 0 && (
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              {test.reports.map(report => (
                <button
                  key={report.id}
                  onClick={() => setPreviewReport(report)}
                  className={`badge ${report.report_type === 'final' ? 'badge-success' : 'badge-warning'}`}
                  style={{
                    cursor: 'pointer',
                    padding: '0.4rem 0.75rem',
                    fontSize: '0.875rem',
                    border: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem'
                  }}
                  title={`Click to preview: ${report.file_name}`}
                >
                  <File size={14} />
                  {report.report_type === 'final' ? 'Final Report' : 'Draft Report'}
                </button>
              ))}
            </div>
          )}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem' }}>
          {/* Left Column */}
          <div>
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
            {test.project_name && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Project:</strong> {test.project_name} (#{test.project_number})
              </div>
            )}
            {test.project_manager && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Project Manager:</strong> {test.project_manager}
              </div>
            )}
          </div>

          {/* Right Column */}
          <div>
            {test.location && (
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>Location:</strong> {test.location}
              </div>
            )}
            {test.client_name && (
              <div style={{ marginBottom: '0.5rem' }}>
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
        </div>
      </div>

      {/* TAB NAVIGATION */}
      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '2px solid #e5e7eb', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('overview')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'overview' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'overview' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'overview' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab('stream')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'stream' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'stream' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'stream' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            <VideoIcon size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Live Stream
          </button>
          <button
            onClick={() => setActiveTab('testdata')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'testdata' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'testdata' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'testdata' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Test Data ({testDataFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('media')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'media' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'media' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'media' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            <ImageIcon size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Media ({mediaFiles.length})
          </button>
          <button
            onClick={() => setActiveTab('calibrations')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'calibrations' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'calibrations' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'calibrations' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            <Settings size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Calibrations ({test.calibrations?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('other')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'other' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'other' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'other' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            <FileText size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Other Docs ({otherDocs.length})
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'reports' ? '2px solid var(--primary)' : '2px solid transparent',
              color: activeTab === 'reports' ? 'var(--primary)' : 'var(--text-secondary)',
              fontWeight: activeTab === 'reports' ? 600 : 400,
              cursor: 'pointer',
              marginBottom: '-2px',
              transition: 'all 0.2s'
            }}
          >
            <File size={16} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'text-bottom' }} />
            Reports ({test.reports?.length || 0})
          </button>
        </div>
      </div>

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Test Content Summary</h3>
          </div>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            {/* Test Data Files */}
            <button
              onClick={() => setActiveTab('testdata')}
              style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#3b82f6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FileText size={20} color="#3b82f6" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Test Data Files</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {testDataFiles.length}
              </div>
            </button>

            {/* Images */}
            <button
              onClick={() => setActiveTab('images')}
              style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10b981'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <ImageIcon size={20} color="#10b981" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Images</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {images.length}
              </div>
            </button>

            {/* Videos */}
            <button
              onClick={() => setActiveTab('videos')}
              style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <VideoIcon size={20} color="#f59e0b" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Videos</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {videos.length}
              </div>
            </button>

            {/* Calibrated Equipment */}
            <button
              onClick={() => setActiveTab('calibrations')}
              style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#8b5cf6'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Settings size={20} color="#8b5cf6" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Calibrated Equipment</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {test.calibrations?.length || 0}
              </div>
            </button>

            {/* Other Documents */}
            <button
              onClick={() => setActiveTab('otherdocs')}
              style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#64748b'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <FolderArchive size={20} color="#64748b" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Other Documents</span>
              </div>
              <div style={{ fontSize: '2rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                {otherDocs.length}
              </div>
            </button>

            {/* Reports */}
            <button
              onClick={() => setActiveTab('reports')}
              style={{
                padding: '1rem',
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border-color)',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ef4444'}
              onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-color)'}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <File size={20} color="#ef4444" />
                <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>Reports</span>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', gap: '0.75rem', alignItems: 'baseline' }}>
                <div>
                  <span style={{ fontSize: '2rem' }}>{test.reports?.filter(r => r.report_type === 'draft').length || 0}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Draft</span>
                </div>
                <div>
                  <span style={{ fontSize: '2rem' }}>{test.reports?.filter(r => r.report_type === 'final').length || 0}</span>
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginLeft: '0.25rem' }}>Final</span>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* LIVE STREAM TAB */}
      {activeTab === 'stream' && (
        <>
          {/* OBS Instructions - Only visible to FRA employees (staff and above) */}
          {isFRAEmployee() && (
            <OBSInstructions
              testId={id}
              testTitle={test.title}
              clientName={test.client_name}
            />
          )}

          {/* Stream Viewer - Visible to everyone */}
          <TestStream testId={id} testTitle={test.title} />
        </>
      )}

      {/* TEST DATA TAB */}
      {activeTab === 'testdata' && (
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
      )}

      {/* MEDIA TAB */}
      {activeTab === 'media' && (
      <div>
        {/* Images Section */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <h3 className="card-title">
              <ImageIcon size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Images ({images.length})
            </h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openUploadModal('media', 'image')}
            >
              <Upload size={16} />
              Upload Images
            </button>
          </div>

          {images.length > 0 ? (
            <div className="media-grid">
              {images.map(media => renderMediaFile(media, true))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No images uploaded yet</p>
            </div>
          )}
        </div>

        {/* Videos Section */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <VideoIcon size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
              Videos ({videos.length})
            </h3>
            <button
              className="btn btn-primary btn-sm"
              onClick={() => openUploadModal('media', 'video')}
            >
              <Upload size={16} />
              Upload Videos
            </button>
          </div>

          {videos.length > 0 ? (
            <div className="media-grid">
              {videos.map(media => renderMediaFile(media, true))}
            </div>
          ) : (
            <div className="empty-state">
              <p>No videos uploaded yet</p>
            </div>
          )}
        </div>
      </div>
      )}

      {/* CALIBRATIONS TAB */}
      {activeTab === 'calibrations' && (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Settings size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Calibration Documents ({calibrationDocs.length})
          </h3>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {calibrationDocs.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleDownloadCategory('calibration')}
              >
                <FolderArchive size={16} />
                Download Uploaded Docs
              </button>
            )}
            {test.calibrations && test.calibrations.length > 0 && (
              <button
                className="btn btn-secondary btn-sm"
                onClick={handleDownloadCalibrationSheets}
                title="Download calibration sheets from linked equipment"
              >
                <FolderArchive size={16} />
                Download Equipment Sheets
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
      )}

      {/* OTHER DOCUMENTS TAB */}
      {activeTab === 'other' && (
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
      )}

      {/* REPORTS TAB */}
      {activeTab === 'reports' && (
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <File size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Test Reports ({test.reports?.length || 0})
          </h3>
          {isFRAEmployee() && (
            <button
              className="btn btn-primary btn-sm"
              onClick={() => setShowReportUpload(true)}
            >
              <Upload size={16} />
              Upload Report
            </button>
          )}
        </div>

        {test.reports && test.reports.length > 0 ? (
          <div>
            {test.reports.map(report => (
              <div key={report.id} className="card" style={{ marginBottom: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1 }}>
                    <File size={24} color="#64748b" />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                        <strong>{report.file_name}</strong>
                        <span className={`badge ${report.report_type === 'final' ? 'badge-success' : 'badge-warning'}`}>
                          {report.report_type === 'final' ? 'Final' : 'Draft'}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        Uploaded by {report.uploaded_by_name} on {formatDate(report.uploaded_at)}
                        {report.file_size && ` • ${(report.file_size / 1024 / 1024).toFixed(2)} MB`}
                      </div>
                      {report.notes && (
                        <div style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {report.notes}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => setPreviewReport(report)}
                      title="Preview report"
                    >
                      <Eye size={16} />
                      Preview
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleDownloadReport(report)}
                    >
                      <Download size={16} />
                      Download
                    </button>
                    {isFRAEmployee() && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteReport(report.id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p>No reports uploaded yet</p>
            {isFRAEmployee() && (
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Upload draft or final reports for this test
              </p>
            )}
          </div>
        )}
      </div>
      )}

      {/* Report Upload Modal */}
      {showReportUpload && (
        <div className="modal-overlay" onClick={() => setShowReportUpload(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Upload Report</h2>
              <button className="close-button" onClick={() => setShowReportUpload(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Report Type</label>
                <select
                  className="form-select"
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <option value="draft">Draft</option>
                  <option value="final">Final</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">File (PDF, DOCX, DOC - Max 100MB)</label>
                <input
                  type="file"
                  className="form-input"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => setReportFile(e.target.files[0])}
                />
                {reportFile && (
                  <div style={{ marginTop: '0.5rem', fontSize: '0.875rem', color: '#64748b' }}>
                    <div><strong>Selected:</strong> {reportFile.name}</div>
                    <div><strong>Size:</strong> {(reportFile.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowReportUpload(false)}
                disabled={uploadingReport}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleReportUpload}
                disabled={!reportFile || uploadingReport}
              >
                {uploadingReport ? 'Uploading...' : 'Upload Report'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT/DELETE ACTIONS */}
      <div className="card">
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'space-between' }}>
          <div>
            <button
              className={`btn ${test.isTaggedByUser ? 'btn-warning' : 'btn-secondary'}`}
              onClick={handleToggleTag}
              title={test.isTaggedByUser ? 'Remove from My Tests' : 'Add to My Tests'}
            >
              <Tag size={20} />
              {test.isTaggedByUser ? 'Untag from My Tests' : 'Tag as Mine'}
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
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
      </div>

      {showMediaUpload && (
        <MediaUpload
          testId={id}
          category={uploadCategory}
          mediaType={uploadMediaType}
          onClose={() => {
            setShowMediaUpload(false);
            setUploadCategory(null);
            setUploadMediaType(null);
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

      {previewReport && (
        <ReportPreview
          report={previewReport}
          onClose={() => setPreviewReport(null)}
          onDownload={handleDownloadReport}
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
