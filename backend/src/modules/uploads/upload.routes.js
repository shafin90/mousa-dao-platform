const express = require('express');
const router = express.Router();
const { upload } = require('./upload.middleware');
const { authenticate } = require('../auth/auth.middleware');
const { respond } = require('../../utils/response');

router.use(authenticate);

/** Builds the public base URL, overridable via PUBLIC_URL for reverse-proxy setups. */
const publicBase = (req) => (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');

const toUrl = (req, file) => `${publicBase(req)}/uploads/buses/${file.filename}`;

// Multiple files under field "files".
router.post('/', upload.array('files', 10), (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return respond(res, 400, null, 'No files uploaded');
    const urls = files.map((f) => toUrl(req, f));
    respond(res, 201, { urls, url: urls[0] }, 'Uploaded');
  } catch (error) { next(error); }
});

module.exports = router;
