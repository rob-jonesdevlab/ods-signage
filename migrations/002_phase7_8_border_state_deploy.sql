-- Phase 7 + 8: ODS Server Schema Migration
-- Date: 2026-02-28
-- Description: Border settings, player state tracking, wallpaper, and deploy acknowledgments

-- ═══════════════════════════════════════════════════════════════
-- ORGANIZATIONS TABLE
-- ═══════════════════════════════════════════════════════════════

-- Offline border configuration (Phase 7)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS offline_border_template integer DEFAULT 0;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS offline_border_enabled boolean DEFAULT true;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS offline_border_width text DEFAULT 'micro';
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS offline_border_custom_colors jsonb DEFAULT NULL;
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS offline_border_custom_animation text DEFAULT NULL;

-- Wallpaper (Phase 8)
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS wallpaper_url text DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════
-- PLAYERS TABLE
-- ═══════════════════════════════════════════════════════════════

-- Player state tracking (Phase 7)
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_page text DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS cache_asset_count integer DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS cache_last_sync timestamptz DEFAULT NULL;

-- Deploy acknowledgment tracking (Phase 8)
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_deploy_ack timestamptz DEFAULT NULL;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_deploy_timestamp timestamptz DEFAULT NULL;

-- ═══════════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════════

-- Organizations: all new columns inherit existing RLS on the organizations table
-- Players: all new columns inherit existing RLS on the players table
-- No additional policies required — row-level access already enforced by org_id
