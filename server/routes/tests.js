const express = require('express');
const router = express.Router();
const db = require('../db/database');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { verifyToken } = require('../middleware/auth');
const { requireProjectManager, requireStaffOrAbove } = require('../middleware/roleChecks');

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
  const { user_id } = req.query; // Optional user_id to check if user has tagged this test

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

          // Get calibrations (only active ones)
          db.all(
            `SELECT c.* FROM calibrations c
             JOIN test_calibrations tc ON c.id = tc.calibration_id
             WHERE tc.test_id = ? AND c.is_active = 1`,
            [id],
            (err, calibrations) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Get reports
              db.all(
                `SELECT r.*, u.username as uploaded_by_name
                 FROM test_reports r
                 LEFT JOIN users u ON r.uploaded_by = u.id
                 WHERE r.test_id = ?
                 ORDER BY r.uploaded_at DESC`,
                [id],
                (err, reports) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  // Check if user has tagged this test (if user_id provided)
                  if (user_id) {
                    db.get(
                      'SELECT id FROM user_test_tags WHERE user_id = ? AND test_id = ?',
                      [user_id, id],
                      (err, userTag) => {
                        if (err) {
                          return res.status(500).json({ error: err.message });
                        }

                        res.json({
                          ...test,
                          tags: tags.map(t => t.tag),
                          media: media,
                          calibrations: calibrations,
                          reports: reports,
                          isTaggedByUser: !!userTag
                        });
                      }
                    );
                  } else {
                    res.json({
                      ...test,
                      tags: tags.map(t => t.tag),
                      media: media,
                      calibrations: calibrations,
                      reports: reports,
                      isTaggedByUser: false
                    });
                  }
                }
              );
            }
          );
        });
      });
    }
  );
});

// Create new test
router.post('/', verifyToken, requireStaffOrAbove, (req, res) => {
  const { title, description, test_type, governing_standard, location, client_id, project_id, test_date, status, tags } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Title is required' });
  }

  // Auto-generate test number if project_id is provided
  const generateTestNumber = (callback) => {
    if (!project_id) {
      return callback(null);
    }

    db.get(
      `SELECT MAX(CAST(test_number AS INTEGER)) as max_number
       FROM tests
       WHERE project_id = ? AND test_number IS NOT NULL`,
      [project_id],
      (err, result) => {
        if (err) return callback(err);
        const nextNumber = (result.max_number || 0) + 1;
        const formattedNumber = String(nextNumber).padStart(3, '0');
        callback(null, formattedNumber);
      }
    );
  };

  generateTestNumber((err, test_number) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    db.run(
      `INSERT INTO tests (title, description, test_type, governing_standard, location, client_id, project_id, test_number, test_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, description, test_type, governing_standard, location, client_id, project_id, test_number, test_date, status || 'pending'],
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

        res.status(201).json({ id: testId, test_number, message: 'Test created successfully' });
      }
    );
  });
});

// Update test
router.put('/:id', verifyToken, requireProjectManager, (req, res) => {
  const { id } = req.params;
  const { title, description, test_type, governing_standard, location, client_id, test_date, status, tags } = req.body;

  db.run(
    `UPDATE tests
     SET title = ?, description = ?, test_type = ?, governing_standard = ?, location = ?, client_id = ?, test_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [title, description, test_type, governing_standard, location, client_id, test_date, status, id],
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
router.delete('/:id', verifyToken, requireProjectManager, (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM tests WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Test deleted successfully' });
  });
});

// Add calibration to test
router.post('/:id/calibrations', verifyToken, requireStaffOrAbove, (req, res) => {
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
router.delete('/:id/calibrations/:calibration_id', verifyToken, requireStaffOrAbove, (req, res) => {
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

// Download all calibration sheets for a test as ZIP
router.get('/:id/download-calibration-sheets', verifyToken, (req, res) => {
  const { id } = req.params;

  console.log('[TESTS] Zip download request for test calibration sheets', id);

  db.all(
    `SELECT c.* FROM calibrations c
     JOIN test_calibrations tc ON c.id = tc.calibration_id
     WHERE tc.test_id = ? AND c.is_active = 1 AND c.pdf_path IS NOT NULL`,
    [id],
    (err, calibrations) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!calibrations || calibrations.length === 0) {
        return res.status(404).json({ error: 'No calibration sheets found for this test' });
      }

      // Create zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Set response headers
      res.attachment(`test-${id}-calibration-sheets.zip`);
      res.setHeader('Content-Type', 'application/zip');

      // Pipe archive to response
      archive.pipe(res);

      // Add files to archive
      let filesAdded = 0;
      calibrations.forEach(cal => {
        const filePath = path.join(__dirname, '..', cal.pdf_path);
        if (fs.existsSync(filePath)) {
          // Create a readable filename: Equipment_ID-EquipmentName.pdf
          const fileName = `${cal.equipment_id}-${cal.equipment_name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
          archive.file(filePath, { name: fileName });
          filesAdded++;
        } else {
          console.error('[TESTS] Calibration PDF not found:', filePath);
        }
      });

      console.log('[TESTS] Adding', filesAdded, 'calibration sheets to zip');

      if (filesAdded === 0) {
        archive.abort();
        return res.status(404).json({ error: 'No calibration PDF files found on disk' });
      }

      // Finalize archive
      archive.finalize();

      archive.on('error', (err) => {
        console.error('[TESTS] Archive error:', err);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Error creating archive' });
        }
      });
    }
  );
});

// Tag test as "mine" for current user
router.post('/:id/tag', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.run(
    'INSERT INTO user_test_tags (user_id, test_id) VALUES (?, ?)',
    [user_id, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Test already tagged' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Test tagged successfully' });
    }
  );
});

// Untag test for current user
router.delete('/:id/tag', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.run(
    'DELETE FROM user_test_tags WHERE user_id = ? AND test_id = ?',
    [user_id, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Test untagged successfully' });
    }
  );
});

// Get tests tagged by user (My Tests)
router.get('/user/:user_id/tagged', (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT DISTINCT t.*, c.name as client_name, utt.tagged_at
    FROM tests t
    LEFT JOIN clients c ON t.client_id = c.id
    INNER JOIN user_test_tags utt ON t.id = utt.test_id
    WHERE utt.user_id = ?
    ORDER BY utt.tagged_at DESC
  `;

  db.all(query, [user_id], (err, rows) => {
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

// Join test (add user to test_members)
router.post('/:id/join', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  db.run(
    'INSERT INTO test_members (test_id, user_id) VALUES (?, ?)',
    [id, user_id],
    function (err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint')) {
          return res.status(400).json({ error: 'User already joined this test' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Joined test successfully', id: this.lastID });
    }
  );
});

// Leave test (remove user from test_members)
router.delete('/:id/join', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'user_id is required' });
  }

  db.run(
    'DELETE FROM test_members WHERE test_id = ? AND user_id = ?',
    [id, user_id],
    function (err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'User not found in test members' });
      }
      res.json({ message: 'Left test successfully' });
    }
  );
});

// Get tests joined by a specific user
router.get('/user/:user_id/joined', (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT t.*, c.name as client_name, c.client_number,
           p.project_name, p.project_number
    FROM tests t
    INNER JOIN test_members tm ON t.id = tm.test_id
    LEFT JOIN clients c ON t.client_id = c.id
    LEFT JOIN projects p ON t.project_id = p.id
    WHERE tm.user_id = ?
    ORDER BY tm.joined_at DESC
  `;

  db.all(query, [user_id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get members of a specific test
router.get('/:id/members', (req, res) => {
  const { id } = req.params;

  const query = `
    SELECT u.id, u.username, u.email, u.role, tm.joined_at
    FROM test_members tm
    INNER JOIN users u ON tm.user_id = u.id
    WHERE tm.test_id = ?
    ORDER BY tm.joined_at ASC
  `;

  db.all(query, [id], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ members: rows });
  });
});

module.exports = router;
