# Changelog

All notable changes to the **Superplanner** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased] - v1.1.0 (Current Work)

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
