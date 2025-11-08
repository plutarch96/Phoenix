const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/calibrations');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'cal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Get all calibrations (active only by default)
router.get('/', (req, res) => {
  const { status, equipment_id, include_history } = req.query;

  let query = 'SELECT * FROM calibrations';
  const conditions = [];
  const params = [];

  // Only show active calibrations by default unless include_history is set
  if (include_history !== 'true') {
    conditions.push('(is_active = 1 OR is_active IS NULL)');
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (equipment_id) {
    conditions.push('equipment_id = ?');
    params.push(equipment_id);
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY expiration_date ASC, created_at DESC';

  db.all(query, params, (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    // Update status based on expiration date
    const today = new Date().toISOString().split('T')[0];
    const updatedRows = rows.map(row => ({
      ...row,
      status: new Date(row.expiration_date) < new Date(today) ? 'expired' : 'valid'
    }));

    res.json(updatedRows);
  });
});

// Get single calibration
router.get('/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM calibrations WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!row) {
      return res.status(404).json({ error: 'Calibration not found' });
    }

    // Check if expired
    const today = new Date().toISOString().split('T')[0];
    row.status = new Date(row.expiration_date) < new Date(today) ? 'expired' : 'valid';

    res.json(row);
  });
});

// Get calibration history for specific equipment
router.get('/history/:equipment_id', (req, res) => {
  const { equipment_id } = req.params;

  db.all(
    `SELECT * FROM calibrations
     WHERE equipment_id = ?
     ORDER BY calibration_date DESC`,
    [equipment_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Update status based on expiration date
      const today = new Date().toISOString().split('T')[0];
      const updatedRows = rows.map(row => ({
        ...row,
        status: new Date(row.expiration_date) < new Date(today) ? 'expired' : 'valid'
      }));

      res.json(updatedRows);
    }
  );
});

// Create new calibration with PDF upload (with history logging)
router.post('/', upload.single('pdf'), (req, res) => {
  const {
    equipment_name,
    equipment_type,
    equipment_id,
    serial_number,
    calibration_date,
    expiration_date,
    calibrated_by,
    notes
  } = req.body;

  if (!equipment_name || !equipment_type || !equipment_id || !calibration_date || !expiration_date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const pdfPath = req.file ? `/uploads/calibrations/${req.file.filename}` : null;

  // Check expiration status
  const today = new Date().toISOString().split('T')[0];
  const status = new Date(expiration_date) < new Date(today) ? 'expired' : 'valid';

  // First, check if there's an active calibration with this equipment_id
  db.get(
    'SELECT id FROM calibrations WHERE equipment_id = ? AND (is_active = 1 OR is_active IS NULL)',
    [equipment_id],
    (err, existingCalibration) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Insert the new calibration
      db.run(
        `INSERT INTO calibrations (equipment_name, equipment_type, equipment_id, serial_number, calibration_date, expiration_date, calibrated_by, pdf_path, status, notes, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [equipment_name, equipment_type, equipment_id, serial_number, calibration_date, expiration_date, calibrated_by, pdfPath, status, notes],
        function(err) {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          const newCalibrationId = this.lastID;

          // If there was an existing active calibration, mark it as inactive
          if (existingCalibration) {
            db.run(
              'UPDATE calibrations SET is_active = 0, superseded_by = ? WHERE id = ?',
              [newCalibrationId, existingCalibration.id],
              (err) => {
                if (err) {
                  console.error('Error updating old calibration:', err);
                }
              }
            );
          }

          res.status(201).json({
            id: newCalibrationId,
            message: existingCalibration ? 'Calibration updated with history logging' : 'Calibration created successfully'
          });
        }
      );
    }
  );
});

// Update calibration (creates new record with history logging)
router.put('/:id', upload.single('pdf'), (req, res) => {
  const { id } = req.params;
  const {
    equipment_name,
    equipment_type,
    equipment_id,
    serial_number,
    calibration_date,
    expiration_date,
    calibrated_by,
    notes
  } = req.body;

  let pdfPath = req.body.pdf_path; // Keep existing if no new file
  if (req.file) {
    pdfPath = `/uploads/calibrations/${req.file.filename}`;
  }

  // Check expiration status
  const today = new Date().toISOString().split('T')[0];
  const status = new Date(expiration_date) < new Date(today) ? 'expired' : 'valid';

  // Create new calibration record
  db.run(
    `INSERT INTO calibrations (equipment_name, equipment_type, equipment_id, serial_number, calibration_date, expiration_date, calibrated_by, pdf_path, status, notes, is_active)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    [equipment_name, equipment_type, equipment_id, serial_number, calibration_date, expiration_date, calibrated_by, pdfPath, status, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      const newCalibrationId = this.lastID;

      // Mark the old calibration as inactive
      db.run(
        'UPDATE calibrations SET is_active = 0, superseded_by = ? WHERE id = ?',
        [newCalibrationId, id],
        (err) => {
          if (err) {
            console.error('Error updating old calibration:', err);
          }
        }
      );

      res.json({ id: newCalibrationId, message: 'Calibration updated with history logging' });
    }
  );
});

// Delete calibration
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Get the PDF path first to delete the file
  db.get('SELECT pdf_path FROM calibrations WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row && row.pdf_path) {
      const filePath = path.join(__dirname, '..', row.pdf_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.run('DELETE FROM calibrations WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Calibration deleted successfully' });
    });
  });
});

// Search calibrations by equipment name
router.get('/search/:query', (req, res) => {
  const { query } = req.params;

  db.all(
    `SELECT * FROM calibrations
     WHERE equipment_name LIKE ? OR equipment_id LIKE ?
     ORDER BY equipment_name`,
    [`%${query}%`, `%${query}%`],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

module.exports = router;
