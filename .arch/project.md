# ODS Cloud (ods-signage → ods-cloud-amigo) — Architecture

**Last Updated:** February 25, 2026  
**Status:** Cloud-only — server and player extracted to standalone repos

---

## System Map

```
┌─────────────────────────────────────────────────────────────┐
│ ODS Product Family (A→Z versioning)                         │
├─────────────────────────────────────────────────────────────┤
│ ods-cloud-amigo       │ Next.js dashboard (this repo)       │
│ ods-server-archaeopteryx │ Express API backend              │
│ ods-player-atlas      │ RPi4b device OS + golden images     │
└─────────────────────────────────────────────────────────────┘
```

## Deployment

| Component | Location | URL |
|-----------|----------|-----|
| Dashboard (frontend) | Vercel CDN | https://www.ods-cloud.com |
| API (backend) | DigitalOcean `209.38.118.127` | https://api.ods-cloud.com |
| Database | Supabase (PostgreSQL + Auth) | Supabase dashboard |

## Repo Contents

```
ods-signage/
├── dashboard/       → Next.js 14 + TypeScript (Vercel-deployed)
├── resources/       → Design assets + brand
├── kbase/           → Project knowledge base
├── .arch/           → Architecture docs
├── .env.example     → Environment template
└── README.md
```

## Monorepo Separation History

| Date | Phase | Change |
|------|-------|--------|
| 2/24/26 | Phase 1 | `player/versioninfo/` → ods-player-atlas |
| 2/24/26 | Phase 2 | Removed player HTML, legacy scripts |
| 2/24/26 | Phase 3 | Removed 9.3G binary images from disk |
| 2/25/26 | Phase 4 | `server/` → ods-server-archaeopteryx |

## Related Repos

| Repo | Purpose | URL |
|------|---------|-----|
| ods-server-archaeopteryx | API backend | https://github.com/rob-jonesdevlab/ods-server-archaeopteryx |
| ods-player-os-atlas | Device OS | https://github.com/rob-jonesdevlab/ods-player-os-atlas |
