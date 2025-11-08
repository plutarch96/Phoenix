const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get dashboard statistics
router.get('/dashboard', (req, res) => {
  const stats = {};

  // Get total tests
  db.get('SELECT COUNT(*) as total FROM tests', (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    stats.totalTests = row.total;

    // Get tests by status
    db.all(
      'SELECT status, COUNT(*) as count FROM tests GROUP BY status',
      (err, rows) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        stats.testsByStatus = rows;

        // Get total clients
        db.get('SELECT COUNT(*) as total FROM clients', (err, row) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          stats.totalClients = row.total;

          // Get total calibrations
          db.get('SELECT COUNT(*) as total FROM calibrations', (err, row) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }
            stats.totalCalibrations = row.total;

            // Get expired calibrations
            const today = new Date().toISOString().split('T')[0];
            db.get(
              'SELECT COUNT(*) as total FROM calibrations WHERE expiration_date < ?',
              [today],
              (err, row) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }
                stats.expiredCalibrations = row.total;

                // Get upcoming expirations (within 30 days)
                const futureDate = new Date();
                futureDate.setDate(futureDate.getDate() + 30);
                const future = futureDate.toISOString().split('T')[0];

                db.get(
                  'SELECT COUNT(*) as total FROM calibrations WHERE expiration_date BETWEEN ? AND ?',
                  [today, future],
                  (err, row) => {
                    if (err) {
                      return res.status(500).json({ error: err.message });
                    }
                    stats.upcomingExpirations = row.total;

                    // Get total media files
                    db.get('SELECT COUNT(*) as total FROM test_media', (err, row) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }
                      stats.totalMediaFiles = row.total;

                      // Get media by type
                      db.all(
                        'SELECT media_type, COUNT(*) as count FROM test_media GROUP BY media_type',
                        (err, rows) => {
                          if (err) {
                            return res.status(500).json({ error: err.message });
                          }
                          stats.mediaByType = rows;

                          res.json(stats);
                        }
                      );
                    });
                  }
                );
              }
            );
          });
        });
      }
    );
  });
});

// Get test trends (tests created over time)
router.get('/trends/tests', (req, res) => {
  const { period } = req.query; // 'week', 'month', 'year'

  let dateFormat;
  let groupBy;

  switch (period) {
    case 'week':
      dateFormat = '%Y-%m-%d';
      groupBy = 7;
      break;
    case 'year':
      dateFormat = '%Y-%m';
      groupBy = 12;
      break;
    default: // month
      dateFormat = '%Y-%m-%d';
      groupBy = 30;
  }

  db.all(
    `SELECT DATE(created_at) as date, COUNT(*) as count
     FROM tests
     GROUP BY DATE(created_at)
     ORDER BY date DESC
     LIMIT ?`,
    [groupBy],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows.reverse());
    }
  );
});

// Get popular tags
router.get('/tags/popular', (req, res) => {
  db.all(
    `SELECT tag, COUNT(*) as count
     FROM test_tags
     GROUP BY tag
     ORDER BY count DESC
     LIMIT 20`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get all unique tags
router.get('/tags', (req, res) => {
  db.all(
    'SELECT DISTINCT tag FROM test_tags ORDER BY tag',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows.map(r => r.tag));
    }
  );
});

// Get client statistics
router.get('/clients/stats', (req, res) => {
  db.all(
    `SELECT c.id, c.name, COUNT(t.id) as test_count
     FROM clients c
     LEFT JOIN tests t ON c.id = t.client_id
     GROUP BY c.id, c.name
     ORDER BY test_count DESC`,
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get recent activity
router.get('/activity/recent', (req, res) => {
  const limit = req.query.limit || 10;

  db.all(
    `SELECT id, title, created_at, 'test' as type FROM tests
     UNION ALL
     SELECT id, equipment_name as title, created_at, 'calibration' as type FROM calibrations
     ORDER BY created_at DESC
     LIMIT ?`,
    [limit],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
