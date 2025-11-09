import React, { useState } from 'react';
import { Video, Copy, Check, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '../context/ToastContext';

/**
 * OBS Streaming Instructions Component
 * Shows staff/admin how to configure OBS for streaming to a specific test
 */
function OBSInstructions({ testId, testTitle, clientName }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const toast = useToast();

  // Get the WebSocket URL based on current domain
  const getWebSocketURL = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.host;
    return `${protocol}//${host}/ws?test_id=${testId}`;
  };

  const wsURL = getWebSocketURL();

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(fieldName);
      toast.success(`${fieldName} copied to clipboard`);
      setTimeout(() => setCopiedField(null), 2000);
    }).catch(() => {
      toast.error('Failed to copy to clipboard');
    });
  };

  const streamingSettings = {
    server: wsURL,
    streamKey: '', // Empty for WebSocket
    encoder: 'x264',
    videoBitrate: '2500',
    audioBitrate: '128',
    resolution: '1920x1080',
    fps: '30'
  };

  return (
    <div style={{
      border: '2px solid #3b82f6',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1rem',
      background: '#eff6ff'
    }}>
      {/* Header - Always Visible */}
      <div
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Video size={24} color="#3b82f6" />
          <div>
            <h3 style={{ margin: 0, color: '#1e40af', fontSize: '1rem' }}>
              OBS Live Stream Setup
            </h3>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              Click to {isExpanded ? 'hide' : 'show'} streaming instructions
            </p>
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} color="#3b82f6" /> : <ChevronDown size={20} color="#3b82f6" />}
      </div>

      {/* Expanded Instructions */}
      {isExpanded && (
        <div style={{ marginTop: '1rem' }}>
          {/* Stream Info */}
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            marginBottom: '1rem',
            border: '1px solid #cbd5e1'
          }}>
            <p style={{ margin: 0, fontSize: '0.875rem', color: '#64748b' }}>
              <strong>Test:</strong> {testTitle || `Test #${testId}`}
            </p>
            {clientName && (
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                <strong>Client:</strong> {clientName}
              </p>
            )}
            <div style={{
              marginTop: '0.75rem',
              padding: '0.5rem',
              background: '#fef3c7',
              borderRadius: '4px',
              display: 'flex',
              gap: '0.5rem'
            }}>
              <AlertCircle size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontSize: '0.75rem', color: '#92400e' }}>
                Only this test's assigned client will be able to view the stream
              </span>
            </div>
          </div>

          {/* Step-by-Step Instructions */}
          <div style={{ marginBottom: '1rem' }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#1e40af' }}>
              Step-by-Step Setup:
            </h4>

            <ol style={{ margin: 0, paddingLeft: '1.5rem', fontSize: '0.875rem', lineHeight: '1.6' }}>
              <li style={{ marginBottom: '0.5rem' }}>
                Open <strong>OBS Studio</strong> on your computer
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Go to <strong>Settings</strong> → <strong>Stream</strong>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Set Service to: <strong>Custom...</strong>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Copy and paste the Server URL below into the <strong>Server</strong> field
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Leave <strong>Stream Key</strong> empty (not needed for WebSocket)
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Click <strong>Apply</strong> and <strong>OK</strong>
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Set up your scene with your test camera/screen capture
              </li>
              <li style={{ marginBottom: '0.5rem' }}>
                Click <strong>Start Streaming</strong>
              </li>
            </ol>
          </div>

          {/* Server URL - Copyable */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: 600, color: '#1e40af' }}>
              Server URL:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                value={wsURL}
                readOnly
                style={{
                  flex: 1,
                  padding: '0.5rem',
                  border: '1px solid #cbd5e1',
                  borderRadius: '4px',
                  fontSize: '0.875rem',
                  fontFamily: 'monospace',
                  background: 'white'
                }}
              />
              <button
                onClick={() => copyToClipboard(wsURL, 'Server URL')}
                className="btn btn-primary btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}
              >
                {copiedField === 'Server URL' ? (
                  <>
                    <Check size={16} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={16} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Recommended Settings */}
          <div style={{
            background: 'white',
            padding: '1rem',
            borderRadius: '8px',
            border: '1px solid #cbd5e1'
          }}>
            <h4 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', color: '#1e40af' }}>
              Recommended OBS Settings:
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.875rem' }}>
              <div>
                <strong>Encoder:</strong> {streamingSettings.encoder}
              </div>
              <div>
                <strong>Video Bitrate:</strong> {streamingSettings.videoBitrate} Kbps
              </div>
              <div>
                <strong>Audio Bitrate:</strong> {streamingSettings.audioBitrate} Kbps
              </div>
              <div>
                <strong>Resolution:</strong> {streamingSettings.resolution}
              </div>
              <div>
                <strong>FPS:</strong> {streamingSettings.fps}
              </div>
            </div>
            <p style={{ margin: '0.75rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
              Adjust based on your internet speed and computer performance
            </p>
          </div>

          {/* Troubleshooting */}
          <details style={{ marginTop: '1rem' }}>
            <summary style={{
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 600,
              color: '#1e40af',
              padding: '0.5rem',
              background: 'white',
              borderRadius: '4px',
              border: '1px solid #cbd5e1'
            }}>
              Troubleshooting
            </summary>
            <div style={{
              marginTop: '0.5rem',
              padding: '0.75rem',
              background: 'white',
              borderRadius: '4px',
              border: '1px solid #cbd5e1',
              fontSize: '0.875rem'
            }}>
              <p style={{ margin: '0 0 0.5rem 0' }}><strong>Stream won't start?</strong></p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Check that the Server URL is copied correctly</li>
                <li>Make sure Stream Key field is empty</li>
                <li>Verify your internet connection</li>
                <li>Try restarting OBS</li>
              </ul>

              <p style={{ margin: '1rem 0 0.5rem 0' }}><strong>Poor quality or buffering?</strong></p>
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li>Lower the video bitrate (try 1500-2000 Kbps)</li>
                <li>Reduce resolution to 1280x720</li>
                <li>Lower FPS to 24 or 25</li>
                <li>Close other bandwidth-heavy applications</li>
              </ul>
            </div>
          </details>
        </div>
      )}
    </div>
  );
}

export default OBSInstructions;
