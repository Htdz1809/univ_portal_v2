'use strict';

process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'admin';
process.env.ADMIN_PASSWORD = 'correct-horse-battery-staple';
process.env.SESSION_SECRET = 'test-session-secret-only';
process.env.COOKIE_SECURE = 'false';
process.env.TRUST_PROXY = '0';

const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const session = require('express-session');

const { createApp } = require('../src/app');

const publishedAt = new Date('2026-11-12T09:00:00Z');

const announcement = {
  id: 1,
  title: 'Autumn 2026 enrolment now open',
  summary: 'Applications for undergraduate and postgraduate programmes are open.',
  body: 'Full announcement body for testing.',
  category: 'Announcement',
  image_url: null,
  is_published: true,
  published_at: publishedAt,
  updated_at: publishedAt,
};

const department = {
  id: 1,
  name: 'Faculty of Sciences',
  description: 'Six departments covering mathematics, physics, chemistry, computer science and biology.',
  head_of_department: 'Abdelhakim DAOUI, Dean',
  contact_email: 'a.daoui@univ-boumerdes.dz',
};

function createFakeDb() {
  return {
    query: async (text, params = []) => {
      const sql = String(text).replace(/\s+/g, ' ').trim();

      if (sql === 'SELECT 1') return { rows: [{ ok: 1 }] };

      if (sql.startsWith('SELECT COUNT(*)::int AS count FROM departments')) {
        return { rows: [{ count: 8 }] };
      }

      if (
        sql.startsWith(
          'SELECT COUNT(*)::int AS count FROM announcements WHERE is_published = TRUE'
        )
      ) {
        return { rows: [{ count: 1 }] };
      }

      if (sql.includes('LIMIT 3') && sql.includes('FROM announcements')) {
        return { rows: [announcement] };
      }

      if (sql.includes('ORDER BY updated_at')) {
        return { rows: [announcement] };
      }

      if (sql.includes('COUNT(*) FILTER')) {
        return { rows: [{ total: 1, published: 1, drafts: 0 }] };
      }

      if (sql.includes('FROM departments ORDER BY name')) {
        return { rows: [department] };
      }

      if (sql.includes('WHERE id = $1 AND is_published = TRUE')) {
        return { rows: [announcement] };
      }

      if (sql.includes('FROM announcements WHERE id = $1')) {
        return { rows: [announcement] };
      }

      if (sql.includes('FROM announcements') && sql.includes('is_published = TRUE')) {
        return { rows: [announcement] };
      }

      if (sql.startsWith('INSERT INTO announcements')) {
        return { rows: [{ id: 42 }] };
      }

      if (sql.startsWith('UPDATE announcements')) {
        return { rows: [{ id: 1 }] };
      }

      if (sql.startsWith('DELETE FROM announcements')) {
        return { rows: [{ id: 1 }] };
      }

      return { rows: [] };
    },
  };
}

function buildTestApp() {
  const store = new session.MemoryStore();
  const db = createFakeDb();
  const app = createApp({ db, sessionStore: store });
  return { app, db };
}

test('API: /api/config returns university and categories metadata', async () => {
  const { app } = buildTestApp();
  const res = await request(app).get('/api/config').expect(200);

  assert.equal(res.body.university.shortName, 'UMBB');
  assert.ok(Array.isArray(res.body.categories));
  assert.ok(res.body.categories.includes('News'));
});

test('API: /api/home returns recent announcements and stats', async () => {
  const { app } = buildTestApp();
  const res = await request(app).get('/api/home').expect(200);

  assert.equal(res.body.recentAnnouncements.length, 1);
  assert.equal(res.body.stats.departments, 8);
  assert.equal(res.body.stats.announcements, 1);
});

test('API: /api/departments returns department list', async () => {
  const { app } = buildTestApp();
  const res = await request(app).get('/api/departments').expect(200);

  assert.equal(res.body.departments.length, 1);
  assert.equal(res.body.departments[0].name, 'Faculty of Sciences');
});

test('API: /api/news returns announcements list and filters', async () => {
  const { app } = buildTestApp();
  const res = await request(app).get('/api/news?category=Announcement').expect(200);

  assert.equal(res.body.announcements.length, 1);
  assert.equal(res.body.selectedCategory, 'Announcement');
});

test('API: /api/news/:id returns announcement detail', async () => {
  const { app } = buildTestApp();
  const res = await request(app).get('/api/news/1').expect(200);

  assert.equal(res.body.announcement.id, 1);
  assert.equal(res.body.announcement.title, 'Autumn 2026 enrolment now open');
});

test('API: /api/auth/me reports unauthenticated visitor', async () => {
  const { app } = buildTestApp();
  const res = await request(app).get('/api/auth/me').expect(200);

  assert.equal(res.body.authenticated, false);
  assert.equal(res.body.user, null);
});

test('API: /api/auth/login rejects invalid credentials and accepts valid ones', async () => {
  const { app } = buildTestApp();
  const agent = request.agent(app);

  // Invalid login
  await agent
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'wrongpassword' })
    .expect(401);

  // Valid login
  const loginRes = await agent
    .post('/api/auth/login')
    .send({ username: 'admin', password: 'correct-horse-battery-staple' })
    .expect(200);

  assert.equal(loginRes.body.ok, true);
  assert.equal(loginRes.body.user.username, 'admin');

  // Verify /api/auth/me with session
  const meRes = await agent.get('/api/auth/me').expect(200);
  assert.equal(meRes.body.authenticated, true);
  assert.equal(meRes.body.user.username, 'admin');

  // Open admin dashboard
  const dashRes = await agent.get('/api/admin/dashboard').expect(200);
  assert.equal(dashRes.body.stats.total, 1);

  // Create announcement
  const createRes = await agent
    .post('/api/admin/announcements')
    .field('title', 'New Research Grant')
    .field('category', 'News')
    .field('summary', 'Funding has been awarded for scientific labs.')
    .field('body', 'Detailed description of the new research funding grant.')
    .field('is_published', 'true')
    .expect(201);

  assert.equal(createRes.body.ok, true);
  assert.equal(createRes.body.id, 42);

  // Update announcement
  const updateRes = await agent
    .put('/api/admin/announcements/1')
    .field('title', 'Updated Enrolment Notice')
    .field('category', 'Announcement')
    .field('summary', 'Applications deadline has been extended.')
    .field('body', 'Extended deadline information goes here.')
    .field('is_published', 'true')
    .expect(200);

  assert.equal(updateRes.body.ok, true);

  // Delete announcement
  const deleteRes = await agent.delete('/api/admin/announcements/1').expect(200);
  assert.equal(deleteRes.body.ok, true);

  // Logout
  const logoutRes = await agent.post('/api/auth/logout').expect(200);
  assert.equal(logoutRes.body.ok, true);

  // Verify logged out
  const postLogoutMe = await agent.get('/api/auth/me').expect(200);
  assert.equal(postLogoutMe.body.authenticated, false);
});

test('SPA: serves Vite built index.html when serveSpa is true', async () => {
  const store = new session.MemoryStore();
  const db = createFakeDb();
  const app = createApp({ db, sessionStore: store, serveSpa: true });

  const res = await request(app).get('/').expect(200);
  assert.match(res.text, /<div id="root"><\/div>/);
  assert.match(res.text, /Boumerdes/);
});
