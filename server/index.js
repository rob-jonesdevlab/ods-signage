const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const dbPromise = require('./database');
const { authMiddleware, requireODSStaff } = require('./middleware/auth');
const { apiLimiter, authLimiter, uploadLimiter } = require('./middleware/rate-limit');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST']
    }
});


// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            'https://ods-cloud.com',
            'https://www.ods-cloud.com',
            'http://localhost:3000' // Development
        ];

        // Allow requests with no origin (like mobile apps, curl, Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());


// Apply rate limiting to all API routes
app.use('/api/', apiLimiter);


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

    // Public routes (no auth required, but rate limited for security)
    app.use('/api/pairing', authLimiter, pairingRoutes);


    // Protected routes (auth required)
    const createPlayersRoutes = require('./routes/players');
    const playersRoutes = createPlayersRoutes(db);
    app.use('/api/players', authMiddleware, playersRoutes);

    app.use('/api/content', authMiddleware, uploadLimiter, contentRoutes);

    app.use('/api/folders', authMiddleware, require('./routes/folders'));
    app.use('/api/playlists', authMiddleware, require('./routes/playlists'));
    app.use('/api/player-groups', authMiddleware, require('./routes/player-groups'));
    app.use('/api/playlist-templates', authMiddleware, require('./routes/playlist-templates'));
    app.use('/api/analytics', authMiddleware, require('./routes/analytics'));

    // System metrics and scheduled updates (Phase 3)
    app.use('/api/system-metrics', authMiddleware, require('./routes/system-metrics'));
    app.use('/api/scheduled-updates', authMiddleware, require('./routes/scheduled-updates'));

    // ODS Staff only routes
    app.use('/api/audit-logs', authMiddleware, requireODSStaff, require('./routes/audit-logs'));

    // View As routes (ODS Staff only)
    app.use('/api/view-as', authMiddleware, requireODSStaff, require('./routes/view-as'));


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
