const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all projects (optionally filtered by client)
router.get('/', (req, res) => {
  const { client_id } = req.query;
  console.log('[PROJECTS] Getting projects, client_id filter:', client_id);

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

  db.all(query, params, (err, rows) => {
    if (err) {
      console.log('[PROJECTS] Database error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log(`[PROJECTS] Returning ${rows.length} projects`);
    res.json(rows);
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
router.post('/', (req, res) => {
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
router.put('/:id', (req, res) => {
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
router.delete('/:id', (req, res) => {
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

module.exports = router;
