const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// GET /api/player-groups - List all player groups
router.get('/', async (req, res) => {
    try {
        const db = await require('../database');
        const groups = db.prepare('SELECT * FROM player_groups ORDER BY name ASC').all();

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
        const group = db.prepare('SELECT * FROM player_groups WHERE id = ?').get(req.params.id);

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
router.post('/', async (req, res) => {
    try {
        const db = await require('../database');
        const { name, description } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Group name is required' });
        }

        const id = uuidv4();
        const now = new Date().toISOString();

        db.prepare(`
            INSERT INTO player_groups (id, name, description, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?)
        `).run(id, name, description || null, now, now);

        res.json({ id, name, description, created_at: now, updated_at: now });
    } catch (error) {
        console.error('Error creating player group:', error);
        res.status(500).json({ error: error.message });
    }
});

// PUT /api/player-groups/:id - Update player group
router.put('/:id', async (req, res) => {
    try {
        const db = await require('../database');
        const { name, description } = req.body;
        const now = new Date().toISOString();

        db.prepare(`
            UPDATE player_groups 
            SET name = ?, description = ?, updated_at = ?
            WHERE id = ?
        `).run(name, description, now, req.params.id);

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

module.exports = router;
