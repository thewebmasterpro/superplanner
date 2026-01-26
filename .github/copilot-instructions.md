# Copilot Instructions for Superplanner

## Architecture Overview

Superplanner is a **monorepo with split frontend/backend architecture**:
- **Frontend:** Vite + React in `client/` (SPA, built to `server/public`)
- **Backend:** Express.js API in `server/` (ES modules, port 3000)
- **Database:** MySQL with pool-based connections
- **Authentication:** JWT tokens + API keys (both via `Authorization: Bearer` header)

**Key insight:** Development runs both servers concurrently (`npm run dev`), but production bundles the React build into the Express server's static directory.

## Critical Development Workflows

### Setup & Installation
```bash
npm install
npm run install:all           # Install root + client + server dependencies
npm run setup-db              # Initialize MySQL schema (scripts/setup-db.js)
```

### Development
```bash
npm run dev                   # Run Vite (5173) + Express (3000) concurrently
npm run dev:server            # Express only with --watch for hot reload
npm run dev:client            # Vite only
```

### Production Build & Deploy
```bash
npm run build:client          # Vite builds to server/public
npm start                     # Start Express on port 3000 (serves built client)
npm run setup-db              # Must run once on new MySQL database
```

**Critical:** Vite output directory is hardcoded to `server/public` for Express to serve it. Do not change this without updating both configs.

## Project-Specific Patterns & Conventions

### 1. Database Connection Pattern (MySQL2 Promise Pool)
All database operations use connection pooling with explicit try-finally blocks:
```javascript
let connection
try {
  connection = await pool.getConnection()
  const [rows] = await connection.query('SELECT * FROM table WHERE id = ?', [id])
  // Always destructure arrays from query results
} finally {
  if (connection) connection.release()
}
```
**Why:** Connection pool management prevents connection leaks; always release in finally block. Queries return arrays `[rows, fields]`.

### 2. Authentication & Authorization
- **Public routes:** `/api/auth/*` and `/api/health` (no auth)
- **Protected routes:** `/api/tasks` requires `authenticate` middleware
- **Auth methods:** Both JWT (users) and API keys (bots) supported
  - Header format: `Authorization: Bearer <jwt_token_or_api_key>`
  - API keys start with `sk_` prefix and are hashed in database
- **Token persistence:** React stores token + user in localStorage; axios interceptor auto-attaches token to all requests

**Key file:** [server/middleware/auth.js](server/middleware/auth.js) handles both JWT and API key verification.

### 3. API Response Format
Express routes follow consistent patterns:
- **Success:** `res.json(data)` with appropriate status code (200, 201)
- **Error:** `res.status(code).json({ error: 'message' })`
- **Validation:** Check required fields early; return 400 before DB operations
- **All task fields:** `project_id, title, description, status, frequency, priority, due_date` (defaults applied in POST/PUT)

See [server/routes/tasks.js](server/routes/tasks.js) for full pattern examples.

### 4. React Client State & Data Flow
- **Authentication state:** Stored in localStorage (token + user object)
- **API client:** Uses axios with request interceptor to auto-add Authorization header
- **Component pattern:** Login checks token existence; redirects unauthenticated users to Login component
- **Error handling:** 401 response triggers logout and redirect to login

See [client/src/App.jsx](client/src/App.jsx) for client architecture.

### 5. Environment Variables & Configuration
- **Root level:** `.env` file (NOT in repo—create from `.env.example`)
- **Critical vars:** `DB_HOST, DB_USER, DB_PASSWORD, DB_NAME, JWT_SECRET, PORT`
- **Default values:** Hardcoded in code (e.g., port 3000, localhost DB)—only override with `.env`
- **File:** [server/config/database.js](server/config/database.js) reads from process.env

## Integration Points & Dependencies

### External APIs
- None currently; all functionality is self-contained

### Database Tables
- **tasks:** Core domain model (project_id, title, status, frequency, priority, due_date)
- **projects, clients, prayer_schedule:** Defined in schema but routes not yet implemented
- **api_keys:** Stores hashed API keys for bot authentication

### Key Files & Their Responsibilities
| File | Purpose |
|------|---------|
| [server/index.js](server/index.js) | Express app setup, middleware, static file serving, route mounting |
| [server/routes/tasks.js](server/routes/tasks.js) | Task CRUD operations (protected by auth) |
| [server/config/database.js](server/config/database.js) | MySQL pool initialization from env vars |
| [server/middleware/auth.js](server/middleware/auth.js) | JWT + API key authentication |
| [client/src/App.jsx](client/src/App.jsx) | Main React app, auth state, task loading, logout |
| [client/src/components/Login.jsx](client/src/components/Login.jsx) | Login form, JWT token exchange |
| [vite.config.js](vite.config.js) (root) | Proxy setup: `/api` → `http://localhost:3000/api` |

## When Adding Features

1. **New API routes:** Add to `server/routes/`, mount in [server/index.js](server/index.js), use `authenticate` middleware if protected
2. **Database changes:** Update schema in [server/scripts/setup-db.js](server/scripts/setup-db.js); connection pattern in all queries
3. **React components:** Place in `client/src/components/`, use axios for API calls, store auth token in localStorage
4. **Environment config:** Add to `.env`, read via `process.env` in server code
5. **Build output:** Ensure Vite builds to `server/public` (configured in root [vite.config.js](vite.config.js))

## Deployment & Hosting

- **Hostinger:** Auto-detects Vite + Express via `.hostingerapp.yaml` and buildConfig in package.json
- **Build command:** `npm run build` → runs `build.sh` → builds client, keeps server
- **Server start:** `npm start` → Node runs [server/index.js](server/index.js) on port 3000
- **Static serving:** Express serves Vite output from `server/public`
- See [DEPLOYMENT.md](DEPLOYMENT.md) for full Hostinger setup (MySQL credentials, domain config, environment variables)

## Debugging Tips

- **Frontend not loading:** Check if `npm run build:client` was run; verify `server/public/index.html` exists
- **API 401 errors:** Token missing/expired; check localStorage for `auth_token` and `user`
- **DB connection failures:** Verify `.env` has correct `DB_HOST, DB_USER, DB_PASSWORD`; confirm MySQL server running locally or on Hostinger
- **CORS errors:** Check [server/index.js](server/index.js) line with `cors()` middleware; ensure frontend URL is allowed
