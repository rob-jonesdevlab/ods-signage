const express = require('express');
const router = express.Router();

/**
 * GET /api/scheduled-updates
 * Returns list of scheduled updates for the authenticated user
 */
router.get('/', async (req, res) => {
    try {
        const { data, error } = await req.supabase
            .from('scheduled_updates')
            .select('*')
            .order('schedule_date', { ascending: true })
            .order('schedule_time', { ascending: true });

        if (error) throw error;

        res.json(data || []);
    } catch (error) {
        console.error('Fetch scheduled updates error:', error);
        res.status(500).json({
            error: 'Failed to fetch scheduled updates',
            details: error.message
        });
    }
});

/**
 * POST /api/scheduled-updates
 * Create a new scheduled update
 */
router.post('/', async (req, res) => {
    try {
        const {
            title,
            type,
            targets,
            scheduleDate,
            scheduleTime,
            recurrence,
            notifications
        } = req.body;

        // Validation
        if (!title || !type || !scheduleDate || !scheduleTime) {
            return res.status(400).json({
                error: 'Missing required fields',
                required: ['title', 'type', 'scheduleDate', 'scheduleTime']
            });
        }

        if (!['playlist', 'firmware', 'maintenance', 'content'].includes(type)) {
            return res.status(400).json({
                error: 'Invalid type',
                validTypes: ['playlist', 'firmware', 'maintenance', 'content']
            });
        }

        // Insert into database
        const { data, error } = await req.supabase
            .from('scheduled_updates')
            .insert({
                user_id: req.user.id,
                title,
                type,
                targets: targets || [],
                schedule_date: scheduleDate,
                schedule_time: scheduleTime,
                recurrence: recurrence || null,
                notifications: notifications || { emailOnCompletion: false, alertOnFailure: true },
                status: 'pending'
            })
            .select()
            .single();

        if (error) throw error;

        res.status(201).json(data);
    } catch (error) {
        console.error('Create scheduled update error:', error);
        res.status(500).json({
            error: 'Failed to create scheduled update',
            details: error.message
        });
    }
});

/**
 * PATCH /api/scheduled-updates/:id
 * Update an existing scheduled update
 */
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        // Remove fields that shouldn't be updated
        delete updates.id;
        delete updates.user_id;
        delete updates.created_at;
        delete updates.updated_at;

        const { data, error } = await req.supabase
            .from('scheduled_updates')
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return res.status(404).json({ error: 'Scheduled update not found' });
        }

        res.json(data);
    } catch (error) {
        console.error('Update scheduled update error:', error);
        res.status(500).json({
            error: 'Failed to update scheduled update',
            details: error.message
        });
    }
});

/**
 * DELETE /api/scheduled-updates/:id
 * Delete a scheduled update
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        const { error } = await req.supabase
            .from('scheduled_updates')
            .delete()
            .eq('id', id);

        if (error) throw error;

        res.json({ success: true, message: 'Scheduled update deleted' });
    } catch (error) {
        console.error('Delete scheduled update error:', error);
        res.status(500).json({
            error: 'Failed to delete scheduled update',
            details: error.message
        });
    }
});

module.exports = router;
