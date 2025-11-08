import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Radio, Minimize2, Maximize2 } from 'lucide-react';
import io from 'socket.io-client';

function TestStream({ testId, testTitle }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const videoRef = useRef(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);

      // Join the test-specific room
      socketRef.current.emit('join-test-stream', testId);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsStreaming(false);
    });

    socketRef.current.on('joined-room', (data) => {
      console.log('Joined room:', data.room);
    });

    socketRef.current.on('stream-started', () => {
      console.log('Stream started for test', testId);
      setIsStreaming(true);
    });

    socketRef.current.on('stream-stopped', () => {
      console.log('Stream stopped for test', testId);
      setIsStreaming(false);
    });

    socketRef.current.on('video-stream', (data) => {
      // Handle incoming video stream data
      // This is a simplified version - in production you'd use WebRTC or HLS
      console.log('Received video data for test', testId);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-test-stream', testId);
        socketRef.current.disconnect();
      }
    };
  }, [testId]);

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Video size={20} />
          <h3 className="card-title" style={{ margin: 0 }}>
            Live Stream{testTitle ? ` - ${testTitle}` : ''}
          </h3>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {isStreaming && (
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{
                width: '8px',
                height: '8px',
                background: '#ef4444',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }}></span>
              LIVE
            </span>
          )}
          {isConnected ? (
            <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Radio size={14} />
              Connected
            </span>
          ) : (
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <VideoOff size={14} />
              Disconnected
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.5rem' }}
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>

      <div style={{
        background: '#000',
        borderRadius: '8px',
        overflow: 'hidden',
        position: 'relative',
        paddingBottom: isExpanded ? '56.25%' : '42%', // 16:9 vs smaller aspect ratio
        transition: 'padding-bottom 0.3s ease'
      }}>
        <video
          ref={videoRef}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain'
          }}
          controls
          autoPlay
          muted
        />
        {!isStreaming && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center',
            color: 'white'
          }}>
            <VideoOff size={48} style={{ marginBottom: '0.75rem', opacity: 0.5 }} />
            <p style={{ fontSize: '1rem', opacity: 0.7 }}>
              {isConnected ? 'Waiting for stream...' : 'Not connected to server'}
            </p>
          </div>
        )}
      </div>

      {/* Compact instructions */}
      {!isStreaming && (
        <div style={{ marginTop: '1rem', padding: '1rem', background: '#f9fafb', borderRadius: '8px', fontSize: '0.875rem' }}>
          <strong>OBS Streaming Instructions:</strong>
          <ol style={{ marginLeft: '1.25rem', marginTop: '0.5rem', color: '#64748b', lineHeight: '1.6', marginBottom: 0 }}>
            <li>Open OBS Studio and configure your scene</li>
            <li>Go to Settings → Stream → Select "Custom"</li>
            <li>Server URL: <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.8rem' }}>http://localhost:5000</code></li>
            <li>Stream Key: <code style={{ background: '#e5e7eb', padding: '0.125rem 0.375rem', borderRadius: '4px', fontSize: '0.8rem' }}>test-{testId}</code></li>
            <li>Start streaming to see the video here</li>
          </ol>
        </div>
      )}

      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
}

export default TestStream;
