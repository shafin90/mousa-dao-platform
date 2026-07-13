const path = require('path');
const fs = require('fs');
const multer = require('multer');
const AppError = require('../../errors/AppError');

const UPLOAD_ROOT = path.join(__dirname, '..', '..', '..', 'uploads');
const BUS_DIR = path.join(UPLOAD_ROOT, 'buses');

// Ensure upload directories exist at load time.
fs.mkdirSync(BUS_DIR, { recursive: true });

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, BUS_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const safe = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, safe);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME.includes(file.mimetype)) return cb(null, true);
  cb(new AppError('Only image files (jpeg, png, webp, gif) are allowed', 400, 'INVALID_FILE_TYPE'));
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 10 },
});

module.exports = { upload, UPLOAD_ROOT };
