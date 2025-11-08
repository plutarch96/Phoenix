const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for report uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/reports');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'report-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (req, file, cb) => {
    const allowedTypes = /pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase().slice(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOC, and DOCX files are allowed'));
    }
  }
});

// Get all reports for a test
router.get('/test/:test_id', (req, res) => {
  const { test_id } = req.params;

  db.all(
    'SELECT * FROM test_reports WHERE test_id = ? ORDER BY uploaded_at DESC',
    [test_id],
    (err, reports) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(reports);
    }
  );
});

// Get latest report for a test
router.get('/test/:test_id/latest', (req, res) => {
  const { test_id } = req.params;

  db.get(
    'SELECT * FROM test_reports WHERE test_id = ? ORDER BY version DESC, uploaded_at DESC LIMIT 1',
    [test_id],
    (err, report) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(report || null);
    }
  );
});

// Upload a new report
router.post('/upload', upload.single('report'), (req, res) => {
  const { test_id, status, notes, user_id, user_name } = req.body;

  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  if (!test_id || !user_id) {
    return res.status(400).json({ error: 'test_id and user_id are required' });
  }

  const filePath = `/uploads/reports/${req.file.filename}`;

  // Get current version number
  db.get(
    'SELECT MAX(version) as max_version FROM test_reports WHERE test_id = ?',
    [test_id],
    (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const newVersion = (row.max_version || 0) + 1;

      db.run(
        `INSERT INTO test_reports (test_id, file_name, file_path, file_size, status, uploaded_by, uploaded_by_name, version, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          test_id,
          req.file.originalname,
          filePath,
          req.file.size,
          status || 'draft',
          user_id,
          user_name,
          newVersion,
          notes || null
        ],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          res.status(201).json({
            id: this.lastID,
            message: 'Report uploaded successfully',
            version: newVersion
          });
        }
      );
    }
  );
});

// Update report status
router.put('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['draft', 'final'].includes(status)) {
    return res.status(400).json({ error: 'Status must be "draft" or "final"' });
  }

  db.run(
    'UPDATE test_reports SET status = ? WHERE id = ?',
    [status, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Report status updated successfully' });
    }
  );
});

// Download report
router.get('/download/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM test_reports WHERE id = ?', [id], (err, report) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const filePath = path.join(__dirname, '..', report.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    res.download(filePath, report.file_name);
  });
});

// Delete report
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM test_reports WHERE id = ?', [id], (err, report) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', report.file_path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete from database
    db.run('DELETE FROM test_reports WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Report deleted successfully' });
    });
  });
});

module.exports = router;
