# Deployment Guide - Superplanner

## Hostinger Setup

### 1. Create MySQL Database

1. Go to Hostinger cPanel → MySQL Databases
2. Create a new database named `superplanner`
3. Create a new user (ex: `sp_user`)
4. Set a password
5. Give user all privileges on the database
6. Note the credentials:
   - **Host:** localhost (or your Hostinger DB host)
   - **User:** sp_user
   - **Password:** your_password
   - **Database:** superplanner

### 2. Environment Variables

Create `.env` file in root with:

```env
DB_HOST=localhost
DB_USER=sp_user
DB_PASSWORD=your_password
DB_NAME=superplanner
DB_PORT=3306
NODE_ENV=production
PORT=3000
NEXT_PUBLIC_API_URL=https://sp.thewebmaster.pro/api
```

### 3. Deploy via Git

Option A: Direct Git Clone
```bash
git clone https://github.com/thewebmasterpro/superplanner.git
cd superplanner
npm install
npm run setup-db    # Creates tables
npm start           # Starts server
```

Option B: Hostinger Git Integration (Recommended)
1. In Hostinger: Setup → Git Repositories → Connect to GitHub
2. Select `thewebmasterpro/superplanner`
3. Set deployment branch: `main`
4. Configure webhook
5. Create `.env` file on server with DB credentials

### 4. Create Domain

1. Hostinger → Domains
2. Point `sp.thewebmaster.pro` to your application
3. Set SSL certificate (auto with Hostinger)

### 5. Run Application

```bash
npm install
npm run setup-db    # One-time: setup database
npm start           # Start server
```

Server will run on port 3000 and listen on 0.0.0.0

### 6. Test

```bash
curl https://sp.thewebmaster.pro/api/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

## API Endpoints

- `GET /api` - API info
- `GET /api/health` - Health check
- `GET /api/tasks` - List all tasks
- `POST /api/tasks` - Create new task

## Database Schema

- **projects** - Project/work categories
- **tasks** - Individual tasks with status, frequency, dates
- **clients** - Client/contact information
- **prayer_schedule** - Daily prayer times

## Troubleshooting

### Database Connection Error
- Check `.env` file has correct DB credentials
- Verify MySQL user has privileges on database
- Ensure DB host is reachable

### Port Error
- Check if port 3000 is available
- Set `PORT` env variable to different port
- On Hostinger, port is usually auto-configured

### Deployment Issues
- Check Hostinger logs: cPanel → Logs
- Verify Node.js version: `node -v` (needs >= 14.0.0)
- Run `npm install` after deploying
