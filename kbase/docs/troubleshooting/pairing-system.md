# ODS Player Pairing System - Troubleshooting Guide

## Overview

This document provides troubleshooting guidance for the ODS Player HTTP-based pairing system. Use this when devices show "Connection Error" or fail to generate pairing codes.

## Quick Diagnosis

### Symptom: "Connection Error" on Device Screen

**Check in this order:**

1. **Network Connectivity**
   ```bash
   # From device
   ping -c 3 api.ods-cloud.com
   curl https://api.ods-cloud.com/api/health
   ```

2. **API URL Configuration**
   ```bash
   # Check pairing.html API_URL
   ssh root@DEVICE_IP
   grep "const API_URL" /home/signage/ODS/webgui/public/pairing.html
   # Should be: https://api.ods-cloud.com
   # NOT: http://209.38.118.127:3001
   ```

3. **CORS Configuration**
   ```bash
   # Test with Origin header
   curl -H "Origin: http://localhost:8080" https://api.ods-cloud.com/api/pairing/generate
   # Should return HTTP/1.1 200 OK
   # If 500: CORS blocking
   ```

4. **Database Schema**
   ```bash
   # Check server logs
   ssh root@SERVER_IP
   journalctl -u ods-server --since "5 minutes ago" | grep -i "org_id\|error"
   # If "no such column: org_id" → schema issue
   ```

## Common Issues

### Issue 1: Firewall Blocking Port 3001

**Symptoms:**
- curl timeout after 75 seconds
- Device shows "Connection Error"
- Works from server, fails from device

**Root Cause:** Port 3001 only accessible internally; Nginx (port 443) is public entry point

**Fix:**
```javascript
// player/pairing.html
const API_URL = 'https://api.ods-cloud.com';  // ✅ Correct
// NOT: http://209.38.118.127:3001  // ❌ Firewalled
```

**Verification:**
```bash
curl https://api.ods-cloud.com/api/health
# Should return: {"status":"ok","timestamp":"..."}
```

---

### Issue 2: CORS Blocking Browser Requests

**Symptoms:**
- curl works, browser fails
- Browser console: "Failed to fetch"
- Server returns 500 with Origin header

**Root Cause:** Device origin (`http://localhost:8080`) not in CORS whitelist

**Fix:**
```javascript
// server/index.js
const allowedOrigins = [
    'https://ods-cloud.com',
    'https://www.ods-cloud.com',
    'http://localhost:3000',
    'http://localhost:8080'  // ✅ Add this
];
```

**Verification:**
```bash
curl -H "Origin: http://localhost:8080" https://api.ods-cloud.com/api/pairing/generate
# Should return: HTTP/1.1 200 OK
```

---

### Issue 3: Database Schema Missing org_id

**Symptoms:**
- Server logs: "no such column: org_id"
- Dashboard shows 500 errors
- Pairing API returns errors

**Root Cause:** Routes query `org_id` but column doesn't exist

**Fix:**
```javascript
// server/database.js - Add migration
const hasOrgId = playerColumns[0]?.values.some(col => col[1] === 'org_id');
if (!hasOrgId) {
  db.run("ALTER TABLE players ADD COLUMN org_id TEXT");
}
// Repeat for: content, playlists_v2, folders
```

**Verification:**
```bash
journalctl -u ods-server --since "1 minute ago" | grep "org_id"
# Should show: ✅ Added org_id column to players table
```

---

### Issue 4: QR Code 404 Errors

**Symptoms:**
- QR code scans to 404 page
- URL shows `/pair` instead of `/players/pair`

**Root Cause:** Incorrect route in QR code generation

**Fix:**
```javascript
// server/routes/pairing.js
qr_data: `https://ods-cloud.com/players/pair?code=${pairingCode}`
// NOT: https://ods-cloud.com/pair?code=...
```

**Verification:**
```bash
curl https://ods-cloud.com/players/pair?code=TEST123
# Should NOT return 404
```

---

## Debugging Workflow

### Step 1: Test Network Layer
```bash
# From device
ssh root@DEVICE_IP
ping -c 3 api.ods-cloud.com
curl https://api.ods-cloud.com/api/health
```

### Step 2: Test API Layer (curl)
```bash
# From device
curl -X POST https://api.ods-cloud.com/api/pairing/generate \
  -H "Content-Type: application/json" \
  -d '{"cpu_serial":"test","device_uuid":"test"}'
```

**If curl works but browser fails → CORS issue**

### Step 3: Test CORS
```bash
# From device
curl -H "Origin: http://localhost:8080" \
  https://api.ods-cloud.com/api/pairing/generate \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"cpu_serial":"test","device_uuid":"test"}' \
  -v 2>&1 | grep "< HTTP"
```

**Expected:** `HTTP/1.1 200 OK`  
**If 500:** CORS blocking

### Step 4: Check Server Logs
```bash
# On server
ssh root@SERVER_IP
journalctl -u ods-server --since "5 minutes ago" --no-pager | tail -50
```

**Look for:**
- `no such column: org_id` → Schema issue
- `Not allowed by CORS` → CORS issue
- Connection errors → Network/firewall issue

---

## Key Differences: curl vs Browser

### curl Bypasses:
- ✅ CORS policies
- ✅ Browser security features
- ✅ Certificate validation (with `-k`)
- ✅ Cookie/session management

### Browser Enforces:
- ❌ CORS policies (strictly)
- ❌ Mixed content blocking
- ❌ Certificate validation
- ❌ Same-origin policy

**Rule:** If curl works but browser fails → Browser security issue (usually CORS)

---

## File Locations

### Device (Raspberry Pi)
- **Pairing HTML:** `/home/signage/ODS/webgui/public/pairing.html`
- **WiFi Setup:** `/home/signage/ODS/webgui/public/qr.html`
- **Server Script:** `/home/signage/ODS/webgui/server.js`

### Server (DigitalOcean)
- **Main Server:** `/opt/ods/ods-signage/server/index.js`
- **Pairing Routes:** `/opt/ods/ods-signage/server/routes/pairing.js`
- **Database:** `/opt/ods/ods-signage/server/database.js`
- **Service:** `systemctl status ods-server`

---

## Quick Fixes

### Restart Device Browser
```bash
ssh root@DEVICE_IP
pkill -f chromium
# Auto-restarts in 3 seconds
```

### Restart Server
```bash
ssh root@SERVER_IP
systemctl restart ods-server
systemctl status ods-server
```

### Clear Browser Cache
```bash
ssh root@DEVICE_IP
rm -rf /home/signage/.config/chromium/Default/Cache/*
pkill -f chromium
```

---

## Architecture Reference

```
[Device Browser]
http://localhost:8080/pairing.html
         ↓
JavaScript fetch()
         ↓
https://api.ods-cloud.com/api/pairing/generate
         ↓
[Nginx Reverse Proxy] (Port 443)
         ↓
http://localhost:3001 (Internal)
         ↓
[Node.js Server]
         ↓
[SQLite Database]
```

**Key Points:**
- Device serves HTML over HTTP (localhost:8080)
- API accessible via HTTPS (api.ods-cloud.com)
- Port 3001 is internal-only
- CORS must allow `http://localhost:8080` origin

---

## Success Criteria

✅ Device displays 6-character pairing code  
✅ QR code generates and displays  
✅ No "Connection Error" message  
✅ curl test returns 200 OK  
✅ Server logs show no errors  
✅ Database migrations complete  

---

## Related Documentation

- **Complete Walkthrough:** `walkthrough.md`
- **Architecture Analysis:** `complete_architecture.md`
- **Phase 3 Plan:** `phase3_deployment_walkthrough.md`
- **SSH Access:** `kbase/docs/reference/ssh-access.md`
