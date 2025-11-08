const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Get all equipment types
router.get('/', (req, res) => {
  db.all(
    'SELECT * FROM equipment_types ORDER BY type_name',
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Generate next equipment ID for a type
router.post('/generate-id', (req, res) => {
  const { equipment_type } = req.body;

  if (!equipment_type) {
    return res.status(400).json({ error: 'Equipment type is required' });
  }

  db.get(
    'SELECT * FROM equipment_types WHERE type_code = ?',
    [equipment_type],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!row) {
        return res.status(404).json({ error: 'Equipment type not found' });
      }

      const nextId = `${row.type_code}-${String(row.next_sequence).padStart(2, '0')}`;

      // Increment the sequence
      db.run(
        'UPDATE equipment_types SET next_sequence = next_sequence + 1 WHERE type_code = ?',
        [equipment_type],
        (err) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({ equipment_id: nextId });
        }
      );
    }
  );
});

// Add new equipment type
router.post('/', (req, res) => {
  const { type_code, type_name } = req.body;

  if (!type_code || !type_name) {
    return res.status(400).json({ error: 'Type code and name are required' });
  }

  db.run(
    'INSERT INTO equipment_types (type_code, type_name, next_sequence) VALUES (?, ?, 1)',
    [type_code.toUpperCase(), type_name],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(400).json({ error: 'Equipment type code already exists' });
        }
        return res.status(500).json({ error: err.message });
      }

      res.status(201).json({
        id: this.lastID,
        message: 'Equipment type created successfully'
      });
    }
  );
});

module.exports = router;
