// Phase 7: Patch index.js — add deploy:ack relay, sync_status persist, page_change handler
// Also patch database.js to add getProfileById
const fs = require("fs");

// ─── Patch database.js: add getProfileById ───────────────────
let dbCode = fs.readFileSync("/opt/ods/ods-server/database.js", "utf8");

if (!dbCode.includes("getProfileById")) {
    const profileMethod = `  async getProfileById(userId) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  },

`;
    dbCode = dbCode.replace(
        "  async getOrganizationById(orgId) {",
        profileMethod + "  async getOrganizationById(orgId) {"
    );
    fs.writeFileSync("/opt/ods/ods-server/database.js", dbCode);
    console.log("✅ database.js: getProfileById added");
} else {
    console.log("⏭️  database.js: getProfileById already exists");
}

// ─── Patch index.js: socket handlers ─────────────────────────
let indexCode = fs.readFileSync("/opt/ods/ods-server/index.js", "utf8");

// 1. Replace sync_status handler (currently only logs)
const oldSyncStatus = `        // Player reports sync status after content download
        socket.on('sync_status', async (data) => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo) {
                console.log(\`📦 Sync status from \${playerInfo.playerId}:\`, data.status,
                    data.downloaded ? \`(\${data.downloaded} downloaded)\` : '');
            }
        });`;

const newSyncStatus = `        // Player reports sync status after content download — persist to Supabase
        socket.on('sync_status', async (data) => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo) {
                console.log(\`📦 Sync status from \${playerInfo.playerId}:\`, data.status,
                    data.downloaded ? \`(\${data.downloaded} downloaded)\` : '');
                try {
                    await db.updatePlayerSyncStatus(playerInfo.playerId, {
                        cache_asset_count: data.downloaded || data.asset_count || null,
                        current_page: data.current_page || null
                    });
                } catch (err) {
                    console.error('Error persisting sync status:', err.message);
                }
            }
        });

        // Player reports page change (status/content_manager/options)
        socket.on('page_change', async (data) => {
            const playerInfo = activePlayers.get(socket.id);
            if (playerInfo && data.page) {
                try {
                    await db.updatePlayer(playerInfo.playerId, { current_page: data.page });
                    console.log(\`📄 Page change from \${playerInfo.playerId}: \${data.page}\`);
                } catch (err) {
                    console.error('Error updating page:', err.message);
                }
            }
        });

        // Player acknowledges deploy — relay to Cloud dashboard
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

if (indexCode.includes(oldSyncStatus)) {
    indexCode = indexCode.replace(oldSyncStatus, newSyncStatus);
    fs.writeFileSync("/opt/ods/ods-server/index.js", indexCode);
    console.log("✅ index.js: sync_status persists to Supabase");
    console.log("✅ index.js: page_change handler added");
    console.log("✅ index.js: deploy:ack relay added");
} else {
    console.log("⚠️  index.js: sync_status handler not found (may already be patched)");
    // Try to check if already patched
    if (indexCode.includes("updatePlayerSyncStatus")) {
        console.log("   Already patched!");
    } else {
        console.log("   Manual intervention needed");
    }
}

// Verify
const final = fs.readFileSync("/opt/ods/ods-server/index.js", "utf8");
console.log("\n  deploy:ack handler:", final.includes("socket.on('deploy:ack'"));
console.log("  page_change handler:", final.includes("socket.on('page_change'"));
console.log("  sync_status persists:", final.includes("updatePlayerSyncStatus"));
