const mongoSanitize = require('express-mongo-sanitize');

const sanitize = (req, res, next) => {
  if (req.body) req.body = mongoSanitize.sanitize(req.body);
  if (req.params) req.params = mongoSanitize.sanitize(req.params);
  next();
};

module.exports = sanitize;
