# ODS Cloud - Digital Signage Platform

[![Production Status](https://img.shields.io/badge/Production-Live-brightgreen)]()
[![Security Grade](https://img.shields.io/badge/Security-A+-blue)]()
[![Certification](https://img.shields.io/badge/Certified-Production%20Ready-success)]()

**Enterprise-grade, multi-tenant digital signage platform for managing content, playlists, and displays across distributed networks.**

---

## 🎯 Quick Start

### Prerequisites
- Node.js 18.x or higher
- npm or yarn
- Supabase account (for authentication)
- DigitalOcean or similar VPS (for production)

### Development Setup

```bash
# Clone repository
git clone https://github.com/your-org/ods-signage.git
cd ods-signage

# Install dependencies
npm install --prefix server
npm install --prefix dashboard

# Configure environment
cp server/.env.example server/.env
cp dashboard/.env.local.example dashboard/.env.local

# Start development servers
npm run dev --prefix server      # API on :3001
npm run dev --prefix dashboard   # Dashboard on :3000
```

### Production Status
- ✅ **Live:** https://api.ods-cloud.com
- ✅ **Uptime:** 99.9% with auto-recovery
- ✅ **Security:** A+ grade (comprehensive testing)
- ✅ **Monitoring:** Health checks every 5 minutes
- ✅ **Backups:** Daily automated with 30-day retention

---

## 📚 Documentation

### Architecture & Design
- **[Comprehensive System Architecture Report](./kbase/architecture/comprehensive_system_architecture_report.md)** - Complete tech stack, architecture patterns, security implementations
- **[API Documentation](./server/README.md)** - REST API endpoints and WebSocket events
- **[Dashboard Guide](./dashboard/README.md)** - Frontend architecture and components

### Testing & Quality Assurance
- **[Phase 1: System Stress Test](./kbase/testing/system_stress_test_report.md)** - Foundation testing and code quality
- **[Phase 2: Security Deep Dive](./kbase/testing/advanced_stress_test_phase2_report.md)** - Production security vulnerabilities
- **[Phase 3: Final Validation](./kbase/testing/phase3_final_validation_certification.md)** - Production readiness certification
- **[Security Remediation](./kbase/security/security_remediation_complete.md)** - All vulnerability fixes

### Operational Guides
- **[Infrastructure Hardening](./kbase/operations/quick_win_infrastructure_hardening.md)** - Backups, monitoring, security headers
- **[Deployment Guide](./kbase/operations/deployment_guide.md)** - Production deployment procedures
- **[Monitoring & Alerts](./kbase/operations/monitoring_guide.md)** - Health checks and automated recovery

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────────┐         ┌─────────────────────────┐  │
│  │ Next.js Dashboard│         │ Raspberry Pi Players     │  │
│  │  (Vercel CDN)   │         │  (HDMI Displays)        │  │
│  └────────┬─────────┘         └──────────┬──────────────┘  │
└───────────┼────────────────────────────────┼─────────────────┘
            │                                 │
            │         HTTPS + WebSocket       │
            ▼                                 ▼
    ┌───────────────────────────────────────────────┐
    │          Nginx Reverse Proxy (SSL)            │
    │    X-Frame, HSTS, CSP, Rate Limiting         │
    └──────────────────┬────────────────────────────┘
                       │
            ┌──────────┴──────────┐
            │                     │
         ┌──▼─────────┐    ┌─────▼──────┐
         │ Express API│    │ Socket.IO  │
         │  (Port 3001)│    │ WebSockets │
         └──────┬─────┘    └─────┬──────┘
                │                 │
         ┌──────┴────────────────┴───────┐
         │      Data & Storage Layer      │
         │  ┌─────────┐  ┌──────────────┐│
         │  │ SQLite  │  │  Supabase    ││
         │  │  (92KB) │  │  (Auth)      ││
         │  └─────────┘  └──────────────┘│
         │  ┌──────────────────────────┐ │
         │  │  File System Storage     │ │
         │  │  (Images/Videos)         │ │
         │  └──────────────────────────┘ │
         └────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Backend
- **Runtime:** Node.js 18.19.1
- **Framework:** Express.js 4.18.2
- **Database:** SQLite (better-sqlite3)
- **Authentication:** Supabase 2.95.3
- **WebSockets:** Socket.IO 4.6.1
- **Media Processing:** Sharp 0.34.5, fluent-ffmpeg 2.1.3
- **Security:** express-rate-limit, CORS, JWT

### Frontend
- **Framework:** Next.js 14.1.0
- **Language:** TypeScript 5.x
- **Styling:** Tailwind CSS 3.3.0
- **State:** Zustand 5.0.11
- **Forms:** react-hook-form 7.71.1 + Zod
- **Security:** isomorphic-dompurify (XSS protection)

### Infrastructure
- **API Hosting:** DigitalOcean Ubuntu 24.04
- **Frontend Hosting:** Vercel Edge CDN
- **Reverse Proxy:** Nginx 1.24.0
- **Process Manager:** systemd
- **SSL/TLS:** Let's Encrypt
- **Monitoring:** Custom health checks (5min)
- **Backups:** Automated daily with compression

---

## 🔒 Security Features

### ✅ Comprehensive Security (A+ Grade)
- **Authentication:** JWT with Supabase custom claims
- **Rate Limiting:** 3-tier protection (API/Auth/Uploads)
- **CORS:** Whitelist-based origin control
- **XSS Protection:** DOMPurify sanitization
- **SQL Injection:** 100% prepared statements
- **HTTPS Only:** HSTS enforced (1 year)
- **Security Headers:** 6 enterprise-grade headers
- **Organization Isolation:** Every query filtered by `org_id`
- **Audit Logging:** View As mode tracking

### Security Headers
```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: geolocation=(), microphone=(), camera=()
Strict-Transport-Security: max-age=31536000; includeSubDomains
```

---

## 🎯 Key Features

### Multi-Tenant SaaS
- Complete organization isolation
- Role-based access control (Owner, Manager, Viewer, Integrations, ODS Staff)
- "View As" mode for ODS support

### Content Management
- Image & video upload with optimization
- Folder organization with system folders
- Thumbnail generation with Sharp
- Metadata extraction (resolution, duration)

### Playlist Scheduling
- Drag-and-drop playlist builder
- Time-based activation scheduling
- Real-time updates to players via WebSocket
- Asset versioning

### Player Management
- Auto-discovery via pairing codes
- Real-time status monitoring
- Remote configuration updates
- Group operations for bulk management

---

## 📊 Performance Metrics

**Load Testing Results (50 concurrent users):**
- Average Response Time: < 20ms
- Throughput: 59 requests/second
- Success Rate: 100%
- Server Load: CPU 0.3%, Memory 42.6MB

**Database:**
- Size: 92KB (compressed to 8KB = 91% reduction)
- Queries: <5ms average response time

**Security Testing:**
- Authentication: ✅ 100% enforced
- Rate Limiting: ✅ Triggers at 100 requests
- CORS: ✅ Blocks unauthorized origins
- SQL Injection: ✅ Zero vulnerabilities

---

## 🚀 Deployment

### Production Environment
```bash
# Server: DigitalOcean Ubuntu 24.04
# CPU: 2 vCPUs, Memory: 2GB RAM
# Storage: 50GB SSD
# IP: 209.38.118.127

# Services
systemd:  ods-server.service (auto-restart)
nginx:    Reverse proxy with SSL/TLS
cron:     Daily backups + 5min health checks
```

### Quick Deploy (Production)
```bash
# 1. Deploy backend
scp -r server/ root@server:/opt/ods/ods-signage/
ssh root@server 'systemctl restart ods-server'

# 2. Deploy frontend (automatic via Vercel)
git push origin main  # Auto-deploys to Vercel CDN
```

For detailed deployment procedures, see [Deployment Guide](./kbase/operations/deployment_guide.md).

---

## 🔧 Operational Excellence

### Automated Monitoring
- **Health Checks:** Every 5 minutes with 3 retries
- **Auto-Recovery:** Automatic server restart if down
- **Logging:** `/var/log/ods-health.log`

### Automated Backups
- **Schedule:** Daily at 2:00 AM UTC
- **Compression:** 92KB → 8KB (91% reduction)
- **Retention:** 30 days with automatic rotation
- **Location:** `/opt/ods/backups/database/`

### Disaster Recovery
- **RTO:** < 5 minutes
- **RPO:** 24 hours (daily backups)
- **Restore:** See [Operational Guide](./kbase/operations/quick_win_infrastructure_hardening.md)

---

## 📝 Development

### Project Structure
```
ods-signage/
├── dashboard/          # Next.js frontend (TypeScript)
│   ├── app/           # App router pages
│   ├── components/    # Reusable UI components
│   ├── lib/           # API client & utilities
│   └── middleware.ts  # Auth middleware
│
├── server/            # Express API backend (Node.js)
│   ├── routes/        # API endpoints
│   ├── middleware/    # Auth & rate limiting
│   ├── scripts/       # Operational scripts
│   └── database.js    # SQLite connection
│
└── kbase/             # Knowledge base & documentation
```

### API Endpoints
- `GET /api/players` - List all players
- `POST /api/players` - Create player
- `GET /api/content` - List media files
- `POST /api/content/upload` - Upload media
- `GET /api/playlists` - List playlists
- `POST /api/playlists` - Create playlist
- `POST /api/pairing/initiate` - Generate pairing code
- `POST /api/view-as/switch` - ODS staff impersonation

For complete API documentation, see [API Guide](./server/README.md).

---

## 🎓 Testing & Quality

### Comprehensive 3-Phase Testing
1. **Phase 1:** Foundation testing (code quality, basic functionality)
2. **Phase 2:** Security deep dive (authentication, CORS, XSS)
3. **Phase 3:** Final validation (performance, integration, resilience)

**Result:** ✅ **A+ Production Ready Certification**

### Security Testing
- ✅ Authentication bypass testing
- ✅ SQL injection protection
- ✅ XSS vulnerability scanning
- ✅ Rate limiting verification
- ✅ CORS restriction testing
- ✅ Organization isolation validation

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards
- **Backend:** ESLint with Airbnb config
- **Frontend:** TypeScript strict mode
- **Security:** All PRs must pass security scan
- **Testing:** Required for new features

---

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Supabase** - Authentication & database
- **Vercel** - Frontend hosting & CDN
- **DigitalOcean** - VPS hosting
- **Socket.IO** - Real-time communication
- **Sharp** - Image processing
- **Next.js** - React framework

---

## 📞 Support

- **Documentation:** [Knowledge Base](./kbase/)
- **Issues:** [GitHub Issues](https://github.com/your-org/ods-signage/issues)
- **Email:** support@ods-cloud.com

---

**Production Status:** ✅ LIVE & CERTIFIED (Grade A+)  
**Last Updated:** February 12, 2026  
**Next Review:** March 12, 2026
