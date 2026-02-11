const express = require('express');
const router = express.Router();
const { authMiddleware, requireODSStaff } = require('../middleware/auth');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Switch to "View As" mode
 * Allows ODS staff to impersonate a customer organization
 * 
 * POST /api/view-as/switch
 * Body: { mode: 'tech' | 'customer', organization_id: string }
 */
router.post('/switch', authMiddleware, requireODSStaff, async (req, res) => {
    try {
        const { mode, organization_id } = req.body;

        // Validate mode
        if (!['tech', 'customer'].includes(mode)) {
            return res.status(400).json({
                error: 'Invalid mode',
                message: 'Mode must be either "tech" or "customer"'
            });
        }

        // Validate organization_id
        if (!organization_id) {
            return res.status(400).json({
                error: 'Missing organization_id',
                message: 'Organization ID is required'
            });
        }

        // Verify organization exists
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', organization_id)
            .single();

        if (orgError || !org) {
            return res.status(404).json({
                error: 'Organization not found',
                message: `No organization found with ID: ${organization_id}`
            });
        }

        // For ODSTech, verify they have access to this org
        if (req.user.role === 'ODSTech') {
            const { data: assignment, error: assignmentError } = await supabase
                .from('tech_assignments')
                .select('id')
                .eq('tech_id', req.user.id)
                .eq('organization_id', organization_id)
                .single();

            if (assignmentError || !assignment) {
                return res.status(403).json({
                    error: 'Access denied',
                    message: 'You are not assigned to this organization'
                });
            }
        }

        // Create view_as context
        const viewAsContext = {
            mode,
            organization_id,
            original_role: req.user.role
        };

        // Log the switch in audit logs
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert({
                user_id: req.user.id,
                user_email: req.user.email,
                action: 'view_as_switch',
                resource_type: 'organization',
                resource_id: organization_id,
                details: `Switched to ${mode} mode for organization: ${org.name}`,
                metadata: { mode, organization_id, organization_name: org.name }
            });

        if (auditError) {
            console.error('Error logging view_as switch:', auditError);
        }

        // Update user metadata with view_as context
        // Note: In production, this would update the JWT claims
        // For now, we return the context to be stored client-side
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            req.user.id,
            {
                user_metadata: {
                    ...req.user,
                    view_as: viewAsContext
                }
            }
        );

        if (updateError) {
            console.error('Error updating user metadata:', updateError);
            return res.status(500).json({
                error: 'Failed to switch mode',
                message: 'Could not update user session'
            });
        }

        res.json({
            success: true,
            view_as: viewAsContext,
            organization: org,
            message: `Now viewing as ${mode} for ${org.name}`
        });
    } catch (error) {
        console.error('Error switching view mode:', error);
        res.status(500).json({
            error: 'Failed to switch mode',
            message: error.message
        });
    }
});

/**
 * Exit "View As" mode
 * Returns ODS staff to their normal view
 * 
 * POST /api/view-as/exit
 */
router.post('/exit', authMiddleware, requireODSStaff, async (req, res) => {
    try {
        // Log the exit
        const { error: auditError } = await supabase
            .from('audit_logs')
            .insert({
                user_id: req.user.id,
                user_email: req.user.email,
                action: 'view_as_exit',
                resource_type: 'organization',
                resource_id: req.user.view_as?.organization_id || null,
                details: 'Exited View As mode',
                metadata: { previous_view_as: req.user.view_as }
            });

        if (auditError) {
            console.error('Error logging view_as exit:', auditError);
        }

        // Clear view_as from user metadata
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            req.user.id,
            {
                user_metadata: {
                    ...req.user,
                    view_as: null
                }
            }
        );

        if (updateError) {
            console.error('Error updating user metadata:', updateError);
            return res.status(500).json({
                error: 'Failed to exit mode',
                message: 'Could not update user session'
            });
        }

        res.json({
            success: true,
            view_as: null,
            message: 'Returned to normal view'
        });
    } catch (error) {
        console.error('Error exiting view mode:', error);
        res.status(500).json({
            error: 'Failed to exit mode',
            message: error.message
        });
    }
});

/**
 * Get current view mode
 * Returns the current view_as context if active
 * 
 * GET /api/view-as/current
 */
router.get('/current', authMiddleware, requireODSStaff, async (req, res) => {
    try {
        if (!req.user.view_as) {
            return res.json({
                active: false,
                view_as: null
            });
        }

        // Get organization details
        const { data: org, error: orgError } = await supabase
            .from('organizations')
            .select('id, name')
            .eq('id', req.user.view_as.organization_id)
            .single();

        if (orgError || !org) {
            return res.json({
                active: false,
                view_as: null,
                error: 'Organization no longer exists'
            });
        }

        res.json({
            active: true,
            view_as: req.user.view_as,
            organization: org
        });
    } catch (error) {
        console.error('Error getting current view mode:', error);
        res.status(500).json({
            error: 'Failed to get current mode',
            message: error.message
        });
    }
});

/**
 * Get available organizations for View As
 * Returns list of orgs the user can view as
 * 
 * GET /api/view-as/available
 */
router.get('/available', authMiddleware, requireODSStaff, async (req, res) => {
    try {
        let organizations;

        if (req.user.role === 'ODSAdmin') {
            // ODSAdmin can view all organizations
            const { data, error } = await supabase
                .from('organizations')
                .select('id, name, created_at')
                .order('name');

            if (error) throw error;
            organizations = data;
        } else if (req.user.role === 'ODSTech') {
            // ODSTech can only view assigned organizations
            const { data, error } = await supabase
                .from('tech_assignments')
                .select(`
                    organization_id,
                    organizations (
                        id,
                        name,
                        created_at
                    )
                `)
                .eq('tech_id', req.user.id);

            if (error) throw error;
            organizations = data.map(a => a.organizations);
        } else {
            organizations = [];
        }

        res.json({
            organizations,
            count: organizations.length
        });
    } catch (error) {
        console.error('Error getting available organizations:', error);
        res.status(500).json({
            error: 'Failed to get organizations',
            message: error.message
        });
    }
});

module.exports = router;
