const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { verifyToken, requireAdmin, requireFRAEmployee } = require('../middleware/auth');

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
  limits: { fileSize: 10 * 1024 * 1024 * 1024 } // 10GB max (for videos)
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

// File type validation per category
const validateFileType = (filename, category) => {
  const ext = path.extname(filename).toLowerCase();

  const allowedTypes = {
    test_data: ['.csv', '.xlsx', '.xls', '.json', '.txt', '.dat'],
    media: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.mp4', '.avi', '.mov', '.mkv', '.webm'],
    calibration: ['.pdf'],
    other: ['.pdf', '.doc', '.docx', '.txt', '.jpg', '.jpeg', '.png']
  };

  return allowedTypes[category]?.includes(ext) || false;
};

// File size limits based on type
const getFileSizeLimit = (filename, category) => {
  const ext = path.extname(filename).toLowerCase();

  // Different limits based on file type
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp'].includes(ext.substring(1))) {
    return 200 * 1024 * 1024; // 200MB for images
  } else if (['mp4', 'avi', 'mov', 'mkv', 'webm'].includes(ext.substring(1))) {
    return 10 * 1024 * 1024 * 1024; // 10GB for videos
  } else if (ext === '.pdf') {
    return 1 * 1024 * 1024 * 1024; // 1GB for PDFs
  } else if (category === 'test_data') {
    return 1 * 1024 * 1024 * 1024; // 1GB for test data
  }

  return 1 * 1024 * 1024 * 1024; // 1GB default
};

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

// Upload media file(s)
router.post('/upload', verifyToken, requireFRAEmployee, upload.array('files', 10), (req, res) => {
  const { test_id, category, description } = req.body;

  console.log('[MEDIA] Upload request:', { test_id, category, files: req.files?.length });

  if (!test_id || !req.files || req.files.length === 0) {
    return res.status(400).json({ error: 'Test ID and files are required' });
  }

  if (!category) {
    return res.status(400).json({ error: 'Category is required (test_data, media, calibration, other)' });
  }

  // Validate file types
  const invalidFiles = req.files.filter(file => !validateFileType(file.originalname, category));
  if (invalidFiles.length > 0) {
    return res.status(400).json({
      error: `Invalid file types for category '${category}': ${invalidFiles.map(f => f.originalname).join(', ')}`
    });
  }

  // Validate file sizes
  const oversizedFiles = [];
  req.files.forEach(file => {
    const limit = getFileSizeLimit(file.originalname, category);
    if (file.size > limit) {
      oversizedFiles.push(`${file.originalname} (${formatFileSize(file.size)} exceeds ${formatFileSize(limit)})`);
    }
  });

  if (oversizedFiles.length > 0) {
    return res.status(400).json({
      error: 'The following files exceed the size limit:\n\n' + oversizedFiles.join('\n')
    });
  }

  const stmt = db.prepare(
    `INSERT INTO test_media (test_id, media_type, category, file_name, file_path, file_size, description)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  );

  const uploadedFiles = [];

  req.files.forEach(file => {
    const filePath = `/uploads/tests/${file.filename}`;

    // Determine media_type from file extension
    const ext = path.extname(file.originalname).toLowerCase();
    let mediaType = 'document';
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp'].includes(ext)) {
      mediaType = 'image';
    } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
      mediaType = 'video';
    } else if (ext === '.pdf') {
      mediaType = 'pdf';
    }

    stmt.run(
      test_id,
      mediaType,
      category,
      file.originalname,
      filePath,
      file.size,
      description || null,
      function(err) {
        if (err) {
          console.error('[MEDIA] Error inserting media:', err);
        } else {
          uploadedFiles.push({
            id: this.lastID,
            file_name: file.originalname,
            file_path: filePath,
            media_type: mediaType,
            category: category
          });
          console.log('[MEDIA] File uploaded:', file.originalname, 'category:', category);
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
router.put('/:id', verifyToken, requireFRAEmployee, (req, res) => {
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

// Download individual file
router.get('/download/:id', (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM test_media WHERE id = ?', [id], (err, media) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }

    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const filePath = path.join(__dirname, '..', media.file_path);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found on server' });
    }

    console.log('[MEDIA] Downloading file:', media.file_name);
    res.download(filePath, media.file_name);
  });
});

// Download all files from a category as ZIP
router.get('/test/:test_id/download-category/:category', (req, res) => {
  const { test_id, category } = req.params;

  console.log('[MEDIA] Zip download request for test', test_id, 'category:', category);

  db.all(
    'SELECT * FROM test_media WHERE test_id = ? AND category = ?',
    [test_id, category],
    (err, files) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (!files || files.length === 0) {
        return res.status(404).json({ error: 'No files found for this category' });
      }

      // Create zip archive
      const archive = archiver('zip', {
        zlib: { level: 9 } // Maximum compression
      });

      // Set response headers
      res.attachment(`test-${test_id}-${category}.zip`);
      res.setHeader('Content-Type', 'application/zip');

      // Pipe archive to response
      archive.pipe(res);

      // Add files to archive
      let filesAdded = 0;
      files.forEach(file => {
        const filePath = path.join(__dirname, '..', file.file_path);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: file.file_name });
          filesAdded++;
        } else {
          console.error('[MEDIA] File not found:', filePath);
        }
      });

      console.log('[MEDIA] Adding', filesAdded, 'files to zip');

      // Finalize archive
      archive.finalize();

      archive.on('error', (err) => {
        console.error('[MEDIA] Archive error:', err);
        res.status(500).json({ error: 'Error creating archive' });
      });
    }
  );
});

// Get media by category
router.get('/test/:test_id/category/:category', (req, res) => {
  const { test_id, category } = req.params;

  db.all(
    'SELECT * FROM test_media WHERE test_id = ? AND category = ? ORDER BY uploaded_at DESC',
    [test_id, category],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Delete media
router.delete('/:id', verifyToken, requireAdmin, (req, res) => {
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
