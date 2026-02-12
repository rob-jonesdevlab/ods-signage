# Phase 5: Authentication & Multi-Tenancy - Implementation Plan

**Goal:** Implement complete authentication system with JWT claims, role-based access control, and tenant isolation for true multi-tenant SaaS platform.

**Timeline:** 2-3 days  
**Status:** Ready to implement

---

## User Review Required

> [!IMPORTANT]
> **Critical Foundation for Multi-Tenancy**
> This phase implements the authentication backbone that enables:
> - ✅ Tenant isolation (no data leaks between organizations)
> - ✅ Role-based access control (6 distinct roles)
> - ✅ "View As" functionality for ODS staff
> - ✅ Secure API access with JWT validation
> 
> **No Breaking Changes** - Builds on existing Supabase auth

> [!WARNING]
> **Security Considerations**
> - JWT claims will include sensitive data (org_id, role)
> - Auth middleware will enforce access on ALL protected routes
> - Tenant isolation MUST be tested thoroughly
> - "View As" functionality requires audit logging

---

## Architecture Overview

### Current State
- ✅ Supabase Auth configured
- ✅ Users table with email/password auth
- ✅ Organizations table with RLS policies
- ✅ Audit logs table for tracking

### Target State
```
┌─────────────────────────────────────────────────────────────┐
│                     Supabase Auth                           │
│  - Email/Password Login                                     │
│  - JWT Token Generation                                     │
│  - Custom Claims (org_id, role, view_as)                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Auth Middleware (Server)                   │
│  - Verify JWT signature                                     │
│  - Extract claims (org_id, role, view_as)                  │
│  - Enforce role-based access                               │
│  - Inject user context into req.user                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Protected API Routes                       │
│  - Check req.user.role for permissions                     │
│  - Filter data by req.user.organization_id                 │
│  - Log actions to audit_logs                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  Frontend (Dashboard)                       │
│  - Store JWT in localStorage/cookie                        │
│  - Include JWT in all API requests                         │
│  - Show/hide UI based on role                              │
│  - Display "View As" badge when impersonating              │
└─────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### 1. JWT Claims Structure

#### Custom Claims Schema
```typescript
interface JWTClaims {
    sub: string;              // User ID (from Supabase)
    email: string;            // User email
    organization_id: string;  // Current organization
    role: UserRole;           // User's role
    view_as?: {               // Optional: For ODSAdmin/ODSTech
        mode: 'tech' | 'customer';
        organization_id: string;
        original_role: UserRole;
    };
    iat: number;              // Issued at
    exp: number;              // Expiration
}

type UserRole = 'Owner' | 'Manager' | 'Viewer' | 'Integrations' | 'ODSAdmin' | 'ODSTech';
```

#### Supabase Function for Custom Claims
```sql
-- Create function to generate custom JWT claims
CREATE OR REPLACE FUNCTION public.custom_access_token_hook(event jsonb)
RETURNS jsonb
LANGUAGE plpgsql
AS $$
DECLARE
    claims jsonb;
    user_record record;
BEGIN
    -- Get user data
    SELECT u.id, u.email, u.organization_id, u.role
    INTO user_record
    FROM public.users u
    WHERE u.id = (event->>'user_id')::uuid;

    -- Build custom claims
    claims := jsonb_build_object(
        'organization_id', user_record.organization_id,
        'role', user_record.role
    );

    -- Merge with existing claims
    event := jsonb_set(event, '{claims}', claims);
    
    RETURN event;
END;
$$;

-- Register the hook
-- This will be configured in Supabase Dashboard under Auth > Hooks
```

---

### 2. Backend Auth Middleware

#### [NEW] `server/middleware/auth.js`
```javascript
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Auth middleware - Verifies JWT and injects user context
 */
async function authMiddleware(req, res, next) {
    try {
        // Extract JWT from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);

        // Verify JWT with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);
        
        if (error || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // Extract custom claims
        const claims = user.user_metadata || {};
        
        // Inject user context into request
        req.user = {
            id: user.id,
            email: user.email,
            organization_id: claims.organization_id,
            role: claims.role,
            view_as: claims.view_as || null
        };

        // Get effective organization (for "View As" functionality)
        req.user.effective_organization_id = req.user.view_as?.organization_id || req.user.organization_id;

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({ error: 'Authentication failed' });
    }
}

/**
 * Role-based access control middleware
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userRole = req.user.view_as?.original_role || req.user.role;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: 'Insufficient permissions',
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
}

/**
 * ODS Staff only middleware (ODSAdmin or ODSTech)
 */
function requireODSStaff(req, res, next) {
    return requireRole('ODSAdmin', 'ODSTech')(req, res, next);
}

/**
 * Customer roles only middleware
 */
function requireCustomer(req, res, next) {
    return requireRole('Owner', 'Manager', 'Viewer', 'Integrations')(req, res, next);
}

module.exports = {
    authMiddleware,
    requireRole,
    requireODSStaff,
    requireCustomer
};
```

---

### 3. Apply Auth Middleware to Routes

#### [MODIFY] `server/index.js`
```javascript
const { authMiddleware, requireRole, requireODSStaff } = require('./middleware/auth');

// Public routes (no auth required)
app.use('/api/pairing', pairingRoutes);

// Protected routes (auth required)
app.use('/api/players', authMiddleware, playersRoutes);
app.use('/api/playlists', authMiddleware, playlistsRoutes);
app.use('/api/content', authMiddleware, contentRoutes);
app.use('/api/player-groups', authMiddleware, playerGroupsRoutes);
app.use('/api/playlist-templates', authMiddleware, playlistTemplatesRoutes);
app.use('/api/analytics', authMiddleware, analyticsRoutes);

// ODS Staff only routes
app.use('/api/audit-logs', authMiddleware, requireODSStaff, auditLogsRoutes);
app.use('/api/organizations', authMiddleware, requireODSStaff, organizationsRoutes);
```

---

### 4. Tenant Isolation in API Routes

#### Pattern: Filter by Organization
```javascript
// Example: GET /api/players
router.get('/', authMiddleware, async (req, res) => {
    const db = await require('../database');
    
    // Get effective organization (respects "View As")
    const orgId = req.user.effective_organization_id;
    
    // ODSAdmin can see all orgs, others see only their org
    let players;
    if (req.user.role === 'ODSAdmin' && !req.user.view_as) {
        players = db.prepare('SELECT * FROM players').all();
    } else {
        players = db.prepare('SELECT * FROM players WHERE org_id = ?').all(orgId);
    }
    
    res.json(players);
});

// Example: POST /api/players
router.post('/', authMiddleware, requireRole('Owner', 'Manager'), async (req, res) => {
    const db = await require('../database');
    const orgId = req.user.effective_organization_id;
    
    // Automatically inject org_id
    const player = {
        ...req.body,
        org_id: orgId,
        created_by: req.user.id
    };
    
    const result = db.prepare(`
        INSERT INTO players (id, name, org_id, created_by, ...)
        VALUES (?, ?, ?, ?, ...)
    `).run(player.id, player.name, player.org_id, player.created_by, ...);
    
    res.json({ id: result.lastInsertRowid });
});
```

---

### 5. Frontend Auth Integration

#### [NEW] `dashboard/lib/auth.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface User {
    id: string;
    email: string;
    organization_id: string;
    role: UserRole;
    view_as?: ViewAsContext;
}

export type UserRole = 'Owner' | 'Manager' | 'Viewer' | 'Integrations' | 'ODSAdmin' | 'ODSTech';

export interface ViewAsContext {
    mode: 'tech' | 'customer';
    organization_id: string;
    original_role: UserRole;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
    });
    
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) return null;
    
    return {
        id: user.id,
        email: user.email!,
        organization_id: user.user_metadata.organization_id,
        role: user.user_metadata.role,
        view_as: user.user_metadata.view_as
    };
}

export async function getAccessToken(): Promise<string | null> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
}

// API helper with auth
export async function authenticatedFetch(url: string, options: RequestInit = {}) {
    const token = await getAccessToken();
    
    if (!token) {
        throw new Error('Not authenticated');
    }
    
    return fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });
}
```

#### [NEW] `dashboard/components/AuthProvider.tsx`
```typescript
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getCurrentUser, User } from '@/lib/auth';

const AuthContext = createContext<{
    user: User | null;
    loading: boolean;
    refetch: () => Promise<void>;
}>({
    user: null,
    loading: true,
    refetch: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchUser = async () => {
        try {
            const currentUser = await getCurrentUser();
            setUser(currentUser);
        } catch (error) {
            console.error('Error fetching user:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, refetch: fetchUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
```

---

### 6. Role-Based UI Restrictions

#### [NEW] `dashboard/components/RoleGate.tsx`
```typescript
'use client';

import { useAuth } from './AuthProvider';
import { UserRole } from '@/lib/auth';

interface RoleGateProps {
    allowedRoles: UserRole[];
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback = null }: RoleGateProps) {
    const { user } = useAuth();

    if (!user || !allowedRoles.includes(user.role)) {
        return <>{fallback}</>;
    }

    return <>{children}</>;
}

// Usage example:
// <RoleGate allowedRoles={['Owner', 'Manager']}>
//     <button>Delete Player</button>
// </RoleGate>
```

---

### 7. "View As" Functionality

#### [NEW] `server/routes/view-as.js`
```javascript
const express = require('express');
const router = express.Router();
const { authMiddleware, requireODSStaff } = require('../middleware/auth');

// Switch to "View As" mode
router.post('/switch', authMiddleware, requireODSStaff, async (req, res) => {
    const { mode, organization_id } = req.body;
    
    // Validate mode
    if (!['tech', 'customer'].includes(mode)) {
        return res.status(400).json({ error: 'Invalid mode' });
    }
    
    // Update JWT claims (this would typically be done via Supabase function)
    // For now, return new claims structure
    const viewAsContext = {
        mode,
        organization_id,
        original_role: req.user.role
    };
    
    // Log the switch in audit logs
    await logAuditEvent({
        user_id: req.user.id,
        action: 'view_as_switch',
        resource_type: 'organization',
        resource_id: organization_id,
        details: `Switched to ${mode} mode for org ${organization_id}`
    });
    
    res.json({ view_as: viewAsContext });
});

// Exit "View As" mode
router.post('/exit', authMiddleware, requireODSStaff, async (req, res) => {
    // Log the exit
    await logAuditEvent({
        user_id: req.user.id,
        action: 'view_as_exit',
        resource_type: 'organization',
        details: 'Exited View As mode'
    });
    
    res.json({ view_as: null });
});

module.exports = router;
```

---

## Verification Plan

### Automated Tests

**1. JWT Claims**
```bash
# Test JWT generation with custom claims
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"owner@test.com","password":"password"}'

# Decode JWT and verify claims
# Should include: organization_id, role
```

**2. Auth Middleware**
```bash
# Test protected route without auth
curl http://localhost:3001/api/players
# Expected: 401 Unauthorized

# Test with valid JWT
curl http://localhost:3001/api/players \
  -H "Authorization: Bearer <JWT_TOKEN>"
# Expected: 200 OK with filtered data
```

**3. Tenant Isolation**
```bash
# Login as Org A user
# Create player
# Login as Org B user
# Try to access Org A player
# Expected: 404 or empty array
```

### Manual Verification

**1. Role-Based Access**
- Login as Owner → Can create/edit/delete
- Login as Manager → Can create/edit, cannot delete
- Login as Viewer → Can view only
- Login as Integrations → API access only

**2. ODS Staff Access**
- Login as ODSAdmin → See all organizations
- Login as ODSTech → See assigned organizations only
- Test "View As" functionality

**3. Tenant Isolation**
- Create data in Org A
- Login as Org B user
- Verify cannot see Org A data
- Verify cannot modify Org A data

---

## File Summary

### New Files (6)
- `server/middleware/auth.js` - Auth middleware & RBAC
- `server/routes/view-as.js` - View As functionality
- `dashboard/lib/auth.ts` - Frontend auth utilities
- `dashboard/components/AuthProvider.tsx` - Auth context
- `dashboard/components/RoleGate.tsx` - Role-based UI
- `dashboard/app/login/page.tsx` - Login page

### Modified Files (10+)
- `server/index.js` - Apply auth middleware
- `server/routes/players.js` - Add tenant filtering
- `server/routes/playlists.js` - Add tenant filtering
- `server/routes/content.js` - Add tenant filtering
- `server/routes/player-groups.js` - Add tenant filtering
- `server/routes/playlist-templates.js` - Add tenant filtering
- `dashboard/app/layout.tsx` - Wrap with AuthProvider
- All dashboard pages - Use authenticatedFetch

---

## Success Criteria

- [ ] JWT includes organization_id and role
- [ ] Auth middleware validates JWT on all protected routes
- [ ] Tenant isolation enforced (no data leaks)
- [ ] Role-based access working for all 6 roles
- [ ] "View As" functionality working for ODS staff
- [ ] Audit logs capture View As switches
- [ ] Frontend shows/hides UI based on role
- [ ] Login/logout flow working
- [ ] All API routes use authenticatedFetch

---

**Ready to implement!** 🔐
