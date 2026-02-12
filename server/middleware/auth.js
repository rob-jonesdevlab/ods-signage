const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Auth middleware - Verifies JWT and injects user context
 * Extracts user info from Supabase JWT and adds to req.user
 */
async function authMiddleware(req, res, next) {
    try {
        // Extract JWT from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Missing or invalid authorization header',
                message: 'Please provide a valid JWT token'
            });
        }

        const token = authHeader.substring(7);

        // Verify JWT with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({
                error: 'Invalid or expired token',
                message: 'Please log in again'
            });
        }

        // Extract custom claims from JWT (not metadata)
        // Custom claims are injected by Supabase custom_access_token_hook
        // Decode the JWT to access our custom claims
        let jwtPayload = {};
        try {
            const parts = token.split('.');
            if (parts.length === 3) {
                jwtPayload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
            }
        } catch (decodeError) {
            console.error('Error decoding JWT:', decodeError);
        }

        // Inject user context into request
        req.user = {
            id: user.id,
            email: user.email,
            organization_id: jwtPayload.organization_id || null,
            app_role: jwtPayload.app_role || 'Viewer',
            view_as: jwtPayload.view_as || null
        };

        // Get effective organization (for "View As" functionality)
        // If user is viewing as another org, use that org_id
        req.user.effective_organization_id = req.user.view_as?.organization_id || req.user.organization_id;

        // Log auth success (optional, for debugging)
        console.log(`[Auth] User ${req.user.email} (${req.user.app_role}) authenticated for org ${req.user.effective_organization_id}`);

        next();
    } catch (error) {
        console.error('Auth middleware error:', error);
        return res.status(500).json({
            error: 'Authentication failed',
            message: 'Internal server error during authentication'
        });
    }
}

/**
 * Role-based access control middleware
 * Restricts access to routes based on user role
 * 
 * @param {...string} allowedRoles - List of roles that can access this route
 * @returns {Function} Express middleware function
 * 
 * @example
 * router.delete('/players/:id', authMiddleware, requireRole('Owner', 'Manager'), deletePlayer);
 */
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please log in to access this resource'
            });
        }

        // Use original role if viewing as another org
        const userRole = req.user.view_as?.original_role || req.user.app_role;

        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
                required: allowedRoles,
                current: userRole
            });
        }

        next();
    };
}

/**
 * ODS Staff only middleware (ODSAdmin or ODSTech)
 * Restricts access to ODS internal staff only
 */
function requireODSStaff(req, res, next) {
    return requireRole('ODSAdmin', 'ODSTech')(req, res, next);
}

/**
 * Customer roles only middleware
 * Restricts access to customer organization users only
 */
function requireCustomer(req, res, next) {
    return requireRole('Owner', 'Manager', 'Viewer', 'Integrations')(req, res, next);
}

/**
 * Owner or Manager only middleware
 * For write operations that require elevated permissions
 */
function requireWriteAccess(req, res, next) {
    return requireRole('Owner', 'Manager', 'ODSAdmin')(req, res, next);
}

/**
 * Owner only middleware
 * For critical operations like deleting resources
 */
function requireOwner(req, res, next) {
    return requireRole('Owner', 'ODSAdmin')(req, res, next);
}

/**
 * Check if user has access to a specific organization
 * Used for tenant isolation enforcement
 * 
 * @param {string} orgId - Organization ID to check access for
 * @returns {boolean} True if user has access
 */
function hasOrgAccess(req, orgId) {
    if (!req.user) return false;

    // ODSAdmin has access to all orgs (when not in View As mode)
    if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
        return true;
    }

    // Check if org matches user's effective org
    return req.user.effective_organization_id === orgId;
}

/**
 * Middleware to verify organization access
 * Checks if user can access the org specified in request params
 */
function verifyOrgAccess(req, res, next) {
    const orgId = req.params.org_id || req.body.org_id || req.query.org_id;

    if (!orgId) {
        return res.status(400).json({
            error: 'Missing organization ID',
            message: 'Organization ID is required'
        });
    }

    if (!hasOrgAccess(req, orgId)) {
        return res.status(403).json({
            error: 'Access denied',
            message: 'You do not have access to this organization'
        });
    }

    next();
}

module.exports = {
    authMiddleware,
    requireRole,
    requireODSStaff,
    requireCustomer,
    requireWriteAccess,
    requireOwner,
    hasOrgAccess,
    verifyOrgAccess
};
