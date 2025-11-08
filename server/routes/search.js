const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Global search across tests, calibrations, clients, and projects
router.get('/', (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.json({ tests: [], calibrations: [], clients: [], projects: [] });
  }

  const searchTerm = `%${q}%`;

  // Search tests (top 5)
  db.all(
    `SELECT t.*, c.name as client_name
     FROM tests t
     LEFT JOIN clients c ON t.client_id = c.id
     WHERE t.title LIKE ? OR t.description LIKE ? OR t.test_type LIKE ? OR t.governing_standard LIKE ?
     ORDER BY t.created_at DESC
     LIMIT 5`,
    [searchTerm, searchTerm, searchTerm, searchTerm],
    (err, tests) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Search calibrations (top 5)
      db.all(
        `SELECT * FROM calibrations
         WHERE equipment_name LIKE ? OR equipment_id LIKE ? OR equipment_type LIKE ?
         ORDER BY created_at DESC
         LIMIT 5`,
        [searchTerm, searchTerm, searchTerm],
        (err, calibrations) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Search clients (top 5)
          db.all(
            `SELECT * FROM clients
             WHERE name LIKE ? OR client_number LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ?
             ORDER BY created_at DESC
             LIMIT 5`,
            [searchTerm, searchTerm, searchTerm, searchTerm],
            (err, clients) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Search projects (top 5)
              db.all(
                `SELECT p.*, c.name as client_name, c.client_number
                 FROM projects p
                 LEFT JOIN clients c ON p.client_id = c.id
                 WHERE p.project_name LIKE ? OR p.project_number LIKE ? OR p.description LIKE ?
                 ORDER BY p.created_at DESC
                 LIMIT 5`,
                [searchTerm, searchTerm, searchTerm],
                (err, projects) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  res.json({
                    tests: tests,
                    calibrations: calibrations,
                    clients: clients,
                    projects: projects
                  });
                }
              );
            }
          );
        }
      );
    }
  );
});

module.exports = router;
