# Kbase Index

**Master navigation for ODS Cloud knowledge base**  
**Format:** Thing : Description : Location  
**Last Updated:** February 10, 2026

---

## 📁 Quick Navigation

### By Purpose
- **Architecture Docs** → `/kbase/docs/architecture/`
- **Deployment Guides** → `/kbase/docs/deployment/`
- **Development Guides** → `/kbase/docs/development/`
- **API Reference** → `/kbase/docs/reference/`
- **Current Artifacts** → `/kbase/artifacts/current/`
- **Archive** → `/kbase/artifacts/archive/`

### By Component
- **Dashboard** → `/kbase/docs/architecture/dashboard.md`
- **Server** → `/kbase/docs/architecture/server.md`
- **Player OS** → `/kbase/docs/architecture/player-os.md`
- **Database** → `/kbase/docs/reference/database-schema.md`

---

## 🏗️ Architecture Documentation

### System Overview
- system-overview.md : Complete architecture documentation : `/kbase/docs/architecture/`

### Component Details
- dashboard.md : Next.js dashboard architecture : `/kbase/docs/architecture/` (TODO)
- server.md : Express.js server architecture : `/kbase/docs/architecture/` (TODO)
- player-os.md : Raspberry Pi player OS : `/kbase/docs/architecture/` (TODO)

---

## 📚 Reference Documentation

### Access & Credentials
- ssh-access.md : SSH credentials and commands : `/kbase/docs/reference/`

### API Documentation
- api-reference.md : REST API endpoints : `/kbase/docs/reference/` (TODO)
- websocket-events.md : WebSocket event reference : `/kbase/docs/reference/` (TODO)

### Database
- database-schema.md : Supabase and SQLite schemas : `/kbase/docs/reference/` (TODO)

---

## 🚀 Deployment Guides

### Production
- production.md : Production deployment guide : `/kbase/docs/deployment/` (TODO)
- environment.md : Environment configuration : `/kbase/docs/deployment/` (TODO)

### Development
- dev-device.md : Dev device setup guide : `/kbase/docs/deployment/` (TODO)
- local-development.md : Local development setup : `/kbase/docs/deployment/` (TODO)

---

## 💻 Development Guides

### Getting Started
- getting-started.md : Quick start for developers : `/kbase/docs/development/` (TODO)
- code-style.md : Code style and conventions : `/kbase/docs/development/` (TODO)

### Component Development
- dashboard-development.md : Dashboard development guide : `/kbase/docs/development/` (TODO)
- server-development.md : Server development guide : `/kbase/docs/development/` (TODO)

---

## 📦 Current Artifacts

### Dashboard
- Settings Pages : Complete settings implementation : `/kbase/artifacts/current/dashboard/settings/`
  - Profile, Security, Notifications, Team, Billing, API
- Authentication : Supabase auth integration : `/kbase/artifacts/current/dashboard/auth/`

### Server
- Pairing System : Device pairing implementation : `/kbase/artifacts/current/server/pairing/`
- API Routes : REST API endpoints : `/kbase/artifacts/current/server/api/`

### Player
- Pairing Screen : Dark-themed pairing interface : `/kbase/artifacts/current/player/pairing/`
- Boot Splash : Plymouth boot screen : `/kbase/artifacts/current/player/boot/`

### Deployment
- SSH Scripts : Deployment automation : `/kbase/artifacts/current/deployment/`
- Migration Scripts : Database migrations : `/kbase/artifacts/current/deployment/migrations/`

---

## 🗂️ Archive

### 2026-02-09
- Initial kbase structure created
- System overview documentation
- SSH access reference

---

## 🔗 External Resources

### Production URLs
- Dashboard : https://ods-cloud.com
- Server API : http://209.38.118.127:3001
- Dev Device : http://10.111.123.101

### Repositories
- Main Repo : https://github.com/rob-jonesdevlab/ods-signage
- Documentation : This kbase directory

### Services
- Supabase : https://dimcecmdkoaxakknftwg.supabase.co
- Vercel : https://vercel.com/rob-jonesdevlab/ods-signage

---

## 🎯 Common Tasks

### Find SSH Credentials
1. Navigate to `/kbase/docs/reference/ssh-access.md`
2. Dev device: `root@10.111.123.101` (password: `0d52o26!`)
3. SSH key: `~/.ssh/id_ed25519_rpi5`

### Deploy to Dev Device
```bash
scp -i ~/.ssh/id_ed25519_rpi5 player/pairing.html \
  root@10.111.123.101:/home/signage/ODS/webgui/pairing.html
```

### Access Production Server
```bash
ssh root@209.38.118.127
cd /root/ods-server
pm2 logs ods-server
```

### Run Database Migrations
1. Navigate to `/server/migrations/`
2. Open Supabase SQL Editor
3. Run migration scripts in order

---

## 📊 Statistics

**Total Documentation Files:** 3
- Architecture: 1
- Reference: 1
- README: 1

**Components:**
- Dashboard (Next.js)
- Server (Express.js)
- Player OS (Raspberry Pi 5)

**Deployment Targets:**
- Production: Vercel + DigitalOcean
- Development: Local + Dev Device (10.111.123.101)

---

## 🔄 Maintenance

### Adding New Documentation
1. Create file in appropriate `/kbase/docs/` subdirectory
2. Follow existing documentation patterns
3. Update this index with new entry
4. Commit with descriptive message

### Archiving
1. Copy current artifacts to `/kbase/artifacts/archive/YYYY-MM-DD/`
2. Update `/kbase/artifacts/current/` with new versions
3. Document changes in this index

### Updating Credentials
1. Update `/kbase/docs/reference/ssh-access.md`
2. Never commit passwords to git (use .env files)
3. Update this index if file locations change

---

**Last Updated:** February 9, 2026  
**Created By:** Development Team  
**Purpose:** Master navigation for ODS Cloud knowledge base  
**Files Indexed:** 3 (growing)

---

**ODS Cloud - Digital Signage Platform** 🎨✨
