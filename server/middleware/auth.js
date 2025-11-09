const jwt = require('jsonwebtoken');
const db = require('../db/database');

// Ensure JWT_SECRET is set in production
if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('FATAL: JWT_SECRET must be set in production environment!');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-only-for-local-development';

// Verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token.' });
  }
};

// Check if user is FRA employee (admin, project_manager, or staff role)
const requireFRAEmployee = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'project_manager' && req.user.role !== 'staff' && req.user.role !== 'employee')) {
    return res.status(403).json({ error: 'Access denied. FRA employee access required.' });
  }
  next();
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin access required.' });
  }
  next();
};

// Check if user is admin or project manager
const requireProjectManager = (req, res, next) => {
  if (!req.user || (req.user.role !== 'admin' && req.user.role !== 'project_manager')) {
    return res.status(403).json({ error: 'Access denied. Project Manager or Admin access required.' });
  }
  next();
};

// Check if user can access specific client data
const requireClientAccess = (req, res, next) => {
  const clientId = req.params.client_id || req.body.client_id || req.query.client_id;

  // FRA employees can access all clients
  if (req.user.role === 'admin' || req.user.role === 'project_manager' || req.user.role === 'staff' || req.user.role === 'employee') {
    return next();
  }

  // Clients can only access their own data
  if (req.user.role === 'client') {
    if (!clientId || req.user.client_id !== parseInt(clientId)) {
      return res.status(403).json({ error: 'Access denied. You can only access your own data.' });
    }
    return next();
  }

  return res.status(403).json({ error: 'Access denied.' });
};

// Check if user can access specific test
const requireTestAccess = (testId, callback) => {
  return (req, res, next) => {
    const id = testId || req.params.id;

    // FRA employees can access all tests
    if (req.user.role === 'admin' || req.user.role === 'project_manager' || req.user.role === 'staff' || req.user.role === 'employee') {
      return next();
    }

    // Clients can only access tests belonging to their client
    if (req.user.role === 'client') {
      db.get(
        'SELECT client_id FROM tests WHERE id = ?',
        [id],
        (err, test) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!test) {
            return res.status(404).json({ error: 'Test not found' });
          }
          if (test.client_id !== req.user.client_id) {
            return res.status(403).json({ error: 'Access denied. This test does not belong to your organization.' });
          }
          next();
        }
      );
    } else {
      return res.status(403).json({ error: 'Access denied.' });
    }
  };
};

module.exports = {
  verifyToken,
  requireFRAEmployee,
  requireAdmin,
  requireProjectManager,
  requireClientAccess,
  requireTestAccess
};
