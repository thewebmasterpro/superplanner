# Changelog

All notable changes to the **Superplanner** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - v1.2.0 (Current Work)

### Added
- **V4 Gamification System**:
  - Team Rewards for team leaders (create, award, delete with dates)
  - Points, levels, and streaks system
  - Individual & team leaderboards
  - Points history with detailed tracking
  - GamificationBadge component for global display
  - Automatic points on task completion
  - 10 PocketBase collections documented for full gamification
- **Team Rewards Manager**:
  - Create rewards with name, description, points, start/end dates
  - Award rewards to team members with optional reason
  - Delete rewards with confirmation
  - View reward distribution history
  - Special purple theme for team rewards in history
- **UI/UX Polish**:
  - Pill-shaped buttons with hover zoom effect across all pages
  - Consistent styling for filter buttons (Tasks, Campaigns, Meetings, Teams)
  - Enhanced history tables with conditional row styling

### Changed
- **Service Layer**: Gamification service with comprehensive team rewards methods
- **PocketBase Schema**: Adapted API rules for PocketBase v0.20+ limitations
- **Sorting**: Use custom `created_at` field instead of system `created` field

### Fixed
- **Team Rewards**: Fixed sorting bug (`-created` → `-created_at`)
- **Date Validation**: End date must be after start date

## [1.1.0] - 2024-01-28

### Added
- **Resend Integration**:
  - Backend: Supabase Edge Function (`send-email`) for transactional emails.
  - Frontend: `ComposeEmailModal` and `useContacts` hook integration.
  - Database: Updated `tasks` table constraints to allow logging `email` activities.
- **CRM Features**: Improved contact timeline with email logging.

### Fixed
- **Database Schema**: Fixed `tasks_type_check` constraint to support 'email' and 'call' activity types.

## [1.0.0] - 2024-01-28

### Changed
- **Major Migration**: Complete transition from Hostinger (MySQL/PHP) to **Supabase** (PostgreSQL).
- **Authentication**: Replaced custom JWT auth with **Supabase Auth** (Email + Google OAuth).
- **Database**: 
  - Replaced MySQL schema with PostgreSQL.
  - Implemented **Row Level Security (RLS)** for strict data isolation.
- **Frontend**: Updated React app to use `@supabase/supabase-js`.

### Removed
- **Legacy Backend**: Deleted all PHP/Express server code (`server/` directory, `config/database.js`).
- **Legacy Scripts**: Removed old deployment and setup scripts (`build.sh`, `deploy.sh`).
- **Legacy Auth**: Removed custom `auth` middleware and routes.

### Security
- Enabled RLS on all tables (`projects`, `tasks`, `clients`, `prayer_schedule`).
- Environment variables now strictly managed via `.env` (not committed).
