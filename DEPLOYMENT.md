# Deployment Guide - Superplanner on Hostinger

## Framework Detection & Auto-Deploy

This project includes configuration files that help Hostinger automatically detect and deploy the Vite + React + Express application.

**Key Configuration Files:**
- `.hostingerapp.yaml` - Hostinger deployment configuration (framework: vite)
- `.nvmrc` - Node.js version specification (v18)
- `build.sh` - Build script for deployment
- `package.json` - Contains buildConfig metadata for framework detection

**How Hostinger Detects the Framework:**

Hostinger will automatically:
1. Detect Vite as the frontend framework via `.hostingerapp.yaml`
2. Read Node.js version from `.nvmrc` file
3. Run `npm run build` which executes `build.sh`
4. Build Vite frontend to `server/public`
5. Start Node.js server from `server/index.js` on port 3000
6. Serve static files from `server/public` and proxy API routes

**If framework is not detected:**
- Ensure `.hostingerapp.yaml` is present in root
- Check that `package.json` contains `buildConfig` section
- Verify `build` script is defined in `package.json`

## Prerequisites

- Hostinger hosting account with Node.js support
- MySQL database
- Domain: `sp.thewebmaster.pro`
- Node.js >= 18.0.0

## Step 1: Create MySQL Database on Hostinger

1. **cPanel → MySQL Databases**
2. Create new database:
   - Name: `superplanner`
3. Create new user:
   - Username: `sp_user`
   - Password: (strong password)
4. Assign user to database with ALL privileges
5. **Note credentials:**
   ```
   Host: localhost (or provided by Hostinger)
   User: sp_user
   Password: your_password
   Database: superplanner
   ```

## Step 2: Deploy via Git (Recommended)

### Option A: Hostinger Git Integration (Recommended)

1. **Hostinger Dashboard → Websites → Your Site → Git**
2. Click "Connect to GitHub"
3. Select repository: `thewebmasterpro/superplanner`
4. Set branch: `main`
5. Deployment folder: `/` (root)
6. Enable auto-deploy on push
7. **Framework Detection:**
   - Hostinger should automatically detect "Vite" as the framework
   - If not detected, click "Configure Build Settings" and set:
     - Build command: `npm run build`
     - Output directory: `server/public`
     - Install command: `npm run install:all`
8. Add environment variables in Hostinger dashboard:
   - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `PORT`, `NODE_ENV`

### Option B: Manual SSH Deploy

```bash
# SSH into Hostinger
ssh username@your.hostinger.server

# Clone repository
git clone https://github.com/thewebmasterpro/superplanner.git
cd superplanner

# Create .env file
cat > .env << EOF
DB_HOST=localhost
DB_USER=sp_user
DB_PASSWORD=your_password
DB_NAME=superplanner
DB_PORT=3306
NODE_ENV=production
PORT=3000
EOF

# Install dependencies
npm install
cd client && npm install && cd ../server && npm install && cd ..

# Build frontend
npm run build:client

# Setup database
npm run setup-db

# Start application
npm start
```

## Step 3: Configure Domain

### In Hostinger:

1. **Domains → Manage Domain**
2. Point `sp.thewebmaster.pro` to your application
3. Setup SSL certificate (automatic with Hostinger)
4. Configure DNS if needed

### In Hostinger Application:

1. Set application root to `/server/public` (Vite build output)
2. Configure proxy to Node.js port 3000

## Step 4: Setup Process Manager (Important!)

For production, use a process manager to keep Node.js running:

### Using PM2:

```bash
npm install -g pm2

# Create app configuration
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'superplanner',
    script: './server/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

## Step 5: Verify Deployment

```bash
# Check API is running
curl https://sp.thewebmaster.pro/api/health

# Should return:
# {"status":"healthy","timestamp":"...","uptime":...}

# Check tasks endpoint
curl https://sp.thewebmaster.pro/api/tasks

# Should return: []
```

## Step 6: Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:3306
```

Solutions:
- Verify `.env` credentials match cPanel database
- Check if MySQL is running on Hostinger
- Use `DB_HOST` provided by Hostinger (might not be localhost)

### Port Already in Use

```bash
# Check what's using port 3000
lsof -i :3000

# Kill process if needed
kill -9 <PID>
```

### Vite Build Failed

```bash
# Rebuild frontend
cd client
npm install
npm run build
cd ..
```

### Application Won't Start

```bash
# Check logs
pm2 logs superplanner

# Or directly
node server/index.js
```

## Step 7: Monitoring & Maintenance

```bash
# Monitor app with PM2
pm2 monit

# View logs
pm2 logs superplanner --lines 100

# Restart app
pm2 restart superplanner

# Update code and restart
git pull
npm install
cd client && npm install && npm run build && cd ..
pm2 restart superplanner
```

## Deployment Checklist

- [ ] MySQL database created on Hostinger
- [ ] `.env` file configured with DB credentials
- [ ] Repository cloned or deployed via Git
- [ ] `npm install` executed in root, client, and server
- [ ] `npm run build:client` completed successfully
- [ ] `npm run setup-db` created tables
- [ ] Application started with `npm start` or PM2
- [ ] Domain `sp.thewebmaster.pro` pointing to app
- [ ] SSL certificate active
- [ ] `/api/health` endpoint responding
- [ ] Process manager (PM2) configured for production

## Useful Commands

```bash
# View app status
npm run dev              # Development with hot reload
npm run build            # Build frontend + dependencies
npm start                # Start production server
npm run setup-db         # Initialize database
```

## Support

For issues:
1. Check Hostinger logs: cPanel → Logs
2. Test database connection: SSH and run `mysql -u sp_user -p superplanner`
3. Check Node.js version: `node -v` (requires >= 18.0.0)
4. Review `.env` file permissions: should be readable by Node.js process
