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

    // Validate file sizes based on category
    const limits = getFileSizeLimits();
    const invalidFiles = [];

    for (const file of selectedFiles) {
      const ext = file.name.split('.').pop().toLowerCase();
      let maxSize = limits.default;

      // Determine max size based on file type
      if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext)) {
        maxSize = limits.image;
      } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext)) {
        maxSize = limits.video;
      } else if (ext === 'pdf') {
        maxSize = limits.pdf;
      } else if (category === 'test_data') {
        maxSize = limits.testData;
      }

      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (${formatFileSize(file.size)} exceeds ${formatFileSize(maxSize)})`);
      }
    }

    if (invalidFiles.length > 0) {
      alert('The following files exceed the size limit:\n\n' + invalidFiles.join('\n'));
      e.target.value = '';
      return;
    }

    setFiles(selectedFiles);
  };

  const getFileSizeLimits = () => {
    return {
      testData: 1 * 1024 * 1024 * 1024,   // 1GB for test data
      video: 10 * 1024 * 1024 * 1024,      // 10GB for videos
      image: 200 * 1024 * 1024,            // 200MB for images
      pdf: 1 * 1024 * 1024 * 1024,         // 1GB for PDFs
      default: 1 * 1024 * 1024 * 1024      // 1GB default
    };
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
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const getCategoryInfo = () => {
    const categoryInfo = {
      test_data: {
        title: 'Upload Test Data Files',
        accept: '.csv,.xlsx,.xls,.json,.txt,.dat',
        description: 'CSV, Excel, JSON, TXT, DAT files',
        sizeInfo: 'Max 1GB per file'
      },
      media: {
        title: 'Upload Media Files',
        accept: 'image/*,video/*',
        description: 'Images (JPG, PNG, GIF) and Videos (MP4, AVI, MOV, etc.)',
        sizeInfo: 'Max 200MB for images, 10GB for videos'
      },
      calibration: {
        title: 'Upload Calibration PDF',
        accept: '.pdf',
        description: 'PDF files only',
        sizeInfo: 'Max 1GB per file'
      },
      other: {
        title: 'Upload Documents',
        accept: '.pdf,.doc,.docx,.txt,image/*',
        description: 'PDF, Word, Text, and Image files',
        sizeInfo: 'Max 1GB for PDFs, 200MB for images'
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
              Supported: {info.description} ({info.sizeInfo})
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
