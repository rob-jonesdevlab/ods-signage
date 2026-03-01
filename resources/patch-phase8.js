// Phase 8: Patch database.js + index.js for new columns
const fs = require("fs");

// ─── database.js: add wallpaper_url to org settings ──────────
let dbCode = fs.readFileSync("/opt/ods/ods-server/database.js", "utf8");

// Add wallpaper_url to getOrganizationSettings select
dbCode = dbCode.replace(
    "offline_border_custom_animation')",
    "offline_border_custom_animation, wallpaper_url')"
);

// Add wallpaper_url + default_playlist_id to updateOrganizationSettings whitelist
dbCode = dbCode.replace(
    "'offline_border_custom_animation'];",
    "'offline_border_custom_animation', 'wallpaper_url', 'default_playlist_id'];"
);

fs.writeFileSync("/opt/ods/ods-server/database.js", dbCode);
console.log("✅ database.js: wallpaper_url + default_playlist_id added to whitelist");

// Verify
const updatedDb = fs.readFileSync("/opt/ods/ods-server/database.js", "utf8");
console.log("  wallpaper_url in select:", updatedDb.includes("wallpaper_url')"));
console.log("  wallpaper_url in whitelist:", updatedDb.includes("'wallpaper_url'"));
console.log("  default_playlist_id in whitelist:", updatedDb.includes("'default_playlist_id']"));

// ─── index.js: update deploy:ack to persist timestamps ──────
let indexCode = fs.readFileSync("/opt/ods/ods-server/index.js", "utf8");

// Replace the deploy:ack handler to persist timestamps
const oldAck = `        // Player acknowledges deploy — relay to Cloud dashboard
        socket.on('deploy:ack', (data) => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo) {
                console.log(\`✅ Deploy ACK from \${playerInfo.playerId}\`);
                io.emit('deploy:ack', {
                    playerId: playerInfo.playerId,
                    deviceUuid: playerInfo.deviceUuid,
                    timestamp: new Date().toISOString(),
                    ...data
                });
            }
        });`;

const newAck = `        // Player acknowledges deploy — persist + relay to Cloud dashboard
        socket.on('deploy:ack', async (data) => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo) {
                const now = new Date().toISOString();
                console.log(\`✅ Deploy ACK from \${playerInfo.playerId}\`);
                try {
                    await db.updatePlayer(playerInfo.playerId, {
                        last_deploy_ack: now,
                        last_deploy_timestamp: now
                    });
                } catch (err) {
                    console.error('Error persisting deploy ack:', err.message);
                }
                io.emit('deploy:ack', {
                    playerId: playerInfo.playerId,
                    deviceUuid: playerInfo.deviceUuid,
                    timestamp: now,
                    ...data
                });
            }
        });`;

if (indexCode.includes(oldAck)) {
    indexCode = indexCode.replace(oldAck, newAck);
    fs.writeFileSync("/opt/ods/ods-server/index.js", indexCode);
    console.log("✅ index.js: deploy:ack now persists timestamps");
} else {
    console.log("⚠️  index.js: deploy:ack handler not found (may differ)");
}

const updatedIndex = fs.readFileSync("/opt/ods/ods-server/index.js", "utf8");
console.log("  last_deploy_ack:", updatedIndex.includes("last_deploy_ack"));
console.log("  last_deploy_timestamp:", updatedIndex.includes("last_deploy_timestamp"));
