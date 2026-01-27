# TOOLS.md - Local Notes

Skills define *how* tools work. This file is for *your* specifics — the stuff that's unique to your setup.

## What Goes Here

Things like:
- Camera names and locations
- SSH hosts and aliases  
- Preferred voices for TTS
- Speaker/room names
- Device nicknames
- Anything environment-specific

## Examples

```markdown
### Cameras
- living-room → Main area, 180° wide angle
- front-door → Entrance, motion-triggered

### SSH
- home-server → 192.168.1.100, user: admin

### TTS
- Preferred voice: "Nova" (warm, slightly British)
- Default speaker: Kitchen HomePod
```

## Database

### Superplanner (Supabase)
- **URL:** https://tytayccjnnwixunjazta.supabase.co
- **Service Role Key:** eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5dGF5Y2Nqbm53aXh1bmphenRhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2OTQ1NDEwNiwiZXhwIjoyMDg1MDMwMTA2fQ.arwgbc7NrqdU3dro6Xy1upbCS-WiNzrd41jadncCs6o
- **User ID (Anouar):** 3d683a21-3ba1-4228-919b-3b7865995d3d
- **Public Key (for read-only):** sb_publishable_gYGUDBOk_YLM4d3xh_gJuQ_0jYZMbCK

### Lisa Integration
- **Config:** `config/henry.config.js`
- **Core API:** `lib/henry/superplanner.js`
- **Pattern Matching:** `lib/henry/patterns.js`
- **Formatters:** `lib/henry/formatters.js`
- **Test Script:** `node scripts/test-henry-mvp.js`

### Context IDs (for Lisa)
- **AMP (Distriweb):** `120478ee-ef41-4214-a2ee-7be9cfd1aafe`
- **The Webmaster:** `748d9290-69c9-43d3-97d2-99076a0a2f28`
- **Smith's Agency:** `be50373f-45bb-4413-bea1-3106292630a4`
- **Wazo:** `57af9332-a3be-47c5-87a3-45df6e3d7cd8`

### SPlanner (MySQL) — Legacy
- Host: localhost
- Port: 3306 (usually)
- User: u341245456_SPlanner
- Database: u341245456_SP

## Why Separate?

Skills are shared. Your setup is yours. Keeping them apart means you can update skills without losing your notes, and share skills without leaking your infrastructure.

---

Add whatever helps you do your job. This is your cheat sheet.
