-- =============================================
-- Create Players Table for Supabase
-- =============================================
-- Quick table creation for testing authentication
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    cpu_serial TEXT NOT NULL,
    org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'offline' CHECK (status IN ('online', 'offline', 'error')),
    ip_address TEXT,
    group_id UUID,
    last_seen TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(cpu_serial, org_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_players_org_id ON players(org_id);
CREATE INDEX IF NOT EXISTS idx_players_status ON players(status);
CREATE INDEX IF NOT EXISTS idx_players_group_id ON players(group_id);

-- Add updated_at trigger
CREATE TRIGGER update_players_updated_at 
BEFORE UPDATE ON players
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();

-- Verify table created
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'players'
ORDER BY ordinal_position;
