/* server/middleware/upload.js — Multer config */
require('dotenv').config();
const path   = require('path');
const fs     = require('fs');
const multer = require('multer');

const UPLOADS_DIR = path.resolve(process.env.UPLOADS_DIR || './uploads/products');
fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename:    (_req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const name = 'prod_' + Date.now() + '_' + Math.random().toString(36).slice(2,7) + ext;
    cb(null, name);
  }
});

const fileFilter = (_req, file, cb) => {
  const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
  const ext     = path.extname(file.originalname).toLowerCase();
  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Type de fichier non autorisé. Utilisez jpg, png, webp.'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB max
});

module.exports = upload;
