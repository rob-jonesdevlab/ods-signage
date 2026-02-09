# ODS Signage Server

Express.js API server with SQLite and Socket.io for real-time communication.

## Setup

```bash
npm install
npm run dev
```

## API Endpoints

- `GET /api/players` - List all players
- `POST /api/players` - Register new player
- `PATCH /api/players/:id` - Update player
- `GET /health` - Health check

## WebSocket Events

**Client → Server:**
- `player:register` - Register player connection
- `player:heartbeat` - Keep-alive ping

**Server → Client:**
- `player:status` - Player status change
- `player:registered` - Registration confirmation
- `player:error` - Error message
