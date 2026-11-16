'use strict';

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const express = require('express');
const session = require('express-session');
const PgSession = require('connect-pg-simple')(session);
const helmet = require('helmet');

const config = require('./config');
const defaultDb = require('./db');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');
const apiRoutes = require('./routes/api');
const { notFound, errorHandler } = require('./middleware/errors');

const dateFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const dateTimeFormatter = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

const assetVersion = [
  'public/css/styles.css',
  'public/js/app.js',
  'public/favicon.svg',
  'public/images/umbb-logo.png',
  'public/videos/pres.mp4',
]
  .map((file) => {
    try {
      return crypto
        .createHash('sha256')
        .update(fs.readFileSync(path.join(config.rootDir, file)))
        .digest('hex')
        .slice(0, 10);
    } catch {
      return '1';
    }
  })
  .join('-');

function createApp(options = {}) {
  const database = options.db || defaultDb;
  const app = express();

  app.disable('x-powered-by');
  if (config.trustProxy) app.set('trust proxy', 1);
  app.set('view engine', 'ejs');
  app.set('views', path.join(config.rootDir, 'views'));
  app.locals.assetVersion = assetVersion;

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

  app.use((req, res, next) => {
    res.locals.university = config.university;
    res.locals.currentUser = req.session.user || null;
    res.locals.currentPath = req.path;
    res.locals.categories = config.categories;
    res.locals.csrfToken = req.session.csrfToken || '';
    res.locals.flash = req.session.flash || null;
    if (req.session.flash) delete req.session.flash;
    res.locals.formatDate = (value) =>
      value ? dateFormatter.format(new Date(value)) : '—';
    res.locals.formatDateTime = (value) =>
      value ? dateTimeFormatter.format(new Date(value)) : '—';
    res.locals.categoryClass = (category) =>
      String(category || '')
        .toLowerCase()
        .replace(/[^a-z]+/g, '-');
    next();
  });

  app.use('/api', apiRoutes(database));

  const clientDist = path.join(config.rootDir, 'client', 'dist');
  const serveSpa =
    options.serveSpa !== undefined
      ? options.serveSpa
      : config.nodeEnv !== 'test' && fs.existsSync(clientDist);

  if (serveSpa) {
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

  app.use('/', publicRoutes(database));
  app.use('/admin', adminRoutes(database));

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

module.exports = { createApp };
