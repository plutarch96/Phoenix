import React from 'react';
import { X, Download, ExternalLink, FileText } from 'lucide-react';

function ReportPreview({ report, onClose, onDownload }) {
  const isPDF = report.file_name.toLowerCase().endsWith('.pdf');
  const fileUrl = `http://localhost:5000${report.file_path}`;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '90vw', width: '1200px', maxHeight: '90vh', height: '800px', display: 'flex', flexDirection: 'column' }}
      >
        <div className="modal-header">
          <div>
            <h2>Report Preview</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              {report.file_name}
            </p>
          </div>
          <button className="close-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div className="modal-body" style={{ flex: 1, padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {isPDF ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <iframe
                src={fileUrl}
                style={{
                  width: '100%',
                  height: '100%',
                  border: 'none',
                  flex: 1
                }}
                title="Report Preview"
              />
            </div>
          ) : (
            <div style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem',
              backgroundColor: 'var(--bg-tertiary)'
            }}>
              <FileText size={64} color="var(--text-secondary)" style={{ marginBottom: '1rem' }} />
              <h3>Preview not available</h3>
              <p style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', marginBottom: '1.5rem' }}>
                Preview is only available for PDF files. This is a {report.file_name.split('.').pop().toUpperCase()} file.
              </p>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button className="btn btn-primary" onClick={() => onDownload(report)}>
                  <Download size={16} />
                  Download File
                </button>
                <a
                  href={fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                >
                  <ExternalLink size={16} />
                  Open in New Tab
                </a>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flex: 1 }}>
            <span className={`badge ${report.report_type === 'final' ? 'badge-success' : 'badge-warning'}`}>
              {report.report_type === 'final' ? 'Final' : 'Draft'}
            </span>
            {report.file_size && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                {(report.file_size / 1024 / 1024).toFixed(2)} MB
              </span>
            )}
            {report.uploaded_by_name && (
              <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                • Uploaded by {report.uploaded_by_name}
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-primary" onClick={() => onDownload(report)}>
              <Download size={16} />
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportPreview;
