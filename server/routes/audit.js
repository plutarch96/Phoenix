const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { verifyToken, requireAdmin } = require('../middleware/auth');

// Get all audit logs (admin only, with pagination and filtering)
router.get('/', verifyToken, requireAdmin, (req, res) => {
  const {
    user_id,
    action,
    entity_type,
    start_date,
    end_date,
    page = 1,
    limit = 50
  } = req.query;

  let query = 'SELECT * FROM audit_logs';
  const conditions = [];
  const params = [];

  if (user_id) {
    conditions.push('user_id = ?');
    params.push(user_id);
  }

  if (action) {
    conditions.push('action = ?');
    params.push(action);
  }

  if (entity_type) {
    conditions.push('entity_type = ?');
    params.push(entity_type);
  }

  if (start_date) {
    conditions.push('timestamp >= ?');
    params.push(start_date);
  }

  if (end_date) {
    conditions.push('timestamp <= ?');
    params.push(end_date);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY timestamp DESC';

  // Add pagination
  const offset = (page - 1) * limit;
  query += ` LIMIT ? OFFSET ?`;
  params.push(parseInt(limit), offset);

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get total count for pagination
    let countQuery = 'SELECT COUNT(*) as total FROM audit_logs';
    const countParams = params.slice(0, -2); // Remove limit and offset

    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    db.get(countQuery, countParams, (err, countRow) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.json({
        logs: rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: countRow.total,
          totalPages: Math.ceil(countRow.total / limit)
        }
      });
    });
  });
});

// Get audit logs for a specific entity
router.get('/entity/:entityType/:entityId', verifyToken, requireAdmin, (req, res) => {
  const { entityType, entityId } = req.params;

  db.all(
    `SELECT * FROM audit_logs
     WHERE entity_type = ? AND entity_id = ?
     ORDER BY timestamp DESC`,
    [entityType, entityId],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get audit logs for a specific user
router.get('/user/:userId', verifyToken, requireAdmin, (req, res) => {
  const { userId } = req.params;
  const { limit = 50 } = req.query;

  db.all(
    `SELECT * FROM audit_logs
     WHERE user_id = ?
     ORDER BY timestamp DESC
     LIMIT ?`,
    [userId, parseInt(limit)],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get summary statistics
router.get('/stats', verifyToken, requireAdmin, (req, res) => {
  const { start_date, end_date } = req.query;

  let dateCondition = '';
  const params = [];

  if (start_date && end_date) {
    dateCondition = 'WHERE timestamp BETWEEN ? AND ?';
    params.push(start_date, end_date);
  }

  // Get actions by type
  db.all(
    `SELECT action, COUNT(*) as count
     FROM audit_logs
     ${dateCondition}
     GROUP BY action
     ORDER BY count DESC`,
    params,
    (err, actionStats) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get activity by user
      db.all(
        `SELECT user_id, username, COUNT(*) as action_count
         FROM audit_logs
         ${dateCondition}
         GROUP BY user_id, username
         ORDER BY action_count DESC
         LIMIT 10`,
        params,
        (err, userStats) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get activity by entity type
          db.all(
            `SELECT entity_type, COUNT(*) as count
             FROM audit_logs
             ${dateCondition}
             WHERE entity_type IS NOT NULL
             GROUP BY entity_type
             ORDER BY count DESC`,
            params,
            (err, entityStats) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                actionStats,
                userStats,
                entityStats
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
