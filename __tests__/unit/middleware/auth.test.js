const jwt = require('jsonwebtoken');
const { verifyToken, requireAdmin, requireFRAEmployee, requireProjectManager } = require('../../../server/middleware/auth');

// Mock environment
process.env.JWT_SECRET = 'test-secret-key';

describe('Authentication Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  describe('verifyToken', () => {
    it('should deny access when no token is provided', () => {
      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access with invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow access with valid token', () => {
      const payload = { id: 1, username: 'testuser', role: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.username).toBe('testuser');
      expect(req.user.role).toBe('admin');
    });

    it('should handle malformed tokens', () => {
      req.headers.authorization = 'Bearer malformed.token.here';

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token.' });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireAdmin', () => {
    it('should allow access for admin users', () => {
      req.user = { id: 1, role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for non-admin users', () => {
      req.user = { id: 2, role: 'staff' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Admin access required.' });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access when no user is set', () => {
      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireProjectManager', () => {
    it('should allow access for admin users', () => {
      req.user = { id: 1, role: 'admin' };

      requireProjectManager(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for project_manager users', () => {
      req.user = { id: 2, role: 'project_manager' };

      requireProjectManager(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should deny access for staff users', () => {
      req.user = { id: 3, role: 'staff' };

      requireProjectManager(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. Project Manager or Admin access required.'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should deny access for client users', () => {
      req.user = { id: 4, role: 'client' };

      requireProjectManager(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('requireFRAEmployee', () => {
    it('should allow access for admin', () => {
      req.user = { id: 1, role: 'admin' };

      requireFRAEmployee(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should allow access for project_manager', () => {
      req.user = { id: 2, role: 'project_manager' };

      requireFRAEmployee(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for staff', () => {
      req.user = { id: 3, role: 'staff' };

      requireFRAEmployee(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should allow access for employee', () => {
      req.user = { id: 4, role: 'employee' };

      requireFRAEmployee(req, res, next);

      expect(next).toHaveBeenCalled();
    });

    it('should deny access for client', () => {
      req.user = { id: 5, role: 'client' };

      requireFRAEmployee(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Access denied. FRA employee access required.'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
