const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyToken, requireFRAEmployee, requireAdmin } = require('../middleware/auth');

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
    const baseName = path.basename(file.originalname, ext);
    cb(null, baseName + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 }, // 100MB max for reports
  fileFilter: (req, file, cb) => {
    // Only allow PDF, DOCX, and DOC files
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.pdf', '.docx', '.doc'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, and DOC files are allowed for reports'));
    }
  }
});

// Get all reports for a test
router.get('/test/:test_id', verifyToken, (req, res) => {
  const { test_id } = req.params;

  db.all(
    `SELECT r.*, u.username as uploaded_by_name
     FROM test_reports r
     LEFT JOIN users u ON r.uploaded_by = u.id
     WHERE r.test_id = ?
     ORDER BY r.uploaded_at DESC`,
    [test_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Upload report
router.post('/upload', verifyToken, requireFRAEmployee, upload.single('file'), (req, res) => {
  const { test_id, report_type, uploaded_by, notes } = req.body;

  console.log('[REPORTS] Upload request:', { test_id, report_type, uploaded_by });

  if (!test_id || !req.file) {
    return res.status(400).json({ error: 'Test ID and file are required' });
  }

  if (!uploaded_by) {
    return res.status(400).json({ error: 'Uploaded by user ID is required' });
  }

  if (!report_type || !['draft', 'final'].includes(report_type)) {
    return res.status(400).json({ error: 'Report type must be "draft" or "final"' });
  }

  const filePath = `/uploads/reports/${req.file.filename}`;

  db.run(
    `INSERT INTO test_reports (test_id, report_type, file_name, file_path, file_size, uploaded_by, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [test_id, report_type, req.file.originalname, filePath, req.file.size, uploaded_by, notes || null],
    function(err) {
      if (err) {
        console.error('[REPORTS] Error inserting report:', err);
        return res.status(500).json({ error: err.message });
      }

      console.log('[REPORTS] Report uploaded:', req.file.originalname, 'type:', report_type);

      res.status(201).json({
        id: this.lastID,
        message: 'Report uploaded successfully',
        report: {
          id: this.lastID,
          file_name: req.file.originalname,
          file_path: filePath,
          report_type: report_type
        }
      });
    }
  );
});

// Download report
router.get('/download/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.get(
    `SELECT r.*, u.username as uploaded_by_name
     FROM test_reports r
     LEFT JOIN users u ON r.uploaded_by = u.id
     WHERE r.id = ?`,
    [id],
    (err, report) => {
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

      console.log('[REPORTS] Downloading report:', report.file_name);
      res.download(filePath, report.file_name);
    }
  );
});

// Update report type or notes
router.put('/:id', verifyToken, requireFRAEmployee, (req, res) => {
  const { id } = req.params;
  const { report_type, notes } = req.body;

  const updates = [];
  const params = [];

  if (report_type !== undefined) {
    if (!['draft', 'final'].includes(report_type)) {
      return res.status(400).json({ error: 'Report type must be "draft" or "final"' });
    }
    updates.push('report_type = ?');
    params.push(report_type);
  }

  if (notes !== undefined) {
    updates.push('notes = ?');
    params.push(notes);
  }

  if (updates.length === 0) {
    return res.status(400).json({ error: 'No updates provided' });
  }

  params.push(id);

  db.run(
    `UPDATE test_reports SET ${updates.join(', ')} WHERE id = ?`,
    params,
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Report updated successfully' });
    }
  );
});

// Delete report
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
  const { id } = req.params;

  // Get the file path first to delete the file
  db.get('SELECT file_path FROM test_reports WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row && row.file_path) {
      const filePath = path.join(__dirname, '..', row.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log('[REPORTS] Deleted file:', filePath);
      }
    }

    db.run('DELETE FROM test_reports WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      console.log('[REPORTS] Report deleted successfully');
      res.json({ message: 'Report deleted successfully' });
    });
  });
});

module.exports = router;
