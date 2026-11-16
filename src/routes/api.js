'use strict';

const express = require('express');
const bcrypt = require('bcryptjs');

const config = require('../config');
const { adminCsrf, safeEqual } = require('../middleware/csrf');
const { requireAuth } = require('../middleware/auth');
const { validateAnnouncement, parseId } = require('../utils/validation');
const { handleImageUpload, removeUploadedFile } = require('../utils/upload');

module.exports = function apiRoutes(database) {
  const router = express.Router();

  router.use(adminCsrf);

  // Configuration and metadata
  router.get('/config', (req, res) => {
    res.json({
      university: config.university,
      categories: config.categories,
      user: req.session.user || null,
      csrfToken: req.session.csrfToken || '',
    });
  });

  // CSRF token endpoint
  router.get('/csrf-token', (req, res) => {
    res.json({ csrfToken: req.session.csrfToken || '' });
  });

  // Home data: recent announcements and statistics
  router.get('/home', async (req, res, next) => {
    try {
      const [announcements, departmentCount, announcementCount] =
        await Promise.all([
          database.query(
            `SELECT id, title, summary, category, image_url, published_at
               FROM announcements
              WHERE is_published = TRUE
              ORDER BY published_at DESC, id DESC
              LIMIT 3`
          ),
          database.query('SELECT COUNT(*)::int AS count FROM departments'),
          database.query(
            'SELECT COUNT(*)::int AS count FROM announcements WHERE is_published = TRUE'
          ),
        ]);

      res.json({
        recentAnnouncements: announcements.rows,
        stats: {
          departments: departmentCount.rows[0].count,
          announcements: announcementCount.rows[0].count,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // Departments list
  router.get('/departments', async (req, res, next) => {
    try {
      const departments = await database.query(
        `SELECT id, name, description, head_of_department, contact_email
           FROM departments
          ORDER BY name ASC`
      );

      res.json({
        departments: departments.rows,
      });
    } catch (error) {
      next(error);
    }
  });

  // News list with filtering & search
  router.get('/news', async (req, res, next) => {
    try {
      const category = typeof req.query.category === 'string' ? req.query.category : '';
      const search =
        typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';

      const conditions = ['is_published = TRUE'];
      const values = [];

      if (category && config.categories.includes(category)) {
        values.push(category);
        conditions.push(`category = $${values.length}`);
      }

      if (search) {
        values.push(`%${search}%`);
        conditions.push(
          `(title ILIKE $${values.length} OR summary ILIKE $${values.length} OR body ILIKE $${values.length})`
        );
      }

      const result = await database.query(
        `SELECT id, title, summary, category, image_url, published_at
           FROM announcements
          WHERE ${conditions.join(' AND ')}
          ORDER BY published_at DESC, id DESC`,
        values
      );

      res.json({
        announcements: result.rows,
        categories: config.categories,
        selectedCategory: category,
        searchQuery: search,
      });
    } catch (error) {
      next(error);
    }
  });

  // Single news detail
  router.get('/news/:id', async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) {
        return res.status(404).json({ error: 'Announcement not found.' });
      }

      const result = await database.query(
        `SELECT id, title, summary, body, category, image_url, published_at, updated_at
           FROM announcements
          WHERE id = $1 AND is_published = TRUE`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found.' });
      }

      res.json({ announcement: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  // Auth: check current user
  router.get('/auth/me', (req, res) => {
    res.json({
      authenticated: Boolean(req.session && req.session.user),
      user: req.session.user || null,
      csrfToken: req.session.csrfToken || '',
    });
  });

  // Auth: login
  router.post('/auth/login', async (req, res, next) => {
    try {
      const username =
        typeof req.body.username === 'string' ? req.body.username.trim() : '';
      const password =
        typeof req.body.password === 'string' ? req.body.password : '';

      if (!config.adminPasswordHash) {
        return res.status(503).json({
          error: 'Administrator access is not configured on this server.',
        });
      }

      const usernameOk = safeEqual(username, config.adminUsername);
      const passwordOk =
        usernameOk &&
        (await bcrypt.compare(password, config.adminPasswordHash));

      if (!usernameOk || !passwordOk) {
        return res.status(401).json({
          error: 'Invalid username or password.',
        });
      }

      return req.session.regenerate((error) => {
        if (error) return next(error);
        req.session.user = { username: config.adminUsername };
        return req.session.save((saveError) => {
          if (saveError) return next(saveError);
          return res.json({
            ok: true,
            user: req.session.user,
            csrfToken: req.session.csrfToken || '',
          });
        });
      });
    } catch (error) {
      return next(error);
    }
  });

  // Auth: logout
  router.post('/auth/logout', (req, res, next) => {
    req.session.destroy((error) => {
      if (error) return next(error);
      res.clearCookie('umbb.sid');
      return res.json({ ok: true });
    });
  });

  // --- Admin API routes (auth required) ---
  const apiRequireAuth = (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    next();
  };

  // Admin Dashboard stats & list
  router.get('/admin/dashboard', apiRequireAuth, async (req, res, next) => {
    try {
      const [stats, announcements] = await Promise.all([
        database.query(
          `SELECT COUNT(*)::int AS total,
                  COUNT(*) FILTER (WHERE is_published)::int AS published,
                  COUNT(*) FILTER (WHERE NOT is_published)::int AS drafts
             FROM announcements`
        ),
        database.query(
          `SELECT id, title, summary, category, image_url, is_published, published_at, updated_at
             FROM announcements
            ORDER BY updated_at DESC, id DESC`
        ),
      ]);

      res.json({
        stats: stats.rows[0],
        announcements: announcements.rows,
      });
    } catch (error) {
      next(error);
    }
  });

  // Admin get single announcement for editing
  router.get('/admin/announcements/:id', apiRequireAuth, async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(404).json({ error: 'Announcement not found' });

      const result = await database.query(
        `SELECT id, title, summary, body, category, image_url, is_published
           FROM announcements
          WHERE id = $1`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      res.json({ announcement: result.rows[0] });
    } catch (error) {
      next(error);
    }
  });

  // Admin create announcement
  router.post(
    '/admin/announcements',
    apiRequireAuth,
    handleImageUpload,
    async (req, res, next) => {
      try {
        const validation = validateAnnouncement(req.body);
        if (req.uploadError) {
          validation.errors.push(req.uploadError);
          validation.valid = false;
        }

        let imageUrl = null;
        if (req.file) {
          imageUrl = `/uploads/${req.file.filename}`;
        } else if (validation.values.imageUrl) {
          imageUrl = validation.values.imageUrl;
        }

        if (!validation.valid) {
          if (req.file) {
            removeUploadedFile(`/uploads/${req.file.filename}`);
          }
          return res.status(422).json({
            ok: false,
            errors: validation.errors,
            values: { ...validation.values, imageUrl },
          });
        }

        const values = validation.values;
        const result = await database.query(
          `INSERT INTO announcements (title, summary, body, category, image_url, is_published, published_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())
           RETURNING id`,
          [
            values.title,
            values.summary,
            values.body,
            values.category,
            imageUrl,
            values.isPublished,
          ]
        );

        res.status(201).json({
          ok: true,
          id: result.rows[0].id,
          message: `Announcement #${result.rows[0].id} created.`,
        });
      } catch (error) {
        if (req.file) {
          removeUploadedFile(`/uploads/${req.file.filename}`);
        }
        next(error);
      }
    }
  );

  // Admin update announcement (support both PUT and POST)
  const handleUpdate = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(404).json({ error: 'Announcement not found' });

      const existingResult = await database.query(
        'SELECT id, image_url FROM announcements WHERE id = $1',
        [id]
      );
      if (existingResult.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }
      const existing = existingResult.rows[0];

      const validation = validateAnnouncement(req.body);
      if (req.uploadError) {
        validation.errors.push(req.uploadError);
        validation.valid = false;
      }

      let imageUrl = existing.image_url;
      if (req.file) {
        imageUrl = `/uploads/${req.file.filename}`;
      } else if (
        req.body.remove_image === '1' ||
        req.body.remove_image === 'true' ||
        req.body.remove_image === true
      ) {
        imageUrl = null;
      } else if (
        validation.values.imageUrl !== undefined &&
        validation.values.imageUrl !== ''
      ) {
        imageUrl = validation.values.imageUrl;
      }

      if (!validation.valid) {
        if (req.file) {
          removeUploadedFile(`/uploads/${req.file.filename}`);
        }
        return res.status(422).json({
          ok: false,
          errors: validation.errors,
          values: { ...validation.values, imageUrl },
        });
      }

      const values = validation.values;
      const result = await database.query(
        `UPDATE announcements
            SET title = $1,
                summary = $2,
                body = $3,
                category = $4,
                image_url = $5,
                is_published = $6,
                updated_at = NOW()
          WHERE id = $7
          RETURNING id`,
        [
          values.title,
          values.summary,
          values.body,
          values.category,
          imageUrl,
          values.isPublished,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      if (existing.image_url && existing.image_url !== imageUrl) {
        removeUploadedFile(existing.image_url);
      }

      res.json({
        ok: true,
        id,
        message: `Announcement #${id} updated.`,
      });
    } catch (error) {
      if (req.file) {
        removeUploadedFile(`/uploads/${req.file.filename}`);
      }
      next(error);
    }
  };

  router.put('/admin/announcements/:id', apiRequireAuth, handleImageUpload, handleUpdate);
  router.post('/admin/announcements/:id', apiRequireAuth, handleImageUpload, handleUpdate);

  // Admin delete announcement (support both DELETE and POST /delete)
  const handleDelete = async (req, res, next) => {
    try {
      const id = parseId(req.params.id);
      if (!id) return res.status(404).json({ error: 'Announcement not found' });

      const existingResult = await database.query(
        'SELECT id, image_url FROM announcements WHERE id = $1',
        [id]
      );
      const existing = existingResult.rows.length > 0 ? existingResult.rows[0] : null;

      const result = await database.query(
        'DELETE FROM announcements WHERE id = $1 RETURNING id',
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Announcement not found' });
      }

      if (existing && existing.image_url) {
        removeUploadedFile(existing.image_url);
      }

      res.json({
        ok: true,
        message: `Announcement #${id} deleted.`,
      });
    } catch (error) {
      next(error);
    }
  };

  router.delete('/admin/announcements/:id', apiRequireAuth, handleDelete);
  router.post('/admin/announcements/:id/delete', apiRequireAuth, handleDelete);

  return router;
};
