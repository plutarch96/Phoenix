import React, { useState, useEffect, useRef } from 'react';
import { Video, VideoOff, Radio } from 'lucide-react';
import io from 'socket.io-client';

function StreamViewer() {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const mediaSourceRef = useRef(null);
  const sourceBufferRef = useRef(null);

  useEffect(() => {
    // Connect to Socket.IO server
    socketRef.current = io('http://localhost:5000');

    socketRef.current.on('connect', () => {
      console.log('Connected to server');
      setIsConnected(true);
    });

    socketRef.current.on('disconnect', () => {
      console.log('Disconnected from server');
      setIsConnected(false);
      setIsStreaming(false);
    });

    socketRef.current.on('stream-started', () => {
      console.log('Stream started');
      setIsStreaming(true);
    });

    socketRef.current.on('stream-stopped', () => {
      console.log('Stream stopped');
      setIsStreaming(false);
    });

    socketRef.current.on('video-stream', (data) => {
      // Handle incoming video stream data
      // This is a simplified version - in production you'd use WebRTC or HLS
      console.log('Received video data:', data);
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h2>Live Stream</h2>
          <p>View OBS video stream in real-time</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
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
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">
            <Video size={20} style={{ display: 'inline', marginRight: '0.5rem' }} />
            Stream Viewer
          </h3>
          {isStreaming && (
            <span className="badge badge-danger" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', background: '#ef4444', borderRadius: '50%', animation: 'pulse 2s infinite' }}></span>
              LIVE
            </span>
          )}
        </div>

        <div style={{
          background: '#000',
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
          paddingBottom: '56.25%' // 16:9 aspect ratio
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
              <VideoOff size={64} style={{ marginBottom: '1rem', opacity: 0.5 }} />
              <p style={{ fontSize: '1.25rem', opacity: 0.7 }}>
                {isConnected ? 'Waiting for stream...' : 'Not connected to server'}
              </p>
            </div>
          )}
        </div>

        <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '8px' }}>
          <h4 style={{ marginBottom: '1rem' }}>How to Stream from OBS</h4>
          <ol style={{ marginLeft: '1.5rem', color: '#64748b', lineHeight: '1.8' }}>
            <li>Install OBS Studio if you haven't already</li>
            <li>Set up your scene with the video sources you want to stream</li>
            <li>Go to Settings → Stream</li>
            <li>Select "Custom" as the service</li>
            <li>Enter the server URL: <code style={{ background: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '4px' }}>http://localhost:5000</code></li>
            <li>For WebRTC streaming, you'll need to use the OBS WebRTC plugin</li>
            <li>Start streaming from OBS to see the video here</li>
          </ol>
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#dbeafe', borderRadius: '6px', borderLeft: '4px solid #3b82f6' }}>
            <strong style={{ color: '#1e40af' }}>Note:</strong>
            <p style={{ margin: '0.5rem 0 0 0', color: '#1e3a8a' }}>
              This is a basic implementation. For production use, consider implementing a full WebRTC or RTMP/HLS streaming solution.
              You can use libraries like <strong>node-media-server</strong> for RTMP or <strong>mediasoup</strong> for WebRTC.
            </p>
          </div>
        </div>
      </div>

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

export default StreamViewer;
