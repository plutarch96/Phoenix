const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');

// Initialize database
const db = require('./db/database');

// Import routes
const testsRouter = require('./routes/tests');
const calibrationsRouter = require('./routes/calibrations');
const clientsRouter = require('./routes/clients');
const mediaRouter = require('./routes/media');
const analyticsRouter = require('./routes/analytics');
const equipmentTypesRouter = require('./routes/equipmentTypes');
const searchRouter = require('./routes/search');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/tests', testsRouter);
app.use('/api/calibrations', calibrationsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/search', searchRouter);
app.use('/api/equipment-types', equipmentTypesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.IO for OBS video streaming
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle OBS stream data
  socket.on('obs-stream', (data) => {
    // Broadcast to all connected clients except sender
    socket.broadcast.emit('video-stream', data);
  });

  // Handle stream control
  socket.on('start-stream', () => {
    socket.broadcast.emit('stream-started');
  });

  socket.on('stop-stream', () => {
    socket.broadcast.emit('stream-stopped');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`WebSocket available for OBS streaming`);
});

module.exports = { app, io };
