const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/tests');
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
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB limit for videos
});

// Get all media for a test
router.get('/test/:test_id', (req, res) => {
  const { test_id } = req.params;

  db.all(
    'SELECT * FROM test_media WHERE test_id = ? ORDER BY uploaded_at DESC',
    [test_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Get media by type
router.get('/test/:test_id/type/:media_type', (req, res) => {
  const { test_id, media_type } = req.params;

  db.all(
    'SELECT * FROM test_media WHERE test_id = ? AND media_type = ? ORDER BY uploaded_at DESC',
    [test_id, media_type],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Upload media file(s)
router.post('/upload', upload.array('files', 10), (req, res) => {
  const { test_id, media_type, description } = req.body;

  if (!test_id || !req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Test ID and files are required' });
  }

  const stmt = db.prepare(
    `INSERT INTO test_media (test_id, media_type, file_name, file_path, file_size, description)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  const uploadedFiles = [];

  req.files.forEach(file => {
    const filePath = `/uploads/tests/${file.filename}`;

    // Determine media type from file extension if not provided
    let type = media_type;
    if (!type) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
        type = 'image';
      } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
        type = 'video';
      } else {
        type = 'datafile';
      }
    }

    stmt.run(
      test_id,
      type,
      file.originalname,
      filePath,
      file.size,
      description || null,
      function(err) {
        if (err) {
          console.error('Error inserting media:', err);
        } else {
          uploadedFiles.push({
            id: this.lastID,
            file_name: file.originalname,
            file_path: filePath,
            media_type: type
          });
        }
      }
    );
  });

  stmt.finalize((err) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.status(201).json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  });
});

// Update media description
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { description } = req.body;

  db.run(
    'UPDATE test_media SET description = ? WHERE id = ?',
    [description, id],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Media updated successfully' });
    }
  );
});

// Delete media
router.delete('/:id', (req, res) => {
  const { id } = req.params;

  // Get the file path first to delete the file
  db.get('SELECT file_path FROM test_media WHERE id = ?', [id], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (row && row.file_path) {
      const filePath = path.join(__dirname, '..', row.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    db.run('DELETE FROM test_media WHERE id = ?', [id], function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ message: 'Media deleted successfully' });
    });
  });
});

module.exports = router;
