const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

// Initialize database
const db = require('./db/database');

// Import routes
const authRouter = require('./routes/auth');
const testsRouter = require('./routes/tests');
const calibrationsRouter = require('./routes/calibrations');
const clientsRouter = require('./routes/clients');
const projectsRouter = require('./routes/projects');
const mediaRouter = require('./routes/media');
const reportsRouter = require('./routes/reports');
const analyticsRouter = require('./routes/analytics');
const equipmentTypesRouter = require('./routes/equipmentTypes');
const searchRouter = require('./routes/search');
const auditRouter = require('./routes/audit');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false // Allow for development; configure properly in production
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// CORS
const corsOptions = {
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true
};
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log('  Body:', JSON.stringify(req.body));
  }
  next();
});

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/tests', testsRouter);
app.use('/api/calibrations', calibrationsRouter);
app.use('/api/clients', clientsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/media', mediaRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/search', searchRouter);
app.use('/api/equipment-types', equipmentTypesRouter);
app.use('/api/audit', auditRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Socket.IO for OBS video streaming (test-specific rooms)
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Join a test-specific room
  socket.on('join-test-stream', (testId) => {
    const roomName = `test-${testId}`;
    socket.join(roomName);
    console.log(`Client ${socket.id} joined room: ${roomName}`);
    socket.emit('joined-room', { testId, room: roomName });
  });

  // Leave a test-specific room
  socket.on('leave-test-stream', (testId) => {
    const roomName = `test-${testId}`;
    socket.leave(roomName);
    console.log(`Client ${socket.id} left room: ${roomName}`);
  });

  // Handle OBS stream data for a specific test
  socket.on('obs-stream', (data) => {
    const { testId, streamData } = data;
    const roomName = `test-${testId}`;
    // Broadcast to all clients in this test's room except sender
    socket.to(roomName).emit('video-stream', streamData);
  });

  // Handle stream control for a specific test
  socket.on('start-stream', (testId) => {
    const roomName = `test-${testId}`;
    socket.to(roomName).emit('stream-started');
    console.log(`Stream started for test ${testId}`);
  });

  socket.on('stop-stream', (testId) => {
    const roomName = `test-${testId}`;
    socket.to(roomName).emit('stream-stopped');
    console.log(`Stream stopped for test ${testId}`);
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
