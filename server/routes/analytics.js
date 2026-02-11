const express = require('express');
const router = express.Router();

// Get player analytics summary
router.get('/players/summary', async (req, res) => {
    try {
        const db = await require('../database');
        const { start_date, end_date } = req.query;

        const startDate = start_date || '2020-01-01';
        const endDate = end_date || new Date().toISOString();

        // Get total players and status counts
        const players = db.prepare('SELECT status FROM players').all();
        const total_players = players.length;
        const online_count = players.filter(p => p.status === 'online').length;
        const offline_count = players.filter(p => p.status === 'offline').length;

        // Get error count from analytics
        const errorResult = db.prepare(`
            SELECT COUNT(DISTINCT player_id) as error_count
            FROM player_analytics
            WHERE event_type = 'error'
                AND timestamp >= ?
                AND timestamp <= ?
        `).get(startDate, endDate);

        const summary = {
            total_players,
            online_count,
            offline_count,
            error_count: errorResult?.error_count || 0
        };

        res.json(summary);
    } catch (error) {
        console.error('Error fetching player summary:', error);
        res.status(500).json({ error: 'Failed to fetch player summary' });
    }
});

// Get player uptime stats
router.get('/players/:id/uptime', async (req, res) => {
    try {
        const db = await require('../database');
        const { start_date, end_date } = req.query;

        const startDate = start_date || '2020-01-01';
        const endDate = end_date || new Date().toISOString();

        const uptime = db.prepare(`
            SELECT 
                COUNT(*) as total_heartbeats,
                MIN(timestamp) as first_seen,
                MAX(timestamp) as last_seen
            FROM player_analytics
            WHERE player_id = ? 
                AND event_type = 'heartbeat'
                AND timestamp >= ? 
                AND timestamp <= ?
        `).get(req.params.id, startDate, endDate);

        res.json(uptime || { total_heartbeats: 0, first_seen: null, last_seen: null });
    } catch (error) {
        console.error('Error fetching player uptime:', error);
        res.status(500).json({ error: 'Failed to fetch player uptime' });
    }
});

// Get content view analytics
router.get('/content/views', async (req, res) => {
    try {
        const db = await require('../database');
        const { start_date, end_date, limit = 10 } = req.query;

        const startDate = start_date || '2020-01-01';
        const endDate = end_date || new Date().toISOString();

        const views = db.prepare(`
            SELECT 
                JSON_EXTRACT(event_data, '$.content_id') as content_id,
                COUNT(*) as view_count,
                COUNT(DISTINCT player_id) as unique_players
            FROM player_analytics
            WHERE event_type = 'content_view'
                AND timestamp >= ? 
                AND timestamp <= ?
            GROUP BY content_id
            ORDER BY view_count DESC
            LIMIT ?
        `).all(startDate, endDate, parseInt(limit));

        res.json(views);
    } catch (error) {
        console.error('Error fetching content views:', error);
        res.status(500).json({ error: 'Failed to fetch content views' });
    }
});

// Get error analytics
router.get('/errors', async (req, res) => {
    try {
        const db = await require('../database');
        const { start_date, end_date, limit = 20 } = req.query;

        const startDate = start_date || '2020-01-01';
        const endDate = end_date || new Date().toISOString();

        const errors = db.prepare(`
            SELECT 
                player_id,
                event_data,
                timestamp
            FROM player_analytics
            WHERE event_type = 'error'
                AND timestamp >= ? 
                AND timestamp <= ?
            ORDER BY timestamp DESC
            LIMIT ?
        `).all(startDate, endDate, parseInt(limit));

        res.json(errors.map(e => ({
            ...e,
            event_data: e.event_data ? JSON.parse(e.event_data) : {}
        })));
    } catch (error) {
        console.error('Error fetching errors:', error);
        res.status(500).json({ error: 'Failed to fetch errors' });
    }
});

// Get player activity timeline (hourly breakdown)
router.get('/players/activity', async (req, res) => {
    try {
        const db = await require('../database');
        const { start_date, end_date } = req.query;

        const startDate = start_date || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
        const endDate = end_date || new Date().toISOString();

        const activity = db.prepare(`
            SELECT 
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                COUNT(*) as event_count,
                COUNT(DISTINCT player_id) as active_players
            FROM player_analytics
            WHERE timestamp >= ? 
                AND timestamp <= ?
            GROUP BY hour
            ORDER BY hour ASC
        `).all(startDate, endDate);

        res.json(activity);
    } catch (error) {
        console.error('Error fetching player activity:', error);
        res.status(500).json({ error: 'Failed to fetch player activity' });
    }
});

module.exports = router;
