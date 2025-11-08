const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all tests with optional filtering
router.get('/', (req, res) => {
  const { client_id, status, tag } = req.query;

  let query = `
    SELECT DISTINCT t.*, c.name as client_name
    FROM tests t
    LEFT JOIN clients c ON t.client_id = c.id
  `;

  const conditions = [];
  const params = [];

  if (client_id) {
    conditions.push('t.client_id = ?');
    params.push(client_id);
  }

  if (status) {
    conditions.push('t.status = ?');
    params.push(status);
  }

  if (tag) {
    query = `
      SELECT DISTINCT t.*, c.name as client_name
      FROM tests t
      LEFT JOIN clients c ON t.client_id = c.id
      LEFT JOIN test_tags tt ON t.id = tt.test_id
    `;
    conditions.push('tt.tag = ?');
    params.push(tag);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY t.created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Get tags for each test
    const testIds = rows.map(r => r.id);
    if (testIds.length === 0) {
      return res.json([]);
    }

    const placeholders = testIds.map(() => '?').join(',');
    db.all(
      `SELECT test_id, tag FROM test_tags WHERE test_id IN (${placeholders})`,
      testIds,
      (err, tags) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Group tags by test_id
        const tagsByTest = {};
        tags.forEach(t => {
          if (!tagsByTest[t.test_id]) {
            tagsByTest[t.test_id] = [];
          }
          tagsByTest[t.test_id].push(t.tag);
        });

        // Add tags to each test
        const testsWithTags = rows.map(test => ({
          ...test,
          tags: tagsByTest[test.id] || []
        }));

        res.json(testsWithTags);
      }
    );
  });
});

// Get single test with all details
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT t.*, c.name as client_name, c.contact_email, c.contact_phone
     FROM tests t
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.id = ?`,
    [id],
    (err, test) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!test) {
        return res.status(404).json({ error: 'Test not found' });
      }

      // Get tags
      db.all('SELECT tag FROM test_tags WHERE test_id = ?', [id], (err, tags) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Get media
        db.all('SELECT * FROM test_media WHERE test_id = ?', [id], (err, media) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get calibrations
          db.all(
            `SELECT c.* FROM calibrations c
             JOIN test_calibrations tc ON c.id = tc.calibration_id
             WHERE tc.test_id = ?`,
            [id],
            (err, calibrations) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              res.json({
                ...test,
                tags: tags.map(t => t.tag),
                media: media,
                calibrations: calibrations
              });
            }
          );
        });
      });
    }
  );
});

// Create new test
router.post('/', (req, res) => {
  const { title, description, test_type, governing_standard, client_id, test_date, status, tags } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  db.run(
    `INSERT INTO tests (title, description, test_type, governing_standard, client_id, test_date, status)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [title, description, test_type, governing_standard, client_id, test_date, status || 'pending'],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const testId = this.lastID;

      // Add tags if provided
      if (tags && Array.isArray(tags) && tags.length > 0) {
        const stmt = db.prepare('INSERT INTO test_tags (test_id, tag) VALUES (?, ?)');
        tags.forEach(tag => {
          stmt.run(testId, tag);
        });
        stmt.finalize();
      }

      res.status(201).json({ id: testId, message: 'Test created successfully' });
    }
  );
});

// Update test
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { title, description, test_type, governing_standard, client_id, test_date, status, tags } = req.body;

  db.run(
    `UPDATE tests
     SET title = ?, description = ?, test_type = ?, governing_standard = ?, client_id = ?, test_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, description, test_type, governing_standard, client_id, test_date, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Update tags
      if (tags !== undefined) {
        db.run('DELETE FROM test_tags WHERE test_id = ?', [id], (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          if (Array.isArray(tags) && tags.length > 0) {
            const stmt = db.prepare('INSERT INTO test_tags (test_id, tag) VALUES (?, ?)');
            tags.forEach(tag => {
              stmt.run(id, tag);
            });
            stmt.finalize();
          }
        });
      }

      res.json({ message: 'Test updated successfully' });
    }
  );
});

// Delete test
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tests WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Test deleted successfully' });
  });
});

// Add calibration to test
router.post('/:id/calibrations', (req, res) => {
  const { id } = req.params;
  const { calibration_id } = req.body;

  db.run(
    'INSERT INTO test_calibrations (test_id, calibration_id) VALUES (?, ?)',
    [id, calibration_id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Calibration already linked to this test' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Calibration added to test' });
    }
  );
});

// Remove calibration from test
router.delete('/:id/calibrations/:calibration_id', (req, res) => {
  const { id, calibration_id } = req.params;

  db.run(
    'DELETE FROM test_calibrations WHERE test_id = ? AND calibration_id = ?',
    [id, calibration_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Calibration removed from test' });
    }
  );
});

module.exports = router;
