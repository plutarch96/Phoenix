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

  // Search tests including tags (top 10 for preview, unlimited for full search)
  db.all(
    `SELECT DISTINCT t.*, c.name as client_name
     FROM tests t
     LEFT JOIN clients c ON t.client_id = c.id
     LEFT JOIN test_tags tt ON t.id = tt.test_id
     WHERE t.title LIKE ? OR t.description LIKE ? OR t.test_type LIKE ?
           OR t.governing_standard LIKE ? OR tt.tag LIKE ? OR t.location LIKE ?
     ORDER BY t.created_at DESC
     LIMIT 10`,
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm],
    (err, tests) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get tags for each test
      const testIds = tests.map(t => t.id);
      if (testIds.length > 0) {
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
            tests.forEach(test => {
              test.tags = tagsByTest[test.id] || [];
            });

            continueSearch();
          }
        );
      } else {
        continueSearch();
      }

      function continueSearch() {
        // Search calibrations (top 10)
        db.all(
          `SELECT * FROM calibrations
           WHERE equipment_name LIKE ? OR equipment_id LIKE ? OR equipment_type LIKE ? OR notes LIKE ?
           ORDER BY created_at DESC
           LIMIT 10`,
          [searchTerm, searchTerm, searchTerm, searchTerm],
          (err, calibrations) => {
            if (err) {
              return res.status(500).json({ error: err.message });
            }

            // Search clients (top 10)
            db.all(
              `SELECT * FROM clients
               WHERE name LIKE ? OR client_number LIKE ? OR contact_email LIKE ? OR contact_phone LIKE ?
               ORDER BY created_at DESC
               LIMIT 10`,
              [searchTerm, searchTerm, searchTerm, searchTerm],
              (err, clients) => {
                if (err) {
                  return res.status(500).json({ error: err.message });
                }

                // Search projects (top 10)
                db.all(
                  `SELECT p.*, c.name as client_name, c.client_number
                   FROM projects p
                   LEFT JOIN clients c ON p.client_id = c.id
                   WHERE p.project_name LIKE ? OR p.project_number LIKE ? OR p.description LIKE ?
                   ORDER BY p.created_at DESC
                   LIMIT 10`,
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
    }
  );
});

// Media search - search tests by metadata and return all images/videos from matching tests
router.get('/media', (req, res) => {
  const { q } = req.query;

  if (!q || q.trim() === '') {
    return res.json({ media: [], matchingTests: [] });
  }

  const searchTerm = `%${q}%`;

  // Find tests matching the search criteria
  db.all(
    `SELECT DISTINCT t.id, t.title, t.test_type, t.governing_standard, c.name as client_name
     FROM tests t
     LEFT JOIN clients c ON t.client_id = c.id
     LEFT JOIN test_tags tt ON t.id = tt.test_id
     WHERE t.test_type LIKE ? OR t.governing_standard LIKE ? OR tt.tag LIKE ?
           OR t.title LIKE ? OR t.description LIKE ? OR t.location LIKE ?
     ORDER BY t.created_at DESC`,
    [searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm],
    (err, tests) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (tests.length === 0) {
        return res.json({ media: [], matchingTests: [] });
      }

      // Get all media (images and videos) from matching tests
      const testIds = tests.map(t => t.id);
      const placeholders = testIds.map(() => '?').join(',');

      db.all(
        `SELECT tm.*, t.title as test_title, t.test_type, t.governing_standard, c.name as client_name
         FROM test_media tm
         LEFT JOIN tests t ON tm.test_id = t.id
         LEFT JOIN clients c ON t.client_id = c.id
         WHERE tm.test_id IN (${placeholders})
           AND (tm.media_type = 'image' OR tm.media_type = 'video')
         ORDER BY tm.uploaded_at DESC`,
        testIds,
        (err, media) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get tags for each test
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
              tests.forEach(test => {
                test.tags = tagsByTest[test.id] || [];
              });

              res.json({
                media: media,
                matchingTests: tests,
                totalTests: tests.length,
                totalMedia: media.length
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
