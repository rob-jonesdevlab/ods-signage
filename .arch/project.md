# ODS Cloud Amigo — Architecture

**Last Updated:** March 1, 2026  
**Current Version:** v1-mainframe  
**Status:** Production dashboard at ods-cloud.com (Vercel)

---

## System Map

```
┌──────────────────────────────────────────────────┐
│ ODS Cloud (ods-cloud-amigo) ← YOU ARE HERE       │
│ → Next.js 14 dashboard at ods-cloud.com          │
│ → Supabase Auth + API via ods-server             │
│ → Socket.IO for real-time player status          │
│ → PlayerDetailModal with RustDesk remote viewer  │
├──────────────────────────────────────────────────┤
│ ODS Server (ods-server-archaeopteryx)            │
│ → Express.js API at api.ods-cloud.com            │
│ → All CRUD, WebSocket, and data operations       │
├──────────────────────────────────────────────────┤
│ ODS Remote Viewer (rdwc.ods-cloud.com)           │
│ → Custom lightweight RustDesk web client         │
│ → Protobuf-over-WebSocket, NaCl encryption       │
│ → Embedded in PlayerDetailModal via iframe       │
├──────────────────────────────────────────────────┤
│ ODS Relay Server (134.199.136.112)               │
│ → RustDesk s6 container (hbbs + hbbr)            │
│ → WebSocket relay on port 21118                  │
└──────────────────────────────────────────────────┘
```

## Deployment

| Component | Location | URL |
|-----------|----------|-----|
| Dashboard (frontend) | Vercel CDN | https://www.ods-cloud.com |
| API (backend) | DigitalOcean `209.38.118.127` | https://api.ods-cloud.com |
| Remote Viewer | DigitalOcean `134.199.136.112` | https://rdwc.ods-cloud.com |
| Database | Supabase (PostgreSQL + Auth) | Supabase dashboard |

## Key Pages

| Route | Page | Components |
|-------|------|------------|
| `/` | Dashboard | Stats cards, activity feed |
| `/players` | Players | Player table, `PlayerDetailModal` |
| `/content` | Content Library | File upload, folders |
| `/playlists` | Playlists | Playlist builder, scheduler |
| `/analytics` | Analytics | Charts, fleet metrics |
| `/settings/*` | Settings | Team, API, Billing, General |

## PlayerDetailModal

The modal is the primary interface for single-player management:

- **Remote Viewer Viewport** — iframe embedding ODS Remote Viewer
- **Device Info Grid** — role-based (ODS: 14 fields, User: 10 fields)
- **Action Bar** — Rename, Assign Group, Assign Playlist, Unpair, Delete

### Remote Viewer States (role-based)
1. **ODS + Connected** → Live iframe to `rdwc.ods-cloud.com/viewer.html`
2. **ODS + Not Connected** → "Connect Remote Viewer" button
3. **User (non-ODS)** → "Remote Access Configured" informational
4. **No RustDesk ID** → Online/Offline status display

## ODS Remote Viewer

Custom self-hosted web client at `rdwc.ods-cloud.com` — purpose-built for ODS Cloud.

### Tech Stack
| Layer | Technology |
|-------|-----------|
| UI | Vanilla HTML/CSS/JS + Canvas |
| Protocol | Protobuf.js (message serialization) |
| Encryption | libsodium.js (NaCl crypto_secretbox) |
| Video | FFmpeg WASM (decoder only) |
| Rendering | HTML5 Canvas / WebGL |
| Hosting | Static files on ods-relay-server Nginx |

### Connection Flow
1. WebSocket → `wss://rdwc.ods-cloud.com/websocket` (Nginx → :21118)
2. Rendezvous handshake → peer lookup by device ID
3. NaCl key exchange → encrypted session
4. Video frames (H264/VP9) → FFmpeg WASM decode → Canvas render

### Relay Server Reference
| Item | Value |
|------|-------|
| Domain | `rdwc.ods-cloud.com` |
| Reserved IP | `134.199.136.112` |
| IPv6 | `2604:a880:4:1d0:0:2:1898:c000/124` |
| RustDesk Key | `dwBt7VPSXk9D8li3cBCsdqrIAryWtfC4AD05tpeoxW0=` |
| SSH Key | `~/.ssh/id_ed25519_ods_relay_dod` |
| Docker | `rustdesk-server-s6:latest` |

## RBAC Roles

| Role | Scope |
|------|-------|
| `odsadmin` | ODS staff — full system access, View-As, all device info |
| `owner` | Organization owner — full org access |
| `admin` | Org admin — manage team, settings |
| `editor` | Content + playlist management |
| `viewer` | Read-only dashboard access |

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
| ods-player-atlas | Device OS | https://github.com/rob-jonesdevlab/ods-player-os-atlas |
