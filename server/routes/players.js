const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { requireWriteAccess, requireOwner } = require('../middleware/auth');

module.exports = function (db) {
    /**
     * GET /api/players
     * Get all players for the user's organization
     * Tenant isolation: Filters by effective_organization_id
     */
    router.get('/', async (req, res) => {
        try {
            const orgId = req.user.effective_organization_id;

            // ODSAdmin can see all players when not in View As mode
            let players;
            if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
                players = db.prepare('SELECT * FROM players ORDER BY created_at DESC').all();
            } else {
                players = db.prepare('SELECT * FROM players WHERE org_id = ? ORDER BY created_at DESC').all(orgId);
            }

            res.json(players);
        } catch (error) {
            console.error('Error fetching players:', error);
            res.status(500).json({ error: 'Failed to fetch players' });
        }
    });

    /**
     * POST /api/players
     * Create a new player
     * Requires: Owner or Manager role
     * Tenant isolation: Automatically injects org_id
     */
    router.post('/', requireWriteAccess, async (req, res) => {
        try {
            const { name, cpu_serial, group_id } = req.body;
            const id = uuidv4();
            const orgId = req.user.effective_organization_id;

            // Validate required fields
            if (!name || !cpu_serial) {
                return res.status(400).json({
                    error: 'Missing required fields',
                    message: 'name and cpu_serial are required'
                });
            }

            // Check if player with this CPU serial already exists in this org
            const existing = db.prepare('SELECT id FROM players WHERE cpu_serial = ? AND org_id = ?').get(cpu_serial, orgId);
            if (existing) {
                return res.status(409).json({
                    error: 'Player already exists',
                    message: 'A player with this CPU serial already exists in your organization'
                });
            }

            // Create player
            db.prepare(`
                INSERT INTO players (id, name, cpu_serial, org_id, group_id, status, created_at)
                VALUES (?, ?, ?, ?, ?, 'offline', datetime('now'))
            `).run(id, name, cpu_serial, orgId, group_id || null);

            const player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
            res.status(201).json(player);
        } catch (error) {
            console.error('Error creating player:', error);
            res.status(500).json({ error: 'Failed to create player' });
        }
    });

    /**
     * GET /api/players/:id
     * Get a single player by ID
     * Tenant isolation: Verifies player belongs to user's org
     */
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const orgId = req.user.effective_organization_id;

            let player;
            if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
                player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
            } else {
                player = db.prepare('SELECT * FROM players WHERE id = ? AND org_id = ?').get(id, orgId);
            }

            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }

            res.json(player);
        } catch (error) {
            console.error('Error fetching player:', error);
            res.status(500).json({ error: 'Failed to fetch player' });
        }
    });

    /**
     * PATCH /api/players/:id
     * Update a player
     * Requires: Owner or Manager role
     * Tenant isolation: Verifies player belongs to user's org
     */
    router.patch('/:id', requireWriteAccess, async (req, res) => {
        try {
            const { id } = req.params;
            const { name, status, config, group_id } = req.body;
            const orgId = req.user.effective_organization_id;

            // Verify player exists and belongs to user's org
            let player;
            if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
                player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
            } else {
                player = db.prepare('SELECT * FROM players WHERE id = ? AND org_id = ?').get(id, orgId);
            }

            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }

            // Build update query
            const updates = [];
            const values = [];

            if (name !== undefined) {
                updates.push('name = ?');
                values.push(name);
            }
            if (status !== undefined) {
                updates.push('status = ?');
                values.push(status);
            }
            if (config !== undefined) {
                updates.push('config = ?');
                values.push(JSON.stringify(config));
            }
            if (group_id !== undefined) {
                updates.push('group_id = ?');
                values.push(group_id);
            }

            if (updates.length > 0) {
                updates.push('updated_at = datetime(\'now\')');
                values.push(id);
                db.prepare(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`).run(...values);
            }

            const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
            res.json(updatedPlayer);
        } catch (error) {
            console.error('Error updating player:', error);
            res.status(500).json({ error: 'Failed to update player' });
        }
    });

    /**
     * DELETE /api/players/:id
     * Delete a player
     * Requires: Owner role
     * Tenant isolation: Verifies player belongs to user's org
     */
    router.delete('/:id', requireOwner, async (req, res) => {
        try {
            const { id } = req.params;
            const orgId = req.user.effective_organization_id;

            // Verify player exists and belongs to user's org
            let player;
            if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
                player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
            } else {
                player = db.prepare('SELECT * FROM players WHERE id = ? AND org_id = ?').get(id, orgId);
            }

            if (!player) {
                return res.status(404).json({ error: 'Player not found' });
            }

            // Delete player
            db.prepare('DELETE FROM players WHERE id = ?').run(id);

            res.json({ success: true, message: 'Player deleted successfully' });
        } catch (error) {
            console.error('Error deleting player:', error);
            res.status(500).json({ error: 'Failed to delete player' });
        }
    });

    return router;
};
