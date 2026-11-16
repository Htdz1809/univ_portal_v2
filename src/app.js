'use strict';

const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');

const config = require('./config');
const defaultDb = require('./db');
const apiRoutes = require('./routes/api');
const { notFound, errorHandler } = require('./middleware/errors');

function createApp(options = {}) {
  const database = options.db || defaultDb;
  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          mediaSrc: ["'self'", 'blob:'],
          connectSrc: ["'self'", 'ws:', 'http://localhost:*'],
          formAction: ["'self'"],
          upgradeInsecureRequests: null,
        },
      },
    })
  );

  app.get('/healthz', async (req, res) => {
    try {
      await database.query('SELECT 1');
      res.status(200).json({ status: 'ok', database: 'up' });
    } catch {
      res.status(503).json({ status: 'error', database: 'unavailable' });
    }
  });

  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false, limit: '100kb' }));

  // Static assets (uploads, public images, videos)
  app.use(
    express.static(path.join(config.rootDir, 'public'), {
      maxAge: config.isProduction ? '1d' : 0,
    })
  );

  const sessionStore =
    options.sessionStore ||
    new PgSession({
      pool: database.pool,
      createTableIfMissing: true,
    });

  app.use(
    session({
      store: sessionStore,
      name: 'umbb.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: config.cookieSecure,
        maxAge: config.sessionMaxAgeMs,
      },
    })
  );

  // Mount REST API
  app.use('/api', apiRoutes(database));

  // Serve Vite client build SPA
  const clientDist = path.join(config.rootDir, 'client', 'dist');
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.use((req, res, next) => {
      if (req.method !== 'GET') return next();
      if (
        req.path.startsWith('/api') ||
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/images') ||
        req.path.startsWith('/videos')
      ) {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
