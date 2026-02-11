const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const dbPromise = require('./database');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});

// Middleware
app.use(cors());
app.use(express.json());

// Serve static media files
app.use('/media', express.static('media'));

// Store active connections
const activePlayers = new Map();

// Initialize server after database is ready
async function startServer() {
    const db = await dbPromise;
    console.log('✅ Database ready');

    // Import and initialize routes with db instance
    const createContentRoutes = require('./routes/content');
    const contentRoutes = createContentRoutes(db);

    const createPairingRoutes = require('./routes/pairing');
    const pairingRoutes = createPairingRoutes(db);

    // Make io instance available to routes
    app.set('io', io);

    // API Routes
    app.get('/api/health', (req, res) => {
        res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Players API
    app.get('/api/players', (req, res) => {
        const players = db.prepare('SELECT * FROM players').all();
        res.json(players);
    });

    app.post('/api/players', (req, res) => {
        const { name, cpu_serial } = req.body;
        const id = uuidv4();

        db.prepare(`
            INSERT INTO players (id, name, cpu_serial)
            VALUES (?, ?, ?)
        `).run(id, name, cpu_serial);

        res.json({ id, name, cpu_serial });
    });

    app.get('/api/players/:id', (req, res) => {
        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
        if (!player) {
            return res.status(404).json({ error: 'Player not found' });
        }
        res.json(player);
    });

    app.patch('/api/players/:id', (req, res) => {
        const { name, status, config } = req.body;
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (status) {
            updates.push('status = ?');
            values.push(status);
        }
        if (config) {
            updates.push('config = ?');
            values.push(JSON.stringify(config));
        }

        if (updates.length > 0) {
            values.push(req.params.id);
            db.prepare(`UPDATE players SET ${updates.join(', ')} WHERE id = ?`).run(...values);
        }

        const player = db.prepare('SELECT * FROM players WHERE id = ?').get(req.params.id);
        res.json(player);
    });

    app.delete('/api/players/:id', (req, res) => {
        db.prepare('DELETE FROM players WHERE id = ?').run(req.params.id);
        res.json({ success: true });
    });

    // Content routes
    app.use('/api/content', contentRoutes);

    // Folders routes
    const foldersRoutes = require('./routes/folders');
    app.use('/api/folders', foldersRoutes);

    // Playlists routes
    const playlistsRoutes = require('./routes/playlists');
    app.use('/api/playlists', playlistsRoutes);

    // Player Groups routes
    const playerGroupsRoutes = require('./routes/player-groups');
    app.use('/api/player-groups', playerGroupsRoutes);

    // Playlist Templates routes
    const playlistTemplatesRoutes = require('./routes/playlist-templates');
    app.use('/api/playlist-templates', playlistTemplatesRoutes);

    // Audit Logs routes
    const auditLogsRoutes = require('./routes/audit-logs');
    app.use('/api/audit-logs', auditLogsRoutes);

    // Analytics routes
    const analyticsRoutes = require('./routes/analytics');
    app.use('/api/analytics', analyticsRoutes);

    // Pairing routes
    app.use('/api/pairing', pairingRoutes);


    // WebSocket connection handling
    io.on('connection', (socket) => {
        console.log('🔌 Player connected:', socket.id);

        socket.on('register', (data) => {
            const { cpu_serial, name } = data;

            // Check if player exists
            let player = db.prepare('SELECT * FROM players WHERE cpu_serial = ?').get(cpu_serial);

            if (!player) {
                // Create new player
                const id = uuidv4();
                db.prepare(`
                    INSERT INTO players (id, name, cpu_serial, status, last_seen)
                    VALUES (?, ?, ?, 'online', datetime('now'))
                `).run(id, name || 'Unknown Player', cpu_serial);

                player = db.prepare('SELECT * FROM players WHERE id = ?').get(id);
            } else {
                // Update existing player
                db.prepare(`
                    UPDATE players 
                    SET status = 'online', last_seen = datetime('now')
                    WHERE cpu_serial = ?
                `).run(cpu_serial);
            }

            // Store connection
            activePlayers.set(socket.id, {
                playerId: player.id,
                cpuSerial: cpu_serial
            });

            socket.emit('registered', player);

            // Broadcast updated player list
            const players = db.prepare('SELECT * FROM players').all();
            io.emit('players_update', players);

            console.log('✅ Player registered:', player.name);
        });

        socket.on('heartbeat', (data) => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo) {
                db.prepare(`
                    UPDATE players 
                    SET status = 'online', last_seen = datetime('now')
                    WHERE id = ?
                `).run(playerInfo.playerId);
            }
        });

        socket.on('disconnect', () => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo) {
                db.prepare(`
                    UPDATE players 
                    SET status = 'offline'
                    WHERE id = ?
                `).run(playerInfo.playerId);

                activePlayers.delete(socket.id);

                // Broadcast updated player list
                const players = db.prepare('SELECT * FROM players').all();
                io.emit('players_update', players);
            }
            console.log('🔌 Player disconnected:', socket.id);
        });
    });

    // Start server
    const PORT = process.env.PORT || 3001;
    server.listen(PORT, () => {
        console.log(`🚀 ODS Signage Server running on port ${PORT}`);
        console.log(`📊 Dashboard: http://localhost:3000`);
        console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
    });
}

// Start the server
startServer().catch(err => {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
});
