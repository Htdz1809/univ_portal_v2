'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');

const rootDir = path.resolve(__dirname, '..');
const env = process.env;
const isProduction = env.NODE_ENV === 'production';

const adminPassword = env.ADMIN_PASSWORD || '';
let adminPasswordHash = env.ADMIN_PASSWORD_HASH || '';

if (!adminPasswordHash && adminPassword) {
  adminPasswordHash = bcrypt.hashSync(adminPassword, 12);
}

if (!adminPasswordHash) {
  console.warn(
    '[config] ADMIN_PASSWORD or ADMIN_PASSWORD_HASH is not set; administrator login is disabled.'
  );
}

if (isProduction && !env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set when NODE_ENV=production.');
}

const cookieSecureSetting = String(env.COOKIE_SECURE || 'auto').toLowerCase();
let cookieSecure = 'auto';
if (cookieSecureSetting === 'true') cookieSecure = true;
if (cookieSecureSetting === 'false') cookieSecure = false;

module.exports = {
  rootDir,
  nodeEnv: env.NODE_ENV || 'development',
  isProduction,
  port: Number(env.PORT || 3001),
  databaseUrl:
    env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/university',
  databaseSsl: String(env.DATABASE_SSL || '').toLowerCase() === 'true',
  sessionSecret:
    env.SESSION_SECRET || 'development-only-secret-change-me-before-deploying',
  sessionMaxAgeMs: 8 * 60 * 60 * 1000,
  cookieSecure,
  trustProxy: String(env.TRUST_PROXY || (isProduction ? '1' : '0')) === '1',
  adminUsername: env.ADMIN_USERNAME || 'admin',
  adminPasswordHash,
  categories: ['News', 'Announcement', 'Event'],
  university: {
    name: "M'Hamed Bougara University of Boumerdes",
    shortName: 'UMBB',
    tagline: 'Higher education, research and innovation since 1998.',
    founded: 1998,
    city: 'Boumerdes, Algeria',
    email: 'contact@univ-boumerdes.dz',
    phone: '+213 24 79 52 75',
    address: 'Independence Avenue, 35000 Boumerdes, Algeria',
    about:
      "M'Hamed Bougara University of Boumerdes (UMBB) is a public university established in 1998 by Executive Decree 98-189. Its six faculties and two institutes cover science and technology, hydrocarbons and chemistry, economics and management, law and political science, languages, electrical engineering and applied sciences.",
  },
};
