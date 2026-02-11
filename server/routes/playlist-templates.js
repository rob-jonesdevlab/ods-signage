const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const db = require('../database');

// List all templates
router.get('/', (req, res) => {
    try {
        const templates = db.prepare(`
            SELECT id, name, description, organization_id, 
                   content_items, duration_per_item,
                   created_at, updated_at
            FROM playlist_templates
            ORDER BY name ASC
        `).all();

        res.json(templates.map(t => ({
            ...t,
            content_items: JSON.parse(t.content_items || '[]'),
            contentCount: JSON.parse(t.content_items || '[]').length
        })));
    } catch (error) {
        console.error('Error fetching templates:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// Get single template
router.get('/:id', (req, res) => {
    try {
        const template = db.prepare(`
            SELECT id, name, description, organization_id, 
                   content_items, duration_per_item,
                   created_at, updated_at
            FROM playlist_templates
            WHERE id = ?
        `).get(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        res.json({
            ...template,
            content_items: JSON.parse(template.content_items || '[]')
        });
    } catch (error) {
        console.error('Error fetching template:', error);
        res.status(500).json({ error: 'Failed to fetch template' });
    }
});

// Create template
router.post('/', (req, res) => {
    try {
        const { name, description, content_items, duration_per_item, organization_id } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        const id = uuidv4();

        db.prepare(`
            INSERT INTO playlist_templates 
            (id, name, description, content_items, duration_per_item, organization_id)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            id,
            name,
            description || '',
            JSON.stringify(content_items || []),
            duration_per_item || 10,
            organization_id || null
        );

        res.json({
            id,
            name,
            description,
            content_items: content_items || [],
            duration_per_item: duration_per_item || 10,
            organization_id,
            contentCount: (content_items || []).length
        });
    } catch (error) {
        console.error('Error creating template:', error);
        res.status(500).json({ error: 'Failed to create template' });
    }
});

// Update template
router.put('/:id', (req, res) => {
    try {
        const { name, description, content_items, duration_per_item } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        db.prepare(`
            UPDATE playlist_templates 
            SET name = ?, description = ?, content_items = ?, 
                duration_per_item = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        `).run(
            name,
            description || '',
            JSON.stringify(content_items || []),
            duration_per_item || 10,
            req.params.id
        );

        res.json({ success: true });
    } catch (error) {
        console.error('Error updating template:', error);
        res.status(500).json({ error: 'Failed to update template' });
    }
});

// Delete template
router.delete('/:id', (req, res) => {
    try {
        db.prepare('DELETE FROM playlist_templates WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting template:', error);
        res.status(500).json({ error: 'Failed to delete template' });
    }
});

// Create playlist from template
router.post('/:id/create-playlist', (req, res) => {
    try {
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Playlist name is required' });
        }

        const template = db.prepare('SELECT * FROM playlist_templates WHERE id = ?').get(req.params.id);

        if (!template) {
            return res.status(404).json({ error: 'Template not found' });
        }

        const playlistId = uuidv4();
        const contentItems = JSON.parse(template.content_items || '[]');

        db.prepare(`
            INSERT INTO playlists (id, name, content_items, duration_per_item, organization_id)
            VALUES (?, ?, ?, ?, ?)
        `).run(
            playlistId,
            name,
            template.content_items,
            template.duration_per_item,
            template.organization_id
        );

        res.json({
            id: playlistId,
            name,
            content_items: contentItems,
            duration_per_item: template.duration_per_item,
            organization_id: template.organization_id
        });
    } catch (error) {
        console.error('Error creating playlist from template:', error);
        res.status(500).json({ error: 'Failed to create playlist from template' });
    }
});

module.exports = router;
