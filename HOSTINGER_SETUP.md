# Hostinger Deployment Setup

## Framework Detection

Hostinger **should now automatically detect Vite** when you connect this repository.

### What Changed

1. **Added Vite to root `package.json` dependencies**
   - `vite` and `@vitejs/plugin-react` are in `dependencies` (not devDependencies)
   - **Why?** Hostinger uses `npm install --production` which ignores devDependencies
   - Vite is needed to build the frontend in production, so it must be in dependencies
   - This allows Hostinger to recognize this as a Vite project and execute builds

2. **Created `vite.config.js` at root**
   - Configures Vite to build from `client/` folder
   - Outputs to `server/public/` for Express to serve

3. **Simplified build scripts**
   - `npm run build` now runs Vite build directly from root
   - Hostinger can execute standard Vite commands

## Hostinger Configuration

When connecting to GitHub on Hostinger:

### Framework Settings
- **Framework:** Should auto-detect as "Vite" ✅
- **Node.js version:** 18.x (from `.nvmrc`)

### Build Settings (if not auto-configured)
- **Build command:** `npm run build`
- **Output directory:** `server/public`
- **Install command:** `npm install`

### Runtime Settings
- **Start command:** `npm start`
- **Port:** 3000 (Express server)

### Environment Variables (Required)
Add these in Hostinger dashboard:
```
DB_HOST=localhost
DB_USER=sp_user
DB_PASSWORD=your_db_password
DB_NAME=superplanner
DB_PORT=3306
PORT=3000
NODE_ENV=production
```

## Project Structure

```
superplanner/
├── vite.config.js          # Vite config at root (for framework detection)
├── package.json            # Contains Vite dependencies
├── .nvmrc                  # Node.js version (18)
├── client/                 # React frontend source
│   ├── src/
│   ├── index.html
│   └── vite.config.js      # Original client config
├── server/                 # Express backend
│   ├── index.js            # Entry point
│   ├── routes/
│   ├── config/
│   └── public/             # ← Vite build output goes here
└── build.sh                # Build script
```

## How It Works

1. **Build Process:**
   - `npm install` installs all dependencies
   - `npm run build` runs Vite build
   - Vite compiles React app from `client/` to `server/public/`

2. **Runtime:**
   - `npm start` runs Express server (`server/index.js`)
   - Express serves static files from `server/public/`
   - Express handles API routes (`/api/*`)
   - Frontend makes API calls to same origin

## Troubleshooting

### "vite: command not found" Error
This means Vite wasn't installed. Check:
1. Vite is in `dependencies` (not devDependencies) in root `package.json`
2. `npm install` completed successfully
3. Hostinger isn't using `--production` flag incorrectly

### "Framework not supported"
If Hostinger still doesn't detect Vite:
1. Ensure you've pushed the latest changes to GitHub
2. Refresh the GitHub connection in Hostinger
3. Check that `package.json` contains `vite` in **dependencies**
4. Manually set build settings as shown above

### Build Fails
- Check Hostinger build logs for specific errors
- Ensure all dependencies are in `package.json` dependencies
- Verify Node.js version is 18.x
- Check that `client/` and `server/` folders exist

### Database Connection Issues
- Verify database credentials in Hostinger environment variables
- Check that MySQL database is created in cPanel
- Run `npm run setup-db` via Hostinger terminal to create tables

## First Deployment Checklist

- [ ] Push latest code to GitHub (includes vite.config.js)
- [ ] Connect repository in Hostinger Git integration
- [ ] Verify framework detected as "Vite"
- [ ] Add all environment variables
- [ ] Create MySQL database in cPanel
- [ ] Deploy and check build logs
- [ ] After successful build, run `npm run setup-db` to initialize database
- [ ] Verify app is running at your domain

## Need Manual Configuration?

If auto-detection fails, use these exact settings:

**Package Manager:** npm
**Build Command:** `npm run build`
**Output Directory:** `server/public`
**Install Command:** `npm install`
**Start Command:** `npm start`
**Node Version:** 18
