import React, { useState } from 'react';
import { X, Upload, Image, Video, FileText } from 'lucide-react';
import { mediaAPI } from '../services/api';

function MediaUpload({ testId, category = 'media', onClose, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      alert('Please select at least one file');
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append('test_id', testId);
      formData.append('category', category);

      if (description) {
        formData.append('description', description);
      }

      files.forEach(file => {
        formData.append('files', file);
      });

      await mediaAPI.upload(formData);

      setUploadProgress(100);
      onSuccess();
    } catch (error) {
      console.error('Error uploading media:', error);
      alert('Failed to upload files: ' + (error.response?.data?.error || error.message));
      setLoading(false);
    }
  };

  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
      return <Image size={20} color="#3b82f6" />;
    } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
      return <Video size={20} color="#10b981" />;
    } else {
      return <FileText size={20} color="#64748b" />;
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const getCategoryInfo = () => {
    const categoryInfo = {
      test_data: {
        title: 'Upload Test Data Files',
        accept: '.csv,.xlsx,.xls,.json,.txt,.dat',
        description: 'CSV, Excel, JSON, TXT, DAT files'
      },
      media: {
        title: 'Upload Media Files',
        accept: 'image/*,video/*',
        description: 'Images (JPG, PNG, GIF) and Videos (MP4, AVI, MOV, etc.)'
      },
      calibration: {
        title: 'Upload Calibration PDF',
        accept: '.pdf',
        description: 'PDF files only'
      },
      other: {
        title: 'Upload Documents',
        accept: '.pdf,.doc,.docx,.txt,image/*',
        description: 'PDF, Word, Text, and Image files'
      }
    };
    return categoryInfo[category] || categoryInfo.media;
  };

  const info = getCategoryInfo();

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">{info.title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Select Files</label>
            <input
              type="file"
              multiple
              onChange={handleFileChange}
              accept={info.accept}
              style={{ width: '100%' }}
            />
            <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
              Supported: {info.description} (max 500MB per file)
            </p>
          </div>

          {files.length > 0 && (
            <div className="form-group">
              <label className="form-label">Selected Files ({files.length})</label>
              <div style={{ maxHeight: '200px', overflowY: 'auto', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.75rem' }}>
                {files.map((file, index) => (
                  <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
                    {getFileIcon(file)}
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{file.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        {formatFileSize(file.size)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Description (Optional)</label>
            <textarea
              className="form-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows="3"
              placeholder="Add a description for these files..."
            />
          </div>

          {loading && uploadProgress > 0 && (
            <div className="form-group">
              <div style={{ width: '100%', height: '8px', background: '#e5e7eb', borderRadius: '4px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    background: '#3b82f6',
                    transition: 'width 0.3s'
                  }}
                />
              </div>
              <p style={{ fontSize: '0.875rem', color: '#64748b', marginTop: '0.5rem', textAlign: 'center' }}>
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading || files.length === 0}>
              {loading ? 'Uploading...' : `Upload ${files.length} File${files.length !== 1 ? 's' : ''}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default MediaUpload;
