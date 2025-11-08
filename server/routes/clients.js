const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all clients
router.get('/', (req, res) => {
  db.all('SELECT * FROM clients ORDER BY name', (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

// Get single client with their tests
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM clients WHERE id = ?', [id], (err, client) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    // Get all tests for this client
    db.all(
      'SELECT * FROM tests WHERE client_id = ? ORDER BY created_at DESC',
      [id],
      (err, tests) => {
        if (err) {
          return res.status(500).json({ error: err.message });
        }

        res.json({
          ...client,
          tests: tests
        });
      }
    );
  });
});

// Create new client
router.post('/', (req, res) => {
  const { name, contact_email, contact_phone } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  db.run(
    'INSERT INTO clients (name, contact_email, contact_phone) VALUES (?, ?, ?)',
    [name, contact_email, contact_phone],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, message: 'Client created successfully' });
    }
  );
});

// Update client
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, contact_email, contact_phone } = req.body;

  db.run(
    'UPDATE clients SET name = ?, contact_email = ?, contact_phone = ? WHERE id = ?',
    [name, contact_email, contact_phone, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Client updated successfully' });
    }
  );
});

// Delete client
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM clients WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Client deleted successfully' });
  });
});

module.exports = router;
