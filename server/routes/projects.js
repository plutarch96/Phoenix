const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { verifyToken } = require('../middleware/auth');
const { requireProjectManager, requireStaffOrAbove } = require('../middleware/roleChecks');

// Get all projects (optionally filtered by client)
router.get('/', (req, res) => {
  const { client_id, include_tests } = req.query;
  console.log('[PROJECTS] Getting projects, client_id filter:', client_id, 'include_tests:', include_tests);

  let query = `
    SELECT p.*, c.name as client_name, c.client_number,
           COUNT(DISTINCT t.id) as test_count
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN tests t ON p.id = t.project_id
  `;

  const params = [];
  if (client_id) {
    query += ' WHERE p.client_id = ?';
    params.push(client_id);
  }

  query += ' GROUP BY p.id ORDER BY p.created_at DESC';

  db.all(query, params, (err, projects) => {
    if (err) {
      console.log('[PROJECTS] Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }

    // If include_tests is requested, fetch tests for each project
    if (include_tests === 'true' && projects.length > 0) {
      let completed = 0;

      projects.forEach((project, index) => {
        db.all(
          'SELECT * FROM tests WHERE project_id = ? ORDER BY test_number',
          [project.id],
          (err, tests) => {
            if (err) {
              console.error('[PROJECTS] Error loading tests for project', project.id, err);
              projects[index].tests = [];
            } else {
              projects[index].tests = tests;
            }

            completed++;
            if (completed === projects.length) {
              console.log(`[PROJECTS] Returning ${projects.length} projects with tests`);
              res.json(projects);
            }
          }
        );
      });
    } else {
      console.log(`[PROJECTS] Returning ${projects.length} projects`);
      res.json(projects);
    }
  });
});

// Get single project with details
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT p.*, c.name as client_name, c.client_number
     FROM projects p
     LEFT JOIN clients c ON p.client_id = c.id
     WHERE p.id = ?`,
    [id],
    (err, project) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!project) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Get tests for this project
      db.all(
        `SELECT * FROM tests WHERE project_id = ? ORDER BY test_number`,
        [id],
        (err, tests) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }
          project.tests = tests;
          res.json(project);
        }
      );
    }
  );
});

// Create new project
router.post('/', verifyToken, requireProjectManager, (req, res) => {
  console.log('[PROJECTS] Creating new project:', req.body);
  const { client_id, project_number, project_name, description, status } = req.body;

  if (!client_id || !project_number || !project_name) {
    console.log('[PROJECTS] Validation error: Missing required fields');
    return res.status(400).json({ error: 'client_id, project_number, and project_name are required' });
  }

  db.run(
    `INSERT INTO projects (client_id, project_number, project_name, description, status)
     VALUES (?, ?, ?, ?, ?)`,
    [client_id, project_number, project_name, description, status || 'active'],
    function(err) {
      if (err) {
        console.log('[PROJECTS] Database error:', err.message);
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Project number already exists for this client' });
        }
        return res.status(500).json({ error: err.message });
      }

      console.log('[PROJECTS] Project created successfully with ID:', this.lastID);
      res.status(201).json({
        id: this.lastID,
        message: 'Project created successfully',
        project_id: this.lastID
      });
    }
  );
});

// Update project
router.put('/:id', verifyToken, requireProjectManager, (req, res) => {
  const { id } = req.params;
  const { project_number, project_name, description, status } = req.body;

  db.run(
    `UPDATE projects
     SET project_number = ?, project_name = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [project_number, project_name, description, status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ message: 'Project updated successfully' });
    }
  );
});

// Delete project
router.delete('/:id', verifyToken, requireProjectManager, (req, res) => {
  const { id } = req.params;

  // Check if project has tests
  db.get('SELECT COUNT(*) as count FROM tests WHERE project_id = ?', [id], (err, result) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (result.count > 0) {
      return res.status(400).json({
        error: `Cannot delete project with ${result.count} test(s). Please delete or reassign the tests first.`
      });
    }

    db.run('DELETE FROM projects WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }
      res.json({ message: 'Project deleted successfully' });
    });
  });
});

// Get next available test number for a project
router.get('/:id/next-test-number', (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT MAX(CAST(test_number AS INTEGER)) as max_number
     FROM tests
     WHERE project_id = ? AND test_number IS NOT NULL`,
    [id],
    (err, result) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const nextNumber = (result.max_number || 0) + 1;
      const formattedNumber = String(nextNumber).padStart(3, '0'); // 001, 002, 003...

      res.json({
        next_number: nextNumber,
        formatted_number: formattedNumber
      });
    }
  );
});

// Tag project as "mine" for current user
// When tagging a project, also tag all its tests
router.post('/:id/tag', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Start a transaction-like process
  db.serialize(() => {
    // Tag the project
    db.run(
      'INSERT INTO user_project_tags (user_id, project_id) VALUES (?, ?)',
      [user_id, id],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(400).json({ error: 'Project already tagged' });
          }
          return res.status(500).json({ error: err.message });
        }

        // Tag all tests in this project
        db.run(
          `INSERT INTO user_test_tags (user_id, test_id)
           SELECT ?, id FROM tests WHERE project_id = ?
           AND NOT EXISTS (
             SELECT 1 FROM user_test_tags
             WHERE user_id = ? AND test_id = tests.id
           )`,
          [user_id, id, user_id],
          function(tagErr) {
            if (tagErr) {
              console.error('Error tagging tests for project:', tagErr);
            }
            res.status(201).json({
              message: 'Project and associated tests tagged successfully',
              tests_tagged: this.changes
            });
          }
        );
      }
    );
  });
});

// Untag project for current user
// When untagging a project, also untag all its tests
router.delete('/:id/tag', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.serialize(() => {
    // Untag the project
    db.run(
      'DELETE FROM user_project_tags WHERE user_id = ? AND project_id = ?',
      [user_id, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        // Untag all tests in this project
        db.run(
          `DELETE FROM user_test_tags
           WHERE user_id = ? AND test_id IN (
             SELECT id FROM tests WHERE project_id = ?
           )`,
          [user_id, id],
          function(untagErr) {
            if (untagErr) {
              console.error('Error untagging tests for project:', untagErr);
            }
            res.json({
              message: 'Project and associated tests untagged successfully',
              tests_untagged: this.changes
            });
          }
        );
      }
    );
  });
});

// Get projects tagged by user (My Projects)
router.get('/user/:user_id/tagged', (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT DISTINCT p.*, c.name as client_name, c.client_number,
           COUNT(DISTINCT t.id) as test_count,
           upt.tagged_at
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN tests t ON p.id = t.project_id
    INNER JOIN user_project_tags upt ON p.id = upt.project_id
    WHERE upt.user_id = ?
    GROUP BY p.id
    ORDER BY upt.tagged_at DESC
  `;

  db.all(query, [user_id], (err, projects) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(projects);
  });
});

// Claim project (Project Manager only - exclusive)
router.post('/:id/claim', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // First check if already claimed
  db.get('SELECT claimed_by FROM projects WHERE id = ?', [id], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.claimed_by && project.claimed_by != user_id) {
      return res.status(400).json({ error: 'Project already claimed by another project manager' });
    }

    // Claim the project
    db.run(
      'UPDATE projects SET claimed_by = ? WHERE id = ?',
      [user_id, id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.status(200).json({ message: 'Project claimed successfully' });
      }
    );
  });
});

// Unclaim project (Project Manager only)
router.delete('/:id/claim', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  // Verify user is the one who claimed it
  db.get('SELECT claimed_by FROM projects WHERE id = ?', [id], (err, project) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    if (project.claimed_by != user_id) {
      return res.status(403).json({ error: 'You can only unclaim projects you claimed' });
    }

    db.run(
      'UPDATE projects SET claimed_by = NULL WHERE id = ?',
      [id],
      function(err) {
        if (err) {
          return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Project unclaimed successfully' });
      }
    );
  });
});

// Join project (Staff - multiple allowed)
router.post('/:id/join', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.run(
    'INSERT INTO project_members (project_id, user_id) VALUES (?, ?)',
    [id, user_id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Already joined this project' });
        }
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ message: 'Joined project successfully' });
    }
  );
});

// Leave project (Staff)
router.delete('/:id/join', (req, res) => {
  const { id } = req.params;
  const { user_id } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  db.run(
    'DELETE FROM project_members WHERE project_id = ? AND user_id = ?',
    [id, user_id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Left project successfully' });
    }
  );
});

// Get projects claimed by user (Project Manager)
router.get('/user/:user_id/claimed', (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT p.*, c.name as client_name, c.client_number,
           COUNT(DISTINCT t.id) as test_count
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN tests t ON p.id = t.project_id
    WHERE p.claimed_by = ?
    GROUP BY p.id
    ORDER BY p.created_at DESC
  `;

  db.all(query, [user_id], (err, projects) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(projects);
  });
});

// Get projects joined by user (Staff)
router.get('/user/:user_id/joined', (req, res) => {
  const { user_id } = req.params;

  const query = `
    SELECT DISTINCT p.*, c.name as client_name, c.client_number,
           COUNT(DISTINCT t.id) as test_count,
           pm.joined_at
    FROM projects p
    LEFT JOIN clients c ON p.client_id = c.id
    LEFT JOIN tests t ON p.id = t.project_id
    INNER JOIN project_members pm ON p.id = pm.project_id
    WHERE pm.user_id = ?
    GROUP BY p.id
    ORDER BY pm.joined_at DESC
  `;

  db.all(query, [user_id], (err, projects) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(projects);
  });
});

// Get project members and claimant
router.get('/:id/members', (req, res) => {
  const { id } = req.params;

  // Get claimed by user
  db.get(
    `SELECT u.id, u.username, u.email, u.role
     FROM users u
     INNER JOIN projects p ON u.id = p.claimed_by
     WHERE p.id = ?`,
    [id],
    (err, claimedBy) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get all members
      db.all(
        `SELECT u.id, u.username, u.email, u.role, pm.joined_at
         FROM users u
         INNER JOIN project_members pm ON u.id = pm.user_id
         WHERE pm.project_id = ?
         ORDER BY pm.joined_at ASC`,
        [id],
        (err, members) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            claimed_by: claimedBy || null,
            members: members || []
          });
        }
      );
    }
  );
});

module.exports = router;
