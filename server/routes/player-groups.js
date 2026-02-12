const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const { requireWriteAccess, requireOwner } = require('../middleware/auth');

// GET /api/player-groups - List all player groups with player counts
router.get('/', async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        // Get groups with player counts
        let groups;
        if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
            groups = db.prepare(`
                SELECT 
                    pg.*,
                    COUNT(p.id) as playerCount
                FROM player_groups pg
                LEFT JOIN players p ON p.group_id = pg.id
                GROUP BY pg.id
                ORDER BY pg.name ASC
            `).all();
        } else {
            groups = db.prepare(`
                SELECT 
                    pg.*,
                    COUNT(p.id) as playerCount
                FROM player_groups pg
                LEFT JOIN players p ON p.group_id = pg.id
                WHERE pg.organization_id = ?
                GROUP BY pg.id
                ORDER BY pg.name ASC
            `).all(orgId);
        }

        res.json(groups);
    } catch (error) {
        console.error('Error fetching player groups:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/player-groups/:id - Get player group details
router.get('/:id', async (req, res) => {
    try {
        const db = await require('../database');
        const orgId = req.user.effective_organization_id;

        let group;
        if (req.user.app_role === 'ODSAdmin' && !req.user.view_as) {
            group = db.prepare('SELECT * FROM player_groups WHERE id = ?').get(req.params.id);
        } else {
            group = db.prepare('SELECT * FROM player_groups WHERE id = ? AND organization_id = ?').get(req.params.id, orgId);
        }

        if (!group) {
            return res.status(404).json({ error: 'Player group not found' });
        }

        res.json(group);
    } catch (error) {
        console.error('Error fetching player group:', error);
        res.status(500).json({ error: error.message });
    }
});

// GET /api/player-groups/:id/players - Get players in group
router.get('/:id/players', async (req, res) => {
    try {
        const db = await require('../database');

        const players = db.prepare(`
            SELECT * FROM players 
            WHERE group_id = ?
            ORDER BY name ASC
        `).all(req.params.id);

        res.json(players);
    } catch (error) {
        console.error('Error fetching group players:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/player-groups - Create new player group
router.post('/', requireWriteAccess, async (req, res) => {
    try {
        const db = await require('../database');
        const { name, description, location } = req.body;
        const orgId = req.user.effective_organization_id;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO player_groups (id, organization_id, name, description, location, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `).run(id, orgId, name, description || null, location || null, now, now);

        res.json({ id, organization_id: orgId, name, description, location, playerCount: 0, created_at: now, updated_at: now });
    } catch (error) {
        console.error('Error creating player group:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/player-groups/:id - Update player group
router.put('/:id', async (req, res) => {
    try {
        const db = await require('../database');
        const { name, description, location } = req.body;
        const now = new Date().toISOString();

        db.prepare(`
            UPDATE player_groups 
            SET name = ?, description = ?, location = ?, updated_at = ?
            WHERE id = ?
        `).run(name, description, location, now, req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating player group:', error);
        res.status(500).json({ error: error.message });
    }
});

// DELETE /api/player-groups/:id - Delete player group
router.delete('/:id', async (req, res) => {
    try {
        const db = await require('../database');

        // Unassign players from this group first
        db.prepare('UPDATE players SET group_id = NULL WHERE group_id = ?').run(req.params.id);

        // Delete the group
        db.prepare('DELETE FROM player_groups WHERE id = ?').run(req.params.id);

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting player group:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/player-groups/:id/assign-players - Assign players to group
router.post('/:id/assign-players', async (req, res) => {
    try {
        const db = await require('../database');
        const { player_ids } = req.body;

        if (!Array.isArray(player_ids)) {
            return res.status(400).json({ error: 'player_ids must be an array' });
        }

        // Update all specified players to this group
        const stmt = db.prepare('UPDATE players SET group_id = ? WHERE id = ?');
        for (const playerId of player_ids) {
            stmt.run(req.params.id, playerId);
        }

        res.json({ success: true, assigned: player_ids.length });
    } catch (error) {
        console.error('Error assigning players to group:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/player-groups/:id/deploy - Deploy playlist to all players in group
router.post('/:id/deploy', async (req, res) => {
    try {
        const db = await require('../database');
        const { playlist_id } = req.body;

        if (!playlist_id) {
            return res.status(400).json({ error: 'playlist_id is required' });
        }

        // Get all players in this group
        const players = db.prepare('SELECT * FROM players WHERE group_id = ?').all(req.params.id);

        if (players.length === 0) {
            return res.status(400).json({ error: 'No players in this group' });
        }

        // Deploy playlist to each player
        // TODO: Implement actual deployment logic (WebSocket broadcast, etc.)
        // For now, just return success

        res.json({
            success: true,
            deployed_to: players.length,
            players: players.map(p => ({ id: p.id, name: p.name }))
        });
    } catch (error) {
        console.error('Error deploying playlist to group:', error);
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
