const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Register new user (admin only)
router.post('/register', verifyToken, requireAdmin, async (req, res) => {
  const { username, email, password, role, client_id } = req.body;

  if (!username || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  if (!['admin', 'employee', 'client'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (role === 'client' && !client_id) {
    return res.status(400).json({ error: 'client_id is required for client users' });
  }

  try {
    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Insert user
    db.run(
      `INSERT INTO users (username, email, password_hash, role, client_id)
       VALUES (?, ?, ?, ?, ?)`,
      [username, email, password_hash, role, client_id || null],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Username or email already exists' });
          }
          return res.status(500).json({ error: err.message });
        }

        const newUserId = this.lastID;

        // Log user creation
        logAction({
          userId: req.user.id,
          username: req.user.username,
          action: 'CREATE',
          entityType: 'user',
          entityId: newUserId,
          details: `Created user: ${username} with role: ${role}`,
          ipAddress: req.ip
        });

        res.status(201).json({
          message: 'User created successfully',
          userId: newUserId
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Error creating user' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  db.get(
    'SELECT * FROM users WHERE username = ? AND is_active = 1',
    [username],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      try {
        // Verify password
        const validPassword = await bcrypt.compare(password, user.password_hash);

        if (!validPassword) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        db.run(
          'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
          [user.id]
        );

        // Generate JWT
        const token = jwt.sign(
          {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            client_id: user.client_id
          },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRES_IN }
        );

        // Log successful login
        logAction({
          userId: user.id,
          username: user.username,
          action: 'LOGIN',
          details: `Successful login`,
          ipAddress: req.ip
        });

        res.json({
          token,
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            client_id: user.client_id
          }
        });
      } catch (error) {
        res.status(500).json({ error: 'Error during authentication' });
      }
    }
  );
});

// Get current user
router.get('/me', verifyToken, (req, res) => {
  db.get(
    'SELECT id, username, email, role, client_id, created_at, last_login FROM users WHERE id = ?',
    [req.user.id],
    (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      res.json(user);
    }
  );
});

// Change password
router.post('/change-password', verifyToken, async (req, res) => {
  const { current_password, new_password } = req.body;

  if (!current_password || !new_password) {
    return res.status(400).json({ error: 'Current and new passwords are required' });
  }

  db.get(
    'SELECT password_hash FROM users WHERE id = ?',
    [req.user.id],
    async (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      try {
        // Verify current password
        const validPassword = await bcrypt.compare(current_password, user.password_hash);

        if (!validPassword) {
          return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const new_password_hash = await bcrypt.hash(new_password, 10);

        // Update password
        db.run(
          'UPDATE users SET password_hash = ? WHERE id = ?',
          [new_password_hash, req.user.id],
          (err) => {
            if (err) {
              return res.status(500).json({ error: 'Error updating password' });
            }

            // Log password change
            logAction({
              userId: req.user.id,
              username: req.user.username,
              action: 'UPDATE',
              entityType: 'user',
              entityId: req.user.id,
              details: 'Changed password',
              ipAddress: req.ip
            });

            res.json({ message: 'Password updated successfully' });
          }
        );
      } catch (error) {
        res.status(500).json({ error: 'Error changing password' });
      }
    }
  );
});

// Get all users (admin only)
router.get('/users', verifyToken, requireAdmin, (req, res) => {
  db.all(
    'SELECT id, username, email, role, client_id, is_active, created_at, last_login FROM users ORDER BY created_at DESC',
    (err, users) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }

      res.json(users);
    }
  );
});

// Update user (admin only)
router.put('/users/:id', verifyToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { username, email, role, client_id, is_active, password } = req.body;

  if (!username || !email || !role) {
    return res.status(400).json({ error: 'Username, email, and role are required' });
  }

  if (!['admin', 'employee', 'client'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }

  if (role === 'client' && !client_id) {
    return res.status(400).json({ error: 'client_id is required for client users' });
  }

  try {
    let query = `UPDATE users SET username = ?, email = ?, role = ?, client_id = ?, is_active = ? WHERE id = ?`;
    let params = [username, email, role, role === 'client' ? client_id : null, is_active !== undefined ? is_active : 1, id];

    db.run(query, params, function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Username or email already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      // Log user update
      logAction({
        userId: req.user.id,
        username: req.user.username,
        action: 'UPDATE',
        entityType: 'user',
        entityId: id,
        details: `Updated user: ${username} with role: ${role}`,
        ipAddress: req.ip
      });

      // If password is provided, update it separately
      if (password) {
        bcrypt.hash(password, 10).then(password_hash => {
          db.run('UPDATE users SET password_hash = ? WHERE id = ?', [password_hash, id], (err) => {
            if (err) {
              console.error('Error updating password:', err);
            }
          });
        });
      }

      res.json({ message: 'User updated successfully' });
    });
  } catch (error) {
    res.status(500).json({ error: 'Error updating user' });
  }
});

// Delete user (admin only)
router.delete('/users/:id', verifyToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Prevent deleting yourself
  if (parseInt(id) === req.user.id) {
    return res.status(400).json({ error: 'Cannot delete your own account' });
  }

  // Get user info for logging before deletion
  db.get('SELECT username, role FROM users WHERE id = ?', [id], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete user
    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Log user deletion
      logAction({
        userId: req.user.id,
        username: req.user.username,
        action: 'DELETE',
        entityType: 'user',
        entityId: id,
        details: `Deleted user: ${user.username} (${user.role})`,
        ipAddress: req.ip
      });

      res.json({ message: 'User deleted successfully' });
    });
  });
});

// Initialize default admin user (only runs if no users exist)
const initializeDefaultAdmin = async () => {
  db.get('SELECT COUNT(*) as count FROM users', async (err, result) => {
    if (err || result.count > 0) {
      return; // Users already exist
    }

    const defaultUsername = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
    const defaultEmail = process.env.DEFAULT_ADMIN_EMAIL || 'admin@fralab.com';
    const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD || 'changeme123';

    try {
      const password_hash = await bcrypt.hash(defaultPassword, 10);

      db.run(
        `INSERT INTO users (username, email, password_hash, role)
         VALUES (?, ?, ?, 'admin')`,
        [defaultUsername, defaultEmail, password_hash],
        (err) => {
          if (err) {
            console.error('Error creating default admin:', err);
          } else {
            console.log('✓ Default admin user created');
            console.log(`  Username: ${defaultUsername}`);
            console.log(`  Password: ${defaultPassword}`);
            console.log('  ⚠️  CHANGE THE PASSWORD IMMEDIATELY!');
          }
        }
      );
    } catch (error) {
      console.error('Error initializing default admin:', error);
    }
  });
};

// Call initialization
setTimeout(initializeDefaultAdmin, 1000);

module.exports = router;
