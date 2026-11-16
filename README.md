# UMBB University Portal v2

A modern, responsive university information and announcement portal built with **React 19**, **Vite**, **Express 5**, and **PostgreSQL**.

The application is deployed and tested in two environments:
1. **Self-managed IaaS-style environment:** Two Docker containers (Vite-built Express API runtime and PostgreSQL database) managed via Docker Compose.
2. **PaaS environment:** A Render web service (Docker runtime) connected to a managed Render PostgreSQL database configured via `render.yaml`.

The portal presents public information about M'Hamed Bougara University of Boumerdès (UMBB) with dynamic administrative management for official announcements, academic faculties, and news.

---

## Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite 6, React Router 7, SPA client architecture, Vanilla CSS with custom properties |
| **Backend** | Node.js (>=20), Express 5 REST API, Helmet security headers, Multer upload engine |
| **Database** | PostgreSQL 16 (`pg` connection pool, `connect-pg-simple` session store) |
| **Authentication** | Session-based auth with HTTP-only cookies, Bcrypt password hashing, CSRF verification |
| **DevOps & Containers** | Docker multi-stage build, Docker Compose, Render Blueprint (`render.yaml`) |

---

## Features

- **Public Portal:**
  - Modern, responsive landing page with university overview, statistics, and latest announcements.
  - Smooth section navigation with interactive pill highlights and auto-scroll offsets.
  - Academic faculties and institutes directory loaded dynamically from PostgreSQL.
  - News and announcements feed with category filtering (Academic, Events, Admissions, Research) and search.
  - Individual announcement detail views with publication dates, categories, and cover images.
- **Administration Panel:**
  - Secure login at `/admin/login` with session authentication, CSRF tokens, and bcrypt password verification.
  - Interactive admin dashboard with live announcement statistics and status badges.
  - Full CRUD for announcements: create, edit, delete, publish, and unpublish.
  - File upload engine with automatic image sanitization and preview support.
- **Reliability & DevOps:**
  - Complete REST API layer (`/api/*`) decoupling the frontend SPA from backend logic.
  - `/healthz` endpoint checking database connectivity for Docker and Render health checks.
  - Idempotent schema initialization and seed data on startup.
  - Automated Node.js native test suite (`node --test`).

---

## Project Structure

```
univ_portal_v2/
|-- client/                   # Frontend Vite + React SPA
|   |-- index.html            # Single page application HTML shell
|   `-- src/
|       |-- main.jsx          # React 19 entry point and router wrapper
|       |-- App.jsx           # Client-side routes definition
|       |-- styles.css        # Complete portal stylesheet
|       |-- components/       # Header, Footer, FlashNotification, ScrollToTop
|       |-- context/          # AuthContext (session state & login management)
|       |-- pages/            # Home, Departments, News, NewsDetail, Admin pages
|       `-- utils/            # Date and category formatting helpers
|-- src/                      # Backend Express 5 REST API
|   |-- app.js                # Express app factory & static client distributor
|   |-- config.js             # Environment variables and metadata
|   |-- db.js                 # PostgreSQL connection pool & migration runner
|   |-- middleware/           # Auth guard, CSRF validation, error handlers
|   |-- routes/api.js         # REST endpoints for config, auth, news, and admin
|   |-- scripts/              # Password hashing utility
|   `-- utils/                # Validation and Multer image upload utilities
|-- db/
|   |-- schema.sql            # PostgreSQL schema (departments, announcements, metadata)
|   `-- seed.sql              # Idempotent seed data for faculties and announcements
|-- public/                   # Static assets (faculty badges, videos, uploads)
|-- tests/                    # Automated REST API and integration tests
|-- Dockerfile                # Multi-stage production container build (Vite + Node runtime)
|-- docker-compose.yml        # Multi-container orchestration (App + PostgreSQL)
|-- render.yaml               # Render infrastructure Blueprint
|-- server.js                 # Application bootstrap and graceful shutdown
`-- vite.config.mjs           # Vite development and build configuration
```

---

## Getting Started

### Prerequisites
- **Node.js** >= 20.x and **npm**
- **Docker** and **Docker Compose** (for containerized setup)
- **PostgreSQL** (if running outside Docker)

---

### Local Development (Vite HMR + Express API)

1. **Clone repository & install dependencies:**
   ```bash
   git clone https://github.com/Htdz1809/univ_portal_v2.git
   cd univ_portal_v2
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   ```
   Configure `.env` with your database credentials and secret keys:
   ```ini
   PORT=3001
   DATABASE_URL=postgres://university:strongpassword@localhost:5433/university
   SESSION_SECRET=a_very_long_secure_random_string_here
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=admin
   ```

3. **Run database (Docker):**
   ```bash
   docker compose up -d db
   ```

4. **Start the development servers:**
   - **Backend API (port 3001):**
     ```bash
     npm run dev
     ```
   - **Frontend Vite dev server with HMR (port 5174):**
     ```bash
     npm run client:dev
     ```
   Open `http://localhost:5174` in your browser. Vite proxies `/api` and `/uploads` requests directly to Express on port 3001.

---

### Production Build & Local Preview

Build the Vite client bundle and run the Express server:

```bash
npm run build
npm start
```
The application will be accessible at `http://localhost:3001`.

---

### Quick Start with Docker Compose

To build and run the entire stack (PostgreSQL + App):

```bash
docker compose up -d --build
docker compose ps
```

- Public portal: `http://localhost:3001`
- Administration: `http://localhost:3001/admin/login`
- Health check: `http://localhost:3001/healthz`

---

## Environment Variables

| Variable | Description | Default |
| :--- | :--- | :--- |
| `PORT` | Express server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgres://university:secret@localhost:5433/university` |
| `DATABASE_SSL` | Enable SSL for PostgreSQL | `false` |
| `SESSION_SECRET` | Secret key for signing session cookies | Required |
| `ADMIN_USERNAME` | Administrator login username | `admin` |
| `ADMIN_PASSWORD` | Administrator plaintext password | Required |
| `ADMIN_PASSWORD_HASH` | Pre-computed bcrypt hash (overrides password) | Optional |
| `COOKIE_SECURE` | Force secure HTTPS cookies (`true`, `false`, `auto`) | `auto` |
| `TRUST_PROXY` | Trust reverse proxy headers (e.g. Render / Nginx) | `0` |

---

## Automated Tests

Run the built-in test suite:

```bash
npm test
```

Run syntax and type validation across all server modules:

```bash
npm run check
```

---

## Security Highlights

- **SQL Injection Prevention:** 100% parameterised SQL queries through node-postgres.
- **Authentication:** Bcrypt password hashing (`cost factor 10`), server-stored sessions in PostgreSQL.
- **CSRF Defense:** Synchronizer token pattern required on all state-changing endpoints.
- **Security Headers:** Strict Content Security Policy (CSP), frameguard, and XSS filtering via Helmet.
- **File Upload Safeguards:** File size limits, extension validation, MIME type checks, and sanitized UUID filenames.
