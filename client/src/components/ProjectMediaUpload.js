import React, { useState } from 'react';
import { X, Upload, FileText } from 'lucide-react';
import { projectMediaAPI } from '../services/api';
import { useToast } from '../context/ToastContext';

function ProjectMediaUpload({ projectId, onClose, onSuccess }) {
  const toast = useToast();
  const [files, setFiles] = useState([]);
  const [description, setDescription] = useState('');
  const [documentCategory, setDocumentCategory] = useState('client_documents');
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes (500MB per file)
    const maxSize = 500 * 1024 * 1024;
    const invalidFiles = [];

    for (const file of selectedFiles) {
      if (file.size > maxSize) {
        invalidFiles.push(`${file.name} (${formatFileSize(file.size)} exceeds 500MB)`);
      }
    }

    if (invalidFiles.length > 0) {
      toast.error('Some files exceed the size limit:\n' + invalidFiles.join('\n'));
      e.target.value = '';
      return;
    }

    setFiles(selectedFiles);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length === 0) {
      toast.error('Please select at least one file');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();

      files.forEach(file => {
        formData.append('files', file);
      });

      formData.append('category', 'document');
      formData.append('description', description);
      formData.append('document_category', documentCategory);

      await projectMediaAPI.upload(projectId, formData);

      toast.success(`${files.length} file(s) uploaded successfully`);
      onSuccess();
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.response?.data?.error || 'Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        style={{ maxWidth: '600px' }}
      >
        <div className="modal-header">
          <h2 className="modal-title">Upload Project Documents</h2>
          <button onClick={onClose} className="close-button">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-group">
              <label className="form-label">
                <FileText size={18} style={{ display: 'inline', marginRight: '0.5rem' }} />
                Select Files
              </label>
              <input
                type="file"
                className="form-input"
                onChange={handleFileChange}
                multiple
                accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif,.zip,.rar"
              />
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Supported formats: PDF, Word, Excel, PowerPoint, images, ZIP<br/>
                Maximum file size: 500MB per file
              </p>
            </div>

            {files.length > 0 && (
              <div className="form-group">
                <label className="form-label">Selected Files ({files.length})</label>
                <div style={{
                  padding: '1rem',
                  background: 'var(--bg-tertiary)',
                  borderRadius: '8px',
                  maxHeight: '200px',
                  overflowY: 'auto'
                }}>
                  {files.map((file, index) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.5rem',
                      borderBottom: index < files.length - 1 ? '1px solid var(--border-color)' : 'none'
                    }}>
                      <div>
                        <div style={{ fontWeight: 500 }}>{file.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {formatFileSize(file.size)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Document Category</label>
              <select
                className="form-select"
                value={documentCategory}
                onChange={(e) => setDocumentCategory(e.target.value)}
                required
              >
                <option value="client_documents">Client Documents (visible to clients)</option>
                <option value="test_plan">Test Plan</option>
                <option value="purchase_order">Purchase Order</option>
                <option value="proposal">Proposal</option>
                <option value="nda">NDA</option>
              </select>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                Only "Client Documents" are visible to client users. Other categories are internal only.
              </p>
            </div>

            <div className="form-group">
              <label className="form-label">Description (Optional)</label>
              <textarea
                className="form-textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                placeholder="Add a description for these documents..."
              />
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || files.length === 0}
            >
              {loading ? (
                <>Uploading...</>
              ) : (
                <>
                  <Upload size={16} />
                  Upload {files.length > 0 ? `${files.length} File(s)` : 'Files'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectMediaUpload;
