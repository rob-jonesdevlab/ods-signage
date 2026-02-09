const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { syncToSupabase } = require('../supabase');

// Create media directories
const MEDIA_DIR = path.join(__dirname, '../media');
const CONTENT_DIR = path.join(MEDIA_DIR, 'content');
const THUMBNAILS_DIR = path.join(MEDIA_DIR, 'thumbnails');

[MEDIA_DIR, CONTENT_DIR, THUMBNAILS_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, CONTENT_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Allowed file types
    const allowedTypes = {
        image: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
        video: ['video/mp4', 'video/webm', 'video/quicktime']
    };

    const allAllowed = [...allowedTypes.image, ...allowedTypes.video];

    if (allAllowed.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: images (JPEG, PNG, WebP, GIF) and videos (MP4, WebM, MOV)`));
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100MB max
    }
});

// Generate thumbnail for image
async function generateImageThumbnail(filePath, thumbnailPath) {
    await sharp(filePath)
        .resize(320, 180, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
}

// Generate thumbnail for video (first frame)
async function generateVideoThumbnail(filePath, thumbnailPath) {
    return new Promise((resolve, reject) => {
        const ffmpeg = require('fluent-ffmpeg');

        ffmpeg(filePath)
            .screenshots({
                timestamps: ['00:00:01'],
                filename: path.basename(thumbnailPath),
                folder: path.dirname(thumbnailPath),
                size: '320x180'
            })
            .on('end', resolve)
            .on('error', reject);
    });
}

// Get file metadata
function getFileMetadata(file) {
    return {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString()
    };
}

// Export factory function that receives db instance
module.exports = function (db) {
    const router = express.Router();

    // GET /api/content - List all content with search/filter/sort
    router.get('/', async (req, res) => {
        try {
            const { search, type, sort } = req.query;

            let query = 'SELECT * FROM content WHERE 1=1';
            const params = [];

            // Search filter
            if (search) {
                query += ' AND (name LIKE ? OR url LIKE ?)';
                const searchPattern = `%${search}%`;
                params.push(searchPattern, searchPattern);
            }

            // Type filter
            if (type && type !== 'all') {
                query += ' AND type = ?';
                params.push(type);
            }

            // Sorting
            switch (sort) {
                case 'name-asc':
                    query += ' ORDER BY name ASC';
                    break;
                case 'name-desc':
                    query += ' ORDER BY name DESC';
                    break;
                case 'type':
                    query += ' ORDER BY type ASC, name ASC';
                    break;
                case 'oldest':
                    query += ' ORDER BY created_at ASC';
                    break;
                default:
                    query += ' ORDER BY created_at DESC';
            }

            const content = db.prepare(query).all(...params);

            // Parse JSON fields
            const parsed = content.map(item => ({
                ...item,
                metadata: JSON.parse(item.metadata || '{}')
            }));

            res.json(parsed);
        } catch (error) {
            console.error('Error fetching content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // GET /api/content/:id - Get single content item
    router.get('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const content = db.prepare('SELECT * FROM content WHERE id = ?').get(id);

            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            content.metadata = JSON.parse(content.metadata || '{}');
            res.json(content);
        } catch (error) {
            console.error('Error fetching content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // POST /api/content - Upload new content
    router.post('/', upload.single('file'), async (req, res) => {
        try {
            if (!req.file) {
                return res.status(400).json({ error: 'No file uploaded' });
            }

            const { name, duration } = req.body;
            const file = req.file;

            // Determine content type
            const isImage = file.mimetype.startsWith('image/');
            const isVideo = file.mimetype.startsWith('video/');
            const type = isImage ? 'image' : isVideo ? 'video' : 'unknown';

            // Generate thumbnail
            const thumbnailFilename = `${path.parse(file.filename).name}_thumb.jpg`;
            const thumbnailPath = path.join(THUMBNAILS_DIR, thumbnailFilename);

            try {
                if (isImage) {
                    await generateImageThumbnail(file.path, thumbnailPath);
                } else if (isVideo) {
                    await generateVideoThumbnail(file.path, thumbnailPath);
                }
            } catch (thumbError) {
                console.error('Error generating thumbnail:', thumbError);
                // Continue without thumbnail
            }

            // Get file metadata
            const metadata = getFileMetadata(file);

            // Create content record
            const id = uuidv4();
            const contentUrl = `/media/content/${file.filename}`;
            const thumbnailUrl = fs.existsSync(thumbnailPath)
                ? `/media/thumbnails/${thumbnailFilename}`
                : null;

            const stmt = db.prepare(`
          INSERT INTO content (id, name, type, url, duration, metadata)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

            stmt.run(
                id,
                name || file.originalname,
                type,
                contentUrl,
                duration || (isImage ? 10 : 30), // Default durations
                JSON.stringify({
                    ...metadata,
                    thumbnail: thumbnailUrl,
                    filename: file.filename
                })
            );

            // Get created content
            const content = db.prepare('SELECT * FROM content WHERE id = ?').get(id);
            content.metadata = JSON.parse(content.metadata);

            // Sync to Supabase
            try {
                await syncToSupabase('content', [content]);
            } catch (syncError) {
                console.error('Error syncing to Supabase:', syncError);
                // Continue even if sync fails
            }

            res.status(201).json(content);
        } catch (error) {
            console.error('Error uploading content:', error);

            // Clean up uploaded file on error
            if (req.file && fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
            }

            res.status(500).json({ error: error.message });
        }
    });

    // POST /api/content/url - Add URL content
    router.post('/url', express.json(), async (req, res) => {
        try {
            const { name, url, duration, isNonStop } = req.body;

            if (!name || !url) {
                return res.status(400).json({ error: 'Name and URL are required' });
            }

            // Validate URL format
            try {
                new URL(url);
            } catch (e) {
                return res.status(400).json({ error: 'Invalid URL format' });
            }

            // Create content record
            const id = uuidv4();

            const stmt = db.prepare(`
                INSERT INTO content (id, name, type, url, duration, metadata)
                VALUES (?, ?, ?, ?, ?, ?)
            `);

            stmt.run(
                id,
                name,
                'url',
                url,
                duration || 10,
                JSON.stringify({
                    originalName: name,
                    mimeType: 'text/html',
                    size: 0,
                    uploadedAt: new Date().toISOString(),
                    isExternal: true,
                    isNonStop: isNonStop || false
                })
            );

            // Get created content
            const content = db.prepare('SELECT * FROM content WHERE id = ?').get(id);
            content.metadata = JSON.parse(content.metadata);

            // Sync to Supabase
            try {
                await syncToSupabase('content', [content]);
            } catch (syncError) {
                console.error('Error syncing to Supabase:', syncError);
                // Continue even if sync fails
            }

            res.status(201).json(content);
        } catch (error) {
            console.error('Error adding URL content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // PATCH /api/content/:id - Update content
    router.patch('/:id', async (req, res) => {
        try {
            const { id } = req.params;
            const { name, duration } = req.body;

            const updates = [];
            const values = [];

            if (name) {
                updates.push('name = ?');
                values.push(name);
            }
            if (duration !== undefined) {
                updates.push('duration = ?');
                values.push(duration);
            }

            if (updates.length === 0) {
                return res.status(400).json({ error: 'No updates provided' });
            }

            values.push(id);

            const stmt = db.prepare(`
          UPDATE content 
          SET ${updates.join(', ')}
          WHERE id = ?
        `);

            stmt.run(...values);

            const content = db.prepare('SELECT * FROM content WHERE id = ?').get(id);

            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            content.metadata = JSON.parse(content.metadata || '{}');

            // Sync to Supabase
            try {
                await syncToSupabase('content', [content]);
            } catch (syncError) {
                console.error('Error syncing to Supabase:', syncError);
            }

            res.json(content);
        } catch (error) {
            console.error('Error updating content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    // DELETE /api/content/:id - Delete content
    router.delete('/:id', async (req, res) => {
        try {
            const { id } = req.params;

            // Get content to find file paths
            const content = db.prepare('SELECT * FROM content WHERE id = ?').get(id);

            if (!content) {
                return res.status(404).json({ error: 'Content not found' });
            }

            const metadata = JSON.parse(content.metadata || '{}');

            // Delete files
            const contentPath = path.join(__dirname, '..', content.url);
            if (fs.existsSync(contentPath)) {
                fs.unlinkSync(contentPath);
            }

            if (metadata.thumbnail) {
                const thumbnailPath = path.join(__dirname, '..', metadata.thumbnail);
                if (fs.existsSync(thumbnailPath)) {
                    fs.unlinkSync(thumbnailPath);
                }
            }

            // Delete from database
            db.prepare('DELETE FROM content WHERE id = ?').run(id);

            res.json({ message: 'Content deleted successfully' });
        } catch (error) {
            console.error('Error deleting content:', error);
            res.status(500).json({ error: error.message });
        }
    });

    return router;
};
