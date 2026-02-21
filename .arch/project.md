# ODS Digital Signage — Architecture Overview

**Last Updated:** February 19, 2026  
**Status:** Production (A+ Certified) — Phase 5 Complete

---

## System Map

```
┌─────────────────────────────────────────────────────────────┐
│                    ODS Cloud Platform                        │
├─────────────────────┬───────────────────────────────────────┤
│  ods-signage/       │  Cloud dashboard + API backend        │
│  ├── dashboard/     │  Next.js 14, TypeScript, Tailwind     │
│  ├── server/        │  Express.js, SQLite, Supabase Auth    │
│  ├── kbase/         │  Knowledge base + architecture docs   │
│  └── player/        │  Player HTML pages (pairing, link)    │
├─────────────────────┼───────────────────────────────────────┤
│  ods-player-os-atlas│  Player OS golden image pipeline      │
│  ├── scripts/       │  inject_atlas.sh, atlas_firstboot.sh  │
│  ├── public/        │  Kiosk UI (network_setup, system_cfg) │
│  ├── server.js      │  Express server (port 8080, on device)│
│  ├── brand/         │  Plymouth splash theme assets         │
│  └── .arch/         │  Architecture docs + build guide      │
└─────────────────────┴───────────────────────────────────────┘
```

## Deployment Environments

| Component | Location | URL |
|-----------|----------|-----|
| Dashboard (frontend) | Vercel CDN | https://www.ods-cloud.com |
| API (backend) | DigitalOcean `209.38.118.127` | https://api.ods-cloud.com |
| Database | Supabase (PostgreSQL + Auth) | Supabase dashboard |
| Player OS build | jdl-mini-box `10.111.123.134` | SSH access |
| Test player | ArPi5 `10.111.123.102` | `http://10.111.123.102:8080` |

## Current State

### Dashboard (ods-signage)
- **Phase 5**: Auth & multi-tenancy — ✅ complete
- **Phase 4**: Operations page interactive elements — 50% complete
- **Phase 2B**: Branding wallpaper — 33% complete
- **Stress tested**: 3-phase, A+ certified

### Player OS (ods-player-os-atlas)
- **Golden Image v5**: Built Feb 19, 2026 (1.8 GB)
- **TTY flash fix**: VT1 pre-painted black before Plymouth deactivation
- **VT lockdown**: getty masked, SysRq disabled, DontVTSwitch
- **11-step firstboot**: Fully automated provisioning

## Key Cross-References

| Topic | Location |
|-------|----------|
| System architecture report | `ods-signage/kbase/architecture/comprehensive_system_architecture_report.md` |
| Project recollection | `ods-signage/kbase/recollection.md` |
| Knowledge base index | `ods-signage/kbase/kbase_index.md` |
| Player OS architecture | `ods-player-os-atlas/.arch/project.md` |
| Boot UX pipeline | `ods-player-os-atlas/.arch/boot_ux_pipeline.md` |
| Build guide | `ods-player-os-atlas/.arch/build_guide.md` |
| Player OS README | `ods-player-os-atlas/README.md` |
