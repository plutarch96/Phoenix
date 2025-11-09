const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');

// Mock database
jest.mock('../../../server/db/database');
const db = require('../../../server/db/database');

// Setup test app
const app = express();
app.use(express.json());

// Import routes after mocking db
const authRoutes = require('../../../server/routes/auth');
app.use('/api/auth', authRoutes);

// Set test JWT secret
process.env.JWT_SECRET = 'test-secret-key';

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'admin',
        password: hashedPassword,
        client_id: null
      };

      // Mock database response
      db.get = jest.fn((query, params, callback) => {
        callback(null, mockUser);
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should fail login with invalid username', async () => {
      db.get = jest.fn((query, params, callback) => {
        callback(null, null); // User not found
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error');
    });

    it('should fail login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      const mockUser = {
        id: 1,
        username: 'testuser',
        password: hashedPassword
      };

      db.get = jest.fn((query, params, callback) => {
        callback(null, mockUser);
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body.error).toContain('Invalid');
    });

    it('should handle database errors gracefully', async () => {
      db.get = jest.fn((query, params, callback) => {
        callback(new Error('Database error'), null);
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('error');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
          // missing password
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      // Mock check for existing user (none found)
      db.get = jest.fn((query, params, callback) => {
        callback(null, null);
      });

      // Mock user creation
      db.run = jest.fn(function(query, params, callback) {
        this.lastID = 1;
        callback.call(this, null);
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'Password123',
          role: 'staff'
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user.username).toBe('newuser');
    });

    it('should prevent duplicate usernames', async () => {
      db.get = jest.fn((query, params, callback) => {
        callback(null, { id: 1, username: 'existing' }); // User exists
      });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'existing',
          email: 'new@example.com',
          password: 'Password123',
          role: 'staff'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('already exists');
    });

    it('should validate password strength', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'new@example.com',
          password: 'weak', // Too short
          role: 'staff'
        });

      expect(response.status).toBe(400);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          email: 'invalid-email',
          password: 'Password123',
          role: 'staff'
        });

      expect(response.status).toBe(400);
    });
  });
});
