// Phase 7: Patch database.js — add border fields to org settings + new methods
const fs = require("fs");
let code = fs.readFileSync("/opt/ods/ods-server/database.js", "utf8");

// 1. Update getOrganizationSettings select
code = code.replace(
    ".select('id, name, default_playlist_id, default_group_id, offline_threshold_minutes')",
    ".select('id, name, default_playlist_id, default_group_id, offline_threshold_minutes, offline_border_template, offline_border_enabled, offline_border_width, offline_border_custom_colors, offline_border_custom_animation')"
);

// 2. Update updateOrganizationSettings whitelist
code = code.replace(
    "const allowed = ['name', 'default_playlist_id', 'default_group_id', 'offline_threshold_minutes'];",
    "const allowed = ['name', 'default_playlist_id', 'default_group_id', 'offline_threshold_minutes', 'offline_border_template', 'offline_border_enabled', 'offline_border_width', 'offline_border_custom_colors', 'offline_border_custom_animation'];"
);

// 3. Add new methods before updateOrganizationSettings
const newMethods = `  async updatePlayerSyncStatus(playerId, syncData) {
    const updates = { updated_at: new Date().toISOString() };
    if (syncData.cache_asset_count !== undefined) updates.cache_asset_count = syncData.cache_asset_count;
    if (syncData.current_page !== undefined) updates.current_page = syncData.current_page;
    updates.cache_last_sync = new Date().toISOString();
    const { data, error } = await supabase
      .from('players')
      .update(updates)
      .eq('id', playerId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getOrganizationById(orgId) {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', orgId)
      .single();
    if (error && error.code === 'PGRST116') return null;
    if (error) throw error;
    return data;
  },

`;

code = code.replace(
    "  async updateOrganizationSettings(orgId, updates) {",
    newMethods + "  async updateOrganizationSettings(orgId, updates) {"
);

fs.writeFileSync("/opt/ods/ods-server/database.js", code);
console.log("✅ database.js patched");

// Verify
const updated = fs.readFileSync("/opt/ods/ods-server/database.js", "utf8");
console.log("  getOrganizationSettings includes border:", updated.includes("offline_border_template"));
console.log("  updateOrganizationSettings whitelist includes border:", updated.includes("'offline_border_template', 'offline_border_enabled'"));
console.log("  updatePlayerSyncStatus exists:", updated.includes("updatePlayerSyncStatus"));
console.log("  getOrganizationById exists:", updated.includes("getOrganizationById"));
