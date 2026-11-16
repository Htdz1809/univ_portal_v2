# UMBB University Portal

A small dynamic university information and announcement system built with
Node.js, Express, EJS and PostgreSQL. The same application is deployed in two
ways:

1. **Self-managed IaaS-style environment:** two Docker containers (application
   and PostgreSQL) inside an Ubuntu virtual machine running in VirtualBox.
2. **PaaS environment:** a Render web service connected to a managed Render
   PostgreSQL database.

The portal uses publicly available information about M'Hamed Bougara
University of Boumerdès (UMBB). Seeded announcements are sample content for the
administration demonstration, and this is not an official university website.
The project was created for an academic cloud-computing assignment.


## Features

- Public home page with university presentation, statistics and the three most
  recent announcements.
- Faculties and institutes page loaded from PostgreSQL.
- News and announcements list with category filtering and full-text search.
- Announcement detail pages.
- Administrator sign-in at `/admin/login` with session authentication,
  bcrypt password verification and CSRF protection.
- Administrator dashboard to create, edit, publish/unpublish and delete
  announcements.
- Health endpoint at `/healthz` used by Docker and Render.
- Idempotent schema creation and seed data, so an empty database becomes usable
  on first start.
- Persistent PostgreSQL storage in both environments.


## Project structure

```
.
|-- server.js                 Application entry point, startup and shutdown
|-- src/
|   |-- app.js                Express application factory
|   |-- config.js             Environment configuration and university data
|   |-- db.js                 PostgreSQL pool, retry, schema and seed helpers
|   |-- middleware/           Authentication, CSRF and error handling
|   |-- routes/               Public and administrator routes
|   |-- scripts/              Password hashing utility
|   `-- utils/                Validation helpers
|-- db/
|   |-- schema.sql            Tables, constraints and indexes
|   `-- seed.sql              UMBB faculties, institutes and sample announcements
|-- views/                    EJS templates (public and admin)
|-- public/                   CSS, JavaScript and favicon
|-- tests/                    Automated route and admin tests
|-- scripts/smoke-test.js     End-to-end test against a running deployment
|-- Dockerfile                Production image
|-- docker-compose.yml        Application + PostgreSQL deployment
|-- render.yaml               Render Blueprint (web service + database)
`-- docs/
    |-- VM_SETUP.md           VirtualBox, Ubuntu, networking, Docker steps
    |-- RENDER_DEPLOY.md      Render deployment and verification
    |-- TROUBLESHOOTING.md    Common problems and fixes
    |-- REPORT.md             Technical report
    `-- VIDEO_SCRIPT.md       Demonstration shot list
```

## Quick start with Docker

### Prerequisites

- Docker Engine or Docker Desktop with Compose v2.
- Git (optional, for transferring the project).

### 1. Create the environment file

PowerShell:

```powershell
Copy-Item .env.example .env
```

Bash:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

- `POSTGRES_PASSWORD` — a strong alphanumeric password.
- `SESSION_SECRET` — a long random value.
- `ADMIN_PASSWORD` — the administrator password.

Generate random values:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

or:

```bash
openssl rand -hex 48
```

### 2. Start the stack

```bash
docker compose up -d --build
docker compose ps
docker compose logs -f app
```

Wait until both containers are healthy. Then open:

- Public site: <http://localhost:3000>
- Administration: <http://localhost:3000/admin/login>

The credentials are the `ADMIN_USERNAME` and `ADMIN_PASSWORD` values from
`.env`.

### 3. Verify the deployment

```bash
curl http://localhost:3000/healthz
npm ci
npm run smoke
```

`npm run smoke` signs in, creates an announcement, checks it on the public
site, edits it and reports its ID. To test deletion as well:

```bash
npm run smoke -- --delete
```

To test a remote deployment:

```powershell
$env:ADMIN_PASSWORD = "the-admin-password"
npm run smoke -- http://192.168.1.50:3000
```

### 4. Stop or remove

```bash
docker compose down          # keeps the umbb_pgdata volume
docker compose down -v       # DESTROYS the database volume
```

## Environment variables

| Variable | Purpose | Docker default |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `production` in Compose |
| `PORT` | HTTP port inside the container | `3000` |
| `DATABASE_URL` | PostgreSQL connection string | Built by Compose for the `db` service |
| `DATABASE_SSL` | Enable TLS to the database | `false` in Docker and for Render's internal URL; `true` only for Render's external URL |
| `SESSION_SECRET` | Session cookie signing secret | Required |
| `ADMIN_USERNAME` | Administrator username | `admin` |
| `ADMIN_PASSWORD` | Administrator password, hashed in memory at startup | Required |
| `ADMIN_PASSWORD_HASH` | Optional pre-computed bcrypt hash, takes precedence | Empty |
| `COOKIE_SECURE` | `true`, `false` or `auto` for the session cookie | `auto` |
| `TRUST_PROXY` | Set to `1` behind a reverse proxy such as Render | `0` |
| `POSTGRES_DB` / `POSTGRES_USER` / `POSTGRES_PASSWORD` | Compose database credentials | See `.env.example` |
| `APP_PORT` | Host port published by Compose | `3000` |

Generate a bcrypt hash for `ADMIN_PASSWORD_HASH`:

```bash
npm run hash-password -- "your-strong-password"
```

## Database and persistence

- `db/schema.sql` creates `departments`, `announcements`, `app_metadata` and
  indexes. `db/seed.sql` adds UMBB academic units and sample announcements only
  once, tracked by the `initial_seed` row in `app_metadata`.
- Schema and seed scripts run at every application start and are idempotent.
- If `db/seed.sql` changes and an existing database must be refreshed, run
  `docker compose down -v` before starting the stack again.
- Docker uses the named volume `umbb_pgdata`, mounted at
  `/var/lib/postgresql/data`. Removing or recreating the PostgreSQL container
  does not delete the volume.
- Render manages PostgreSQL separately from the web service, so application
  redeploys do not remove database data.

Verify data directly in the Docker deployment:

```bash
docker compose exec db psql -U university -d university \
  -c "SELECT id, title, category, is_published FROM announcements ORDER BY id;"
```

Demonstrate persistence:

```bash
docker compose rm -sf db
docker compose up -d db
docker compose exec db psql -U university -d university \
  -c "SELECT count(*) FROM announcements;"
```

The announcement count and the administrator's changes remain intact.

## Tests

```bash
npm ci
npm test
npm run check
```

The automated tests use an in-memory session store and a fake database layer, so
they do not require PostgreSQL. The smoke test performs real HTTP requests and
admin CRUD operations against a running deployment.

## Security notes

- SQL queries are parameterised; user input is never concatenated into SQL.
- Announcement form input is validated and length-limited on the server.
- Admin passwords are bcrypt-hashed; the plaintext value from the environment
  is not stored in PostgreSQL.
- Sessions use an HTTP-only, SameSite=Lax cookie and are stored in PostgreSQL.
- State-changing admin forms require a per-session CSRF token.
- Helmet sets security headers and a restrictive Content Security Policy.
- The database has no published host port in Docker and uses a private network.
- `.env` is gitignored. Never commit real secrets.


