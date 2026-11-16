'use strict';

const config = require('../config');

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function validateAnnouncement(body = {}) {
  const values = {
    title: clean(body.title),
    summary: clean(body.summary),
    body: clean(body.body),
    category: clean(body.category),
    imageUrl: clean(body.image_url || body.imageUrl),
    isPublished:
      body.is_published === true ||
      body.isPublished === true ||
      body.is_published === 'on' ||
      body.is_published === 'true' ||
      body.is_published === '1',
  };

  const errors = [];

  if (values.title.length < 3 || values.title.length > 160) {
    errors.push('Title must be between 3 and 160 characters.');
  }
  if (values.summary.length < 10 || values.summary.length > 300) {
    errors.push('Summary must be between 10 and 300 characters.');
  }
  if (values.body.length < 10 || values.body.length > 10000) {
    errors.push('Body must be between 10 and 10,000 characters.');
  }
  if (!config.categories.includes(values.category)) {
    errors.push('Select a valid category.');
  }
  if (values.imageUrl && values.imageUrl.length > 500) {
    errors.push('Image URL or path must be under 500 characters.');
  }

  return { valid: errors.length === 0, errors, values };
}

function parseId(value) {
  const id = Number.parseInt(value, 10);
  return Number.isInteger(id) && id > 0 ? id : null;
}

module.exports = { validateAnnouncement, parseId, clean };
