// Phase 7: Patch device-config.js
// - Enrich buildConfig with offline_border, player_name, account_name, api_url
// - Add enrollment endpoint
const fs = require("fs");
let code = fs.readFileSync("/opt/ods/ods-server/device-config.js", "utf8");

// 1. Update buildConfig to accept db parameter and fetch org settings
const oldBuildConfig = `    async function buildConfig(player) {
        const playlist = player.playlist_id
            ? await db.getPlaylistById(player.playlist_id)
            : null;`;

const newBuildConfig = `    async function buildConfig(player) {
        const playlist = player.playlist_id
            ? await db.getPlaylistById(player.playlist_id)
            : null;

        // Fetch org settings for border config
        let orgSettings = null;
        if (player.org_id) {
            try {
                orgSettings = await db.getOrganizationById(player.org_id);
            } catch (e) {
                console.error('Error fetching org settings for border config:', e.message);
            }
        }

        // Fetch account name from profiles
        let accountName = null;
        if (player.account_id) {
            try {
                const profile = await db.getProfileById(player.account_id);
                accountName = profile ? (profile.full_name || profile.display_name || profile.email) : null;
            } catch (e) {
                // Profile lookup is optional — don't fail config generation
            }
        }`;

code = code.replace(oldBuildConfig, newBuildConfig);

// 2. Add offline_border, player_name, account_name, api_url to config object
// Find the network block and add after it
const oldNetworkBlock = `            network: {
                heartbeat_interval_seconds: 60,
                retry_attempts: 3,
                retry_delay_seconds: 10
            }`;

const borderWidthMap = `{micro:1,mini:2,medium:3,major:4,mega:5,mammoth:6}`;

const newNetworkBlock = `            network: {
                heartbeat_interval_seconds: 60,
                retry_attempts: 3,
                retry_delay_seconds: 10
            },

            // Player identity
            player_name: player.name || null,
            account_name: accountName,
            api_url: process.env.API_URL || 'https://api.ods-cloud.com',

            // Offline border config (from org settings)
            offline_border: orgSettings ? {
                enabled: orgSettings.offline_border_enabled !== false,
                template: orgSettings.offline_border_template || 0,
                width: (${borderWidthMap})[orgSettings.offline_border_width] || 1,
                custom_colors: orgSettings.offline_border_custom_colors || null,
                custom_animation: orgSettings.offline_border_custom_animation || null
            } : {
                enabled: true,
                template: 0,
                width: 1,
                custom_colors: null,
                custom_animation: null
            }`;

code = code.replace(oldNetworkBlock, newNetworkBlock);

// 3. Add enrollment endpoint before the return router
const enrollmentEndpoint = `
    /**
     * GET /api/device/enrollment/:device_uuid
     * Returns player name and account name for the enrollment/status screen
     */
    router.get('/enrollment/:device_uuid', async (req, res) => {
        try {
            const { device_uuid } = req.params;
            const player = await db.getPlayerByDeviceUuid(device_uuid);
            if (!player) {
                return res.status(404).json({ error: 'Device not found' });
            }

            let accountName = null;
            if (player.account_id) {
                try {
                    const profile = await db.getProfileById(player.account_id);
                    accountName = profile ? (profile.full_name || profile.display_name || profile.email) : null;
                } catch (e) { /* optional */ }
            }

            res.json({
                device_name: player.name || null,
                account_name: accountName,
                organization_id: player.org_id || null,
                paired: !!(player.account_id && player.paired_at)
            });
        } catch (error) {
            console.error('Error fetching enrollment info:', error);
            res.status(500).json({ error: 'Failed to fetch enrollment info' });
        }
    });

`;

code = code.replace("    return router;", enrollmentEndpoint + "    return router;");

fs.writeFileSync("/opt/ods/ods-server/device-config.js", code);
console.log("✅ device-config.js patched");

// Verify
const updated = fs.readFileSync("/opt/ods/ods-server/device-config.js", "utf8");
console.log("  offline_border block:", updated.includes("offline_border: orgSettings"));
console.log("  player_name:", updated.includes("player_name: player.name"));
console.log("  account_name:", updated.includes("account_name: accountName"));
console.log("  api_url:", updated.includes("api_url: process.env.API_URL"));
console.log("  enrollment endpoint:", updated.includes("/enrollment/:device_uuid"));
