import React, { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

function ConfirmDialog({ title, message, onConfirm, onCancel, confirmText = 'Yes', cancelText = 'No', danger = true }) {
  const cancelButtonRef = useRef(null);

  useEffect(() => {
    // Focus the cancel button (No) by default
    if (cancelButtonRef.current) {
      cancelButtonRef.current.focus();
    }

    // Handle Esc key press
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onCancel]);

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div
        className="modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px' }}
      >
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {danger && <AlertTriangle size={24} color="#ef4444" />}
            <h2 className="modal-title">{title}</h2>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '1.5rem', fontSize: '1rem', color: '#1e293b' }}>
          {message}
        </div>

        <div className="modal-actions" style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            ref={cancelButtonRef}
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            style={{ fontWeight: 600 }}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmDialog;
