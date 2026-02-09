# ODS Digital Signage - Proof of Concept

## 🎯 What We Built

A working proof of concept for a custom digital signage platform with:

- ✅ Express.js API server with SQLite database
- ✅ Real-time WebSocket communication (Socket.io)
- ✅ Next.js dashboard with live player monitoring
- ✅ Standalone player client for testing

## 🚀 Quick Start

### 1. Start the Server

```bash
cd server
npm install
npm run dev
```

Server runs on: http://localhost:3001

### 2. Start the Dashboard

```bash
cd dashboard
npm install
npm run dev
```

Dashboard runs on: http://localhost:3000

### 3. Connect a Player

Open `player/index.html` in a browser:

```bash
open player/index.html
```

Or serve it:
```bash
cd player
python3 -m http.server 8080
# Then open http://localhost:8080
```

## 📊 Architecture

```
┌─────────────────────────────────────┐
│   Dashboard (Next.js)               │
│   http://localhost:3000             │
│   - Player list                     │
│   - Real-time status                │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   Server (Express.js)               │
│   http://localhost:3001             │
│   - REST API                        │
│   - WebSocket (Socket.io)           │
│   - SQLite database                 │
└─────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────┐
│   Player Client (HTML)              │
│   - WebSocket connection            │
│   - Status reporting                │
│   - Heartbeat                       │
└─────────────────────────────────────┘
```

## ✅ Success Criteria

- [x] Server running with SQLite
- [x] Dashboard showing player list
- [x] WebSocket real-time updates
- [x] Player can connect and register
- [x] Status updates in real-time

## 🎉 What's Next

### Phase 2: Content Management
- Upload images/videos
- Content library
- Thumbnail generation

### Phase 3: Playlists
- Create playlists
- Schedule content
- Time-based playback

### Phase 4: Player OS
- Custom Raspberry Pi image
- Plymouth boot splash
- Auto-start kiosk mode

### Phase 5: Supabase
- Cloud backup
- Real-time replication

## 📝 Notes

This is a **proof of concept** to validate the architecture. It demonstrates:

1. ✅ SQLite works great for this use case
2. ✅ Socket.io provides reliable real-time updates
3. ✅ Next.js + Tailwind makes beautiful UIs quickly
4. ✅ Architecture is simple and maintainable

**Ready to build the full MVP!** 🚀
