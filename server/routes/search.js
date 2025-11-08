const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Global search across tests and calibrations
router.get('/', (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.json({ tests: [], calibrations: [] });
  }

  const searchTerm = `%${q}%`;

  // Search tests
  db.all(
    `SELECT t.*, c.name as client_name
     FROM tests t
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.title LIKE ? OR t.description LIKE ? OR t.test_type LIKE ? OR t.governing_standard LIKE ?
     ORDER BY t.created_at DESC
     LIMIT 10`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, tests) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Search calibrations
      db.all(
        `SELECT * FROM calibrations
         WHERE equipment_name LIKE ? OR equipment_id LIKE ? OR equipment_type LIKE ?
         ORDER BY created_at DESC
         LIMIT 10`,
        [searchTerm, searchTerm, searchTerm],
        (err, calibrations) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.json({
            tests: tests,
            calibrations: calibrations
          });
        }
      );
    }
  );
});

module.exports = router;
