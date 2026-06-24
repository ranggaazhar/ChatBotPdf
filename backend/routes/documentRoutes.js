const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const documentController = require('../controllers/documentController');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Pastikan folder uploads ada
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Konfigurasi Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {
    // Pastikan hanya file PDF yang boleh diupload
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext !== '.pdf' && file.mimetype !== 'application/pdf') {
      return cb(new Error('Hanya file PDF yang diperbolehkan!'), false);
    }
    cb(null, true);
  },
  limits: { fileSize: 10 * 1024 * 1024 } // Batas ukuran 10MB
});

// Middleware penangkap error dari multer agar merespon JSON yang rapi
const uploadMiddleware = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: err.message });
    }
    next();
  });
};

// Hanya admin yang bisa upload & delete dokumen, tapi user biasa bisa melihat daftar dokumen untuk di-chat
router.post('/', authMiddleware, adminMiddleware, uploadMiddleware, documentController.uploadDocument);
router.get('/', authMiddleware, documentController.getAllDocuments);
router.delete('/:id', authMiddleware, adminMiddleware, documentController.deleteDocument);

module.exports = router;
