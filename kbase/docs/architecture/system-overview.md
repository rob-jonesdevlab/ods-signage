# ODS Cloud - System Architecture Overview

**Comprehensive architecture documentation for the ODS Digital Signage platform**

Last Updated: February 10, 2026

---

## System Overview

ODS Cloud is a full-stack digital signage platform consisting of three main components:

```
┌─────────────────────────────────────────┐
│     Dashboard (Next.js + Supabase)      │
│     https://ods-cloud.com               │
│     - Player management                 │
│     - Player Groups (drag-and-drop)     │
│     - Content library                   │
│     - User settings                     │
│     - Real-time monitoring              │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Server (Express.js + Socket.io)     │
│     http://209.38.118.127:3001          │
│     - REST API                          │
│     - WebSocket server                  │
│     - Pairing system                    │
│     - Device management                 │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│     Player OS (Raspberry Pi 5)          │
│     Custom Debian-based OS              │
│     - Chromium kiosk mode               │
│     - Auto-pairing workflow             │
│     - Content playback                  │
│     - Status reporting                  │
└─────────────────────────────────────────┘
```

---

## Component Details

### 1. Dashboard (Next.js)

**Technology Stack:**
- Next.js 14.1.0
- React 18
- TypeScript
- Tailwind CSS
- Supabase (Auth + Database)
- Socket.io Client

**Key Features:**
- User authentication (Supabase Auth)
- Player management and monitoring
- Content library with drag-and-drop
- Settings pages (Profile, Security, Team, Billing, API)
- Real-time player status updates

**Deployment:**
- Platform: Vercel
- URL: https://ods-cloud.com
- Auto-deploy from `main` branch

**Directory Structure:**
```
dashboard/
├── app/                    # Next.js app directory
│   ├── (auth)/            # Auth pages (login, signup)
│   ├── dashboard/         # Main dashboard
│   ├── players/           # Player management
│   ├── content/           # Content library
│   └── settings/          # Settings pages
├── components/            # Reusable components
├── contexts/              # React contexts (Auth, etc)
├── hooks/                 # Custom React hooks
└── lib/                   # Utilities and API clients
```

---

### 2. Server (Express.js)

**Technology Stack:**
- Express.js
- Socket.io
- SQLite (local database)
- Sharp (image processing)
- Multer (file uploads)

**Key Features:**
- REST API for player management
- WebSocket server for real-time communication
- Device pairing system with QR codes
- File upload and storage
- Player heartbeat monitoring

**Deployment:**
- Platform: DigitalOcean Droplet
- IP: 209.38.118.127
- Port: 3001
- Process Manager: PM2

**API Endpoints:**
```
POST   /api/pairing/generate     # Generate pairing code
GET    /api/pairing/status/:uuid # Check pairing status
POST   /api/pairing/complete     # Complete pairing
GET    /api/players              # List all players
POST   /api/players              # Register new player
GET    /api/players/:id          # Get player details
PUT    /api/players/:id          # Update player
DELETE /api/players/:id          # Delete player
GET    /api/player-groups        # List all player groups
POST   /api/player-groups        # Create new player group
GET    /api/player-groups/:id    # Get player group details
PUT    /api/player-groups/:id    # Update player group
DELETE /api/player-groups/:id    # Delete player group
POST   /api/player-groups/:id/assign-players  # Assign players to group
POST   /api/player-groups/:id/deploy          # Deploy playlist to group
```

**Directory Structure:**
```
server/
├── index.js               # Main server file
├── routes/                # API routes
├── migrations/            # Database migrations
├── uploads/               # Uploaded files
└── database.sqlite        # SQLite database
```

---

### 3. Player OS (Raspberry Pi 5)

**Hardware:**
- Raspberry Pi 5 (8GB RAM)
- MicroSD Card (64GB+)
- HDMI Display
- Ethernet connection

**Software Stack:**
- Debian 12 (Bookworm)
- Chromium Browser (kiosk mode)
- Plymouth (boot splash)
- Custom pairing web interface

**Key Features:**
- Auto-boot to pairing screen
- QR code-based device registration
- Chromium kiosk mode for content playback
- Persistent device UUID
- Network status monitoring

**File Locations:**
- Web GUI: `/home/signage/ODS/webgui/`
- Pairing Screen: `/home/signage/ODS/webgui/pairing.html`
- Device UUID: `/boot/device_uuid.txt`
- Scripts: `/usr/local/bin/`

**Network:**
- IP: 10.111.123.101 (dev device)
- Subnet: 10.111.123.x
- Interface: Ethernet (en9)

---

## Database Schema

### Supabase (Production)

**Tables:**
- `profiles` - User profiles and organization membership
- `organizations` - Organization details
- `players` - Registered digital signage players
- `content` - Content library items
- `playlists` - Content playlists
- `team_invitations` - Pending team invitations
- `subscriptions` - Billing subscriptions
- `invoices` - Billing history
- `api_keys` - API access keys

### SQLite (Server)

**Tables:**
- `players` - Player registration and status
- `pairing_codes` - Active pairing codes
- `content` - Uploaded content metadata

---

## Authentication Flow

1. User visits https://ods-cloud.com
2. Redirected to `/login` if not authenticated
3. Supabase Auth handles login/signup
4. JWT token stored in cookies
5. Dashboard loads with user profile
6. API calls include JWT for authorization

---

## Device Pairing Flow

1. **Player boots** → Shows pairing screen
2. **Generate code** → Player calls `/api/pairing/generate`
3. **Display QR** → QR code + 6-digit code shown
4. **User scans** → Opens `ods-cloud.com/pair?code=XXXXXX`
5. **User logs in** → Authenticates with Supabase
6. **Complete pairing** → Dashboard calls `/api/pairing/complete`
7. **WebSocket notify** → Server notifies player via Socket.io
8. **Player redirects** → Player loads content playback interface

---

## Real-Time Communication

**WebSocket Events:**
- `player:connect` - Player connects to server
- `player:disconnect` - Player disconnects
- `player:heartbeat` - Player sends status update
- `pairing:success` - Pairing completed
- `content:update` - Content library changed
- `playlist:update` - Playlist modified

---

## Deployment Workflow

### Dashboard
```bash
# Automatic deployment via Vercel
git push origin main
# Vercel auto-builds and deploys
```

### Server
```bash
# SSH to server
ssh root@209.38.118.127

# Pull latest code
cd /root/ods-server
git pull

# Restart service
pm2 restart ods-server
```

### Player OS
```bash
# Deploy pairing screen
scp -i ~/.ssh/id_ed25519_rpi5 player/pairing.html \
  root@10.111.123.101:/home/signage/ODS/webgui/pairing.html

# Reboot device
ssh -i ~/.ssh/id_ed25519_rpi5 root@10.111.123.101 'reboot'
```

---

## Environment Variables

### Dashboard (.env.local)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dimcecmdkoaxakknftwg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_API_URL=http://209.38.118.127:3001
```

### Server (.env)
```bash
PORT=3001
DATABASE_PATH=./database.sqlite
UPLOAD_DIR=./uploads
```

---

## Security

### Authentication
- Supabase Auth with JWT tokens
- Row Level Security (RLS) on all tables
- Session management with refresh tokens

### API Security
- CORS enabled for dashboard domain
- Rate limiting on pairing endpoints
- Input validation on all endpoints

### Device Security
- Unique device UUIDs
- Time-limited pairing codes (5 minutes)
- One-time use pairing codes

---

## Monitoring

### Dashboard
- Vercel Analytics
- Error tracking via browser console
- Real-time player status

### Server
- PM2 process monitoring
- Log files in `/root/ods-server/logs/`
- Health check endpoint: `/health`

### Player
- Heartbeat every 30 seconds
- Network status monitoring
- Boot splash screen for visual feedback

---

## Future Enhancements

### Phase 1 (Current)
- ✅ Basic player management
- ✅ Device pairing workflow
- ✅ User authentication
- ✅ Settings pages

### Phase 2 (Next)
- Content upload and management
- Playlist creation
- Scheduled content playback
- Player grouping

### Phase 3 (Future)
- Advanced analytics
- Multi-organization support
- Custom branding
- Mobile app

---

**Last Updated**: February 9, 2026  
**Maintained By**: Development Team  
**Version**: 1.0.0
