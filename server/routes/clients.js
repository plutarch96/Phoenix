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
  const { name, client_number, contact_email, contact_phone, address, city, state, zip_code } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!client_number) {
    return res.status(400).json({ error: 'Client number is required' });
  }

  db.run(
    `INSERT INTO clients (name, client_number, contact_email, contact_phone, address, city, state, zip_code)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [name, client_number, contact_email, contact_phone, address, city, state, zip_code],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Client number already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({ id: this.lastID, message: 'Client created successfully' });
    }
  );
});

// Update client
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { name, client_number, contact_email, contact_phone, address, city, state, zip_code } = req.body;

  db.run(
    `UPDATE clients SET name = ?, client_number = ?, contact_email = ?, contact_phone = ?,
     address = ?, city = ?, state = ?, zip_code = ? WHERE id = ?`,
    [name, client_number, contact_email, contact_phone, address, city, state, zip_code, id],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Client number already exists' });
        }
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
