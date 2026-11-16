'use strict';

const fs = require('fs');
const path = require('path');
const config = require('../config');

function notFound(req, res) {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({
      error: 'API endpoint not found',
      statusCode: 404,
    });
  }

  const clientDist = path.join(config.rootDir, 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    return res.status(404).sendFile(path.join(clientDist, 'index.html'));
  }

  return res.status(404).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>404 - Not Found</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 4rem 1rem;">
  <h1>404 - Page not found</h1>
  <p>The requested page could not be found.</p>
</body>
</html>`);
}

function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);

  const status = Number(error.status) || 500;
  if (status >= 500) {
    console.error('[http]', error.stack || error.message);
  }

  const message =
    status >= 500
      ? 'An unexpected error occurred. Please try again later.'
      : error.message || 'The request could not be completed.';

  if (req.path.startsWith('/api') || req.headers.accept?.includes('application/json')) {
    return res.status(status).json({
      error: message,
      statusCode: status,
      detail: config.isProduction ? null : error.stack,
    });
  }

  return res.status(status).type('html').send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><title>${status === 403 ? 'Access Denied' : 'Error'}</title></head>
<body style="font-family: sans-serif; text-align: center; padding: 4rem 1rem;">
  <h1>Error ${status}</h1>
  <p>${message}</p>
</body>
</html>`);
}

module.exports = { notFound, errorHandler };
