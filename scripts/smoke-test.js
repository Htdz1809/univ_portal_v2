'use strict';

require('dotenv').config({ quiet: true });

const args = process.argv.slice(2);
const baseUrlArgument = args.find((argument) => !argument.startsWith('--'));
const baseUrl =
  baseUrlArgument ||
  process.env.BASE_URL ||
  `http://localhost:${process.env.PORT || 3001}`;
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || '';
const shouldDelete = args.includes('--delete');

if (!password) {
  console.error('Set ADMIN_PASSWORD (or put it in .env) before running this script.');
  process.exit(1);
}

let cookie = '';

function absolute(path) {
  return new URL(path, baseUrl).toString();
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (cookie) headers.cookie = cookie;

  const response = await fetch(absolute(path), {
    ...options,
    headers,
    redirect: 'manual',
  });

  const setCookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    cookie = setCookies.map((value) => value.split(';')[0]).join('; ');
  }

  return response;
}

function extractCsrf(html) {
  const match = html.match(/name="_csrf" value="([^"]+)"/);
  if (!match) throw new Error('CSRF token not found in page');
  return match[1];
}

function formBody(fields) {
  return new URLSearchParams(fields).toString();
}

async function expectStatus(response, expected, label) {
  if (response.status !== expected) {
    const body = await response.text();
    throw new Error(
      `${label}: expected HTTP ${expected}, received ${response.status}\n${body.slice(0, 500)}`
    );
  }
  console.log(`  ok  ${label} (${response.status})`);
}

async function main() {
  console.log(`Smoke test target: ${baseUrl}`);

  const health = await request('/healthz');
  await expectStatus(health, 200, 'health check');
  const healthBody = await health.json();
  if (healthBody.database !== 'up') throw new Error('Database is not available');

  const home = await request('/');
  await expectStatus(home, 200, 'home page');
  const homeHtml = await home.text();
  if (!homeHtml.includes('BOUGARA de Boumerdès')) {
    throw new Error('Home page does not contain the university name');
  }

  await expectStatus(await request('/departments'), 200, 'faculties and institutes page');
  await expectStatus(await request('/news'), 200, 'news page');

  const loginPage = await request('/admin/login');
  await expectStatus(loginPage, 200, 'admin login page');
  const loginCsrf = extractCsrf(await loginPage.text());

  const login = await request('/admin/login', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: formBody({
      _csrf: loginCsrf,
      username,
      password,
    }),
  });
  await expectStatus(login, 302, 'administrator sign in');

  const dashboard = await request('/admin');
  await expectStatus(dashboard, 200, 'admin dashboard');
  const dashboardHtml = await dashboard.text();
  const csrf = extractCsrf(dashboardHtml);

  const unique = new Date().toISOString().replace(/[:.]/g, '-');
  const title = `Smoke test announcement ${unique}`;

  const create = await request('/admin/announcements', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: formBody({
      _csrf: csrf,
      title,
      summary: 'Created by the automated smoke test to verify deployment health.',
      body: 'This announcement was created through the administration interface by the smoke test script.',
      category: 'News',
      is_published: 'on',
    }),
  });
  await expectStatus(create, 302, 'create announcement');

  const afterCreate = await request('/admin');
  const afterCreateHtml = await afterCreate.text();
  if (!afterCreateHtml.includes(title)) {
    throw new Error('Created announcement is not listed on the dashboard');
  }
  console.log('  ok  created announcement appears on dashboard');

  const editMatch = afterCreateHtml.match(
    /\/admin\/announcements\/(\d+)\/edit/
  );
  if (!editMatch) throw new Error('Could not determine the new announcement id');
  const id = editMatch[1];

  const publicPage = await request(`/news/${id}`);
  await expectStatus(publicPage, 200, 'published announcement on public site');

  const editPage = await request(`/admin/announcements/${id}/edit`);
  await expectStatus(editPage, 200, 'edit form');
  const editCsrf = extractCsrf(await editPage.text());

  const updatedTitle = `${title} (updated)`;
  const update = await request(`/admin/announcements/${id}`, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: formBody({
      _csrf: editCsrf,
      title: updatedTitle,
      summary: 'Updated by the automated smoke test to verify edit operations.',
      body: 'This announcement was edited through the administration interface by the smoke test script.',
      category: 'News',
      is_published: 'on',
    }),
  });
  await expectStatus(update, 302, 'update announcement');

  const afterUpdate = await request('/admin');
  const afterUpdateHtml = await afterUpdate.text();
  if (!afterUpdateHtml.includes(updatedTitle)) {
    throw new Error('Updated announcement is not listed on the dashboard');
  }
  console.log('  ok  updated announcement appears on dashboard');

  if (shouldDelete) {
    const deleteCsrf = extractCsrf(afterUpdateHtml);
    const remove = await request(`/admin/announcements/${id}/delete`, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: formBody({ _csrf: deleteCsrf }),
    });
    await expectStatus(remove, 302, 'delete announcement');
  } else {
    console.log(`\nCreated announcement id=${id} (kept for persistence testing)`);
    console.log(`Title: ${updatedTitle}`);
  }

  console.log('\nAll smoke tests passed.');
}

main().catch((error) => {
  console.error(`\nSmoke test failed: ${error.message}`);
  process.exit(1);
});
