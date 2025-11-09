const express = require('express');
const router = express.Router();
const db = require('../db/database');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const archiver = require('archiver');
const { verifyToken, requireFRAEmployee } = require('../middleware/auth');
const { logAction } = require('../utils/auditLogger');

// Configure multer for project media uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/projects');
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
  limits: { fileSize: 500 * 1024 * 1024 } // 500MB max for project documents
});

// Get all media for a project
router.get('/project/:project_id', verifyToken, (req, res) => {
  const { project_id } = req.params;

  db.all(
    'SELECT * FROM project_media WHERE project_id = ? ORDER BY uploaded_at DESC',
    [project_id],
    (err, rows) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(rows);
    }
  );
});

// Upload media to a project
router.post('/project/:project_id', verifyToken, requireFRAEmployee, upload.array('files', 20), (req, res) => {
  const { project_id } = req.params;
  const { category = 'document', description = '' } = req.body;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.status(400).json({ error: 'No files provided' });
  }

  const insertPromises = files.map(file => {
    return new Promise((resolve, reject) => {
      // Determine media type based on extension
      const ext = path.extname(file.originalname).toLowerCase();
      let mediaType = 'document';

      if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].includes(ext)) {
        mediaType = 'image';
      } else if (['.mp4', '.avi', '.mov', '.mkv', '.webm'].includes(ext)) {
        mediaType = 'video';
      } else if (ext === '.pdf') {
        mediaType = 'pdf';
      }

      const filePath = `/uploads/projects/${file.filename}`;

      db.run(
        `INSERT INTO project_media (project_id, media_type, media_category, file_name, file_path, file_size, uploaded_by, description)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [project_id, mediaType, category, file.originalname, filePath, file.size, req.user.id, description],
        function(err) {
          if (err) {
            reject(err);
          } else {
            resolve({ id: this.lastID, file_name: file.originalname });
          }
        }
      );
    });
  });

  Promise.all(insertPromises)
    .then(results => {
      logAction(req.user.id, 'UPLOAD', 'project_media', project_id, `Uploaded ${files.length} file(s) to project`, req.ip);
      res.json({
        message: `${files.length} file(s) uploaded successfully`,
        files: results
      });
    })
    .catch(err => {
      console.error('Error saving project media:', err);
      res.status(500).json({ error: 'Failed to save project media' });
    });
});

// Download a single project media file
router.get('/download/:id', verifyToken, (req, res) => {
  const { id } = req.params;

  db.get('SELECT * FROM project_media WHERE id = ?', [id], (err, media) => {
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

    res.download(filePath, media.file_name);
  });
});

// Download all project media as ZIP
router.get('/project/:project_id/download-all', verifyToken, (req, res) => {
  const { project_id } = req.params;

  db.all(
    'SELECT * FROM project_media WHERE project_id = ?',
    [project_id],
    (err, mediaFiles) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      if (mediaFiles.length === 0) {
        return res.status(404).json({ error: 'No files found for this project' });
      }

      const archive = archiver('zip', { zlib: { level: 9 } });

      res.attachment(`project-${project_id}-files.zip`);
      archive.pipe(res);

      mediaFiles.forEach(media => {
        const filePath = path.join(__dirname, '..', media.file_path);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: media.file_name });
        }
      });

      archive.finalize();
    }
  );
});

// Delete project media
router.delete('/:id', verifyToken, requireFRAEmployee, (req, res) => {
  const { id } = req.params;

  // Get file info first
  db.get('SELECT * FROM project_media WHERE id = ?', [id], (err, media) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete from database
    db.run('DELETE FROM project_media WHERE id = ?', [id], (err) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Try to delete physical file
      const filePath = path.join(__dirname, '..', media.file_path);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      logAction(req.user.id, 'DELETE', 'project_media', id, `Deleted file: ${media.file_name}`, req.ip);
      res.json({ message: 'Media deleted successfully' });
    });
  });
});

module.exports = router;
