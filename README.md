# Superplanner

Task Management & CRM for Small Business with Prayer Schedule Integration

## Tech Stack

- **Frontend:** Vite + React
- **Backend:** Express.js + Node.js
- **Database:** MySQL
- **Deployment:** Hostinger

## Quick Start

### Development

```bash
# Install dependencies
npm install
cd client && npm install && cd ../server && npm install && cd ..

# Setup database (one time)
npm run setup-db

# Start dev servers (Vite + Express with hot reload)
npm run dev
```

Server runs on `http://localhost:3000`
Client runs on `http://localhost:5173` (proxied to server)

### Production

```bash
# Build Vite frontend
npm run build:client

# Start server
npm start
```

Frontend is served from `/server/public`

## Project Structure

```
superplanner/
├─ client/                  # Vite + React frontend
│  ├─ src/
│  │  ├─ App.jsx
│  │  ├─ App.css
│  │  └─ main.jsx
│  ├─ index.html
│  ├─ vite.config.js
│  └─ package.json
├─ server/                  # Express API backend
│  ├─ index.js
│  ├─ routes/
│  │  ├─ tasks.js
│  │  └─ health.js
│  ├─ config/
│  │  └─ database.js
│  ├─ scripts/
│  │  └─ setup-db.js
│  └─ package.json
├─ package.json
├─ .env.example
└─ README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api` | API info |
| GET | `/api/health` | Health check |
| GET | `/api/tasks` | List all tasks |
| GET | `/api/tasks/:id` | Get task by ID |
| POST | `/api/tasks` | Create new task |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Database Schema

### projects
- id, name, slug, created_at, updated_at

### tasks
- id, project_id, title, description, status, frequency, priority, due_date, created_at, updated_at

### clients
- id, name, email, phone, notes, created_at, updated_at

### prayer_schedule
- id, date, fajr, dhuhr, asr, maghrib, isha, created_at

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for Hostinger setup instructions.

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```env
DB_HOST=localhost
DB_USER=sp_user
DB_PASSWORD=your_password
DB_NAME=superplanner
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

## Author

Anouar - Thewebmaster.pro
