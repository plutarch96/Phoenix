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

  // Get recent tests with client info
  const testsQuery = `
    SELECT
      t.id,
      t.title,
      t.test_type,
      t.status,
      t.created_at,
      t.updated_at,
      c.name as client_name,
      c.client_number,
      p.project_name,
      p.project_number,
      'test' as type
    FROM tests t
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    ORDER BY t.created_at DESC
    LIMIT ?
  `;

  // Get recent calibrations
  const calibrationsQuery = `
    SELECT
      id,
      equipment_name,
      equipment_id,
      equipment_type,
      created_at,
      updated_at,
      'calibration' as type
    FROM calibrations
    ORDER BY created_at DESC
    LIMIT ?
  `;

  // Get recent projects with client info
  const projectsQuery = `
    SELECT
      p.id,
      p.project_name,
      p.status,
      p.created_at,
      p.updated_at,
      c.name as client_name,
      c.client_number,
      'project' as type
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    ORDER BY p.created_at DESC
    LIMIT ?
  `;

  // Execute all queries
  Promise.all([
    new Promise((resolve, reject) => {
      db.all(testsQuery, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(calibrationsQuery, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    }),
    new Promise((resolve, reject) => {
      db.all(projectsQuery, [limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    })
  ])
    .then(([tests, calibrations, projects]) => {
      // Combine and format all activities
      const activities = [];

      // Format tests
      tests.forEach(test => {
        const wasRecentlyUpdated = new Date(test.updated_at) > new Date(test.created_at);
        const projectInfo = test.project_name ? ` for project "${test.project_name}"` : '';

        activities.push({
          id: test.id,
          type: 'test',
          action: wasRecentlyUpdated ? 'updated' : 'created',
          description: `Test ${wasRecentlyUpdated ? 'updated' : 'created'}: ${test.title}`,
          details: `${test.client_name || 'Unknown Client'}${projectInfo} • ${test.test_type || 'No type'} • Status: ${test.status}`,
          entity_id: test.id,
          timestamp: wasRecentlyUpdated ? test.updated_at : test.created_at,
          created_at: test.created_at,
          link: `/tests/${test.id}`
        });
      });

      // Format calibrations
      calibrations.forEach(cal => {
        const wasRecentlyUpdated = new Date(cal.updated_at) > new Date(cal.created_at);

        activities.push({
          id: cal.id,
          type: 'calibration',
          action: wasRecentlyUpdated ? 'updated' : 'created',
          description: `Calibration equipment ${wasRecentlyUpdated ? 'updated' : 'added'}: ${cal.equipment_name}`,
          details: `${cal.equipment_type || 'Unknown type'} • ID: ${cal.equipment_id}`,
          entity_id: cal.id,
          timestamp: wasRecentlyUpdated ? cal.updated_at : cal.created_at,
          created_at: cal.created_at,
          link: `/calibrations`
        });
      });

      // Format projects
      projects.forEach(project => {
        const wasRecentlyUpdated = new Date(project.updated_at) > new Date(project.created_at);

        activities.push({
          id: project.id,
          type: 'project',
          action: wasRecentlyUpdated ? 'updated' : 'created',
          description: `Project ${wasRecentlyUpdated ? 'updated' : 'created'}: ${project.project_name}`,
          details: `${project.client_name || 'Unknown Client'} • Status: ${project.status}`,
          entity_id: project.id,
          timestamp: wasRecentlyUpdated ? project.updated_at : project.created_at,
          created_at: project.created_at,
          link: `/projects/${project.id}`
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      const limitedActivities = activities.slice(0, limit);

      res.json(limitedActivities);
    })
    .catch(err => {
      console.error('Error fetching recent activity:', err);
      res.status(500).json({ error: err.message });
    });
});

// Get recent tests only
router.get('/tests/recent', (req, res) => {
  const limit = req.query.limit || 5;

  db.all(
    `SELECT id, title, test_type, status, test_date, created_at
     FROM tests
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

// Get calibrations expiring soon (within next 30 days)
router.get('/calibrations/expiring-soon', (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + 30);
  const future = futureDate.toISOString().split('T')[0];

  db.all(
    `SELECT id, equipment_name, equipment_id, equipment_type, expiration_date
     FROM calibrations
     WHERE expiration_date BETWEEN ? AND ?
     ORDER BY expiration_date ASC`,
    [today, future],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
