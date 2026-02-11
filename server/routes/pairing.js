const express = require('express');
const router = express.Router();

// Helper: Generate 6-character alphanumeric pairing code
function generatePairingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed ambiguous chars (0, O, I, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Helper: Check if pairing code is expired (1 hour)
function isCodeExpired(expiresAt) {
    if (!expiresAt) return true;
    return new Date(expiresAt) < new Date();
}

module.exports = (db) => {
    // POST /api/pairing/generate
    // Device requests a pairing code on first boot
    router.post('/generate', (req, res) => {
        try {
            const { cpu_serial, device_uuid } = req.body;

            if (!cpu_serial || !device_uuid) {
                return res.status(400).json({
                    error: 'Missing required fields: cpu_serial, device_uuid'
                });
            }

            // Check if device already exists
            const existingPlayer = db.prepare(
                'SELECT * FROM players WHERE cpu_serial = ? OR device_uuid = ?'
            ).get(cpu_serial, device_uuid);

            if (existingPlayer) {
                // Device exists
                if (existingPlayer.account_id && existingPlayer.paired_at) {
                    // Already paired
                    return res.status(409).json({
                        error: 'Device already paired',
                        paired: true,
                        account_id: existingPlayer.account_id
                    });
                }

                // Exists but not paired - regenerate code
                const pairingCode = generatePairingCode();
                const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

                db.prepare(`
                    UPDATE players 
                    SET pairing_code = ?, 
                        pairing_code_expires_at = ?,
                        device_uuid = ?
                    WHERE id = ?
                `).run(pairingCode, expiresAt, device_uuid, existingPlayer.id);

                return res.json({
                    pairing_code: pairingCode,
                    expires_at: expiresAt,
                    qr_data: `https://api.ods-cloud.com/players/pair?code=${pairingCode}`,
                    player_id: existingPlayer.id
                });
            }

            // New device - create player record
            const { v4: uuidv4 } = require('uuid');
            const playerId = uuidv4();
            const pairingCode = generatePairingCode();
            const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
            const deviceName = `Device ${pairingCode}`;

            db.prepare(`
                INSERT INTO players (
                    id, name, cpu_serial, device_uuid, 
                    pairing_code, pairing_code_expires_at, 
                    status, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, 'offline', CURRENT_TIMESTAMP)
            `).run(playerId, deviceName, cpu_serial, device_uuid, pairingCode, expiresAt);

            res.json({
                pairing_code: pairingCode,
                expires_at: expiresAt,
                qr_data: `https://api.ods-cloud.com/players/pair?code=${pairingCode}`,
                player_id: playerId
            });

        } catch (error) {
            console.error('Error generating pairing code:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // POST /api/pairing/verify
    // Dashboard verifies pairing code and pairs device to account
    router.post('/verify', (req, res) => {
        try {
            const { pairing_code, account_id, device_name } = req.body;

            if (!pairing_code || !account_id) {
                return res.status(400).json({
                    error: 'Missing required fields: pairing_code, account_id'
                });
            }

            // Find player by pairing code
            const player = db.prepare(
                'SELECT * FROM players WHERE pairing_code = ?'
            ).get(pairing_code.toUpperCase());

            if (!player) {
                return res.status(404).json({ error: 'Invalid pairing code' });
            }

            // Check if already paired
            if (player.account_id && player.paired_at) {
                return res.status(409).json({
                    error: 'Device already paired to an account'
                });
            }

            // Check if code expired
            if (isCodeExpired(player.pairing_code_expires_at)) {
                return res.status(410).json({ error: 'Pairing code expired' });
            }

            // Pair device to account
            const finalDeviceName = device_name || player.name;
            const pairedAt = new Date().toISOString();

            db.prepare(`
                UPDATE players 
                SET account_id = ?, 
                    paired_at = ?,
                    name = ?,
                    pairing_code = NULL,
                    pairing_code_expires_at = NULL
                WHERE id = ?
            `).run(account_id, pairedAt, finalDeviceName, player.id);

            // Get updated player
            const updatedPlayer = db.prepare('SELECT * FROM players WHERE id = ?').get(player.id);

            // Emit WebSocket event (handled by server)
            if (req.app.get('io')) {
                req.app.get('io').emit('pairing:success', {
                    player_id: player.id,
                    device_uuid: player.device_uuid,
                    account_id
                });
            }

            res.json({
                success: true,
                player: updatedPlayer
            });

        } catch (error) {
            console.error('Error verifying pairing code:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    // GET /api/pairing/status/:device_uuid
    // Device polls for pairing status
    router.get('/status/:device_uuid', (req, res) => {
        try {
            const { device_uuid } = req.params;

            const player = db.prepare(
                'SELECT * FROM players WHERE device_uuid = ?'
            ).get(device_uuid);

            if (!player) {
                return res.status(404).json({ error: 'Device not found' });
            }

            if (player.account_id && player.paired_at) {
                // Paired - return config
                const config = player.config ? JSON.parse(player.config) : {};

                res.json({
                    paired: true,
                    account_id: player.account_id,
                    player_id: player.id,
                    name: player.name,
                    config,
                    playlist_id: player.playlist_id
                });
            } else {
                // Not paired
                res.json({
                    paired: false,
                    pairing_code: player.pairing_code,
                    expires_at: player.pairing_code_expires_at
                });
            }

        } catch (error) {
            console.error('Error checking pairing status:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    });

    return router;
};
