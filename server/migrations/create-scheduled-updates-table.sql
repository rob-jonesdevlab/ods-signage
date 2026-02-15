-- Create scheduled_updates table for Operations page
CREATE TABLE IF NOT EXISTS scheduled_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('playlist', 'firmware', 'maintenance', 'content')),
    targets JSONB NOT NULL DEFAULT '[]'::jsonb,
    schedule_date DATE NOT NULL,
    schedule_time TIME NOT NULL,
    recurrence JSONB DEFAULT NULL,
    notifications JSONB DEFAULT '{"emailOnCompletion": false, "alertOnFailure": true}'::jsonb,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_user_id ON scheduled_updates(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_schedule_date ON scheduled_updates(schedule_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_updates_status ON scheduled_updates(status);

-- Enable Row Level Security
ALTER TABLE scheduled_updates ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own scheduled updates
CREATE POLICY "Users can view their own scheduled updates"
    ON scheduled_updates FOR SELECT
    USING (auth.uid() = user_id);

-- RLS Policy: Users can create their own scheduled updates
CREATE POLICY "Users can create their own scheduled updates"
    ON scheduled_updates FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Users can update their own scheduled updates
CREATE POLICY "Users can update their own scheduled updates"
    ON scheduled_updates FOR UPDATE
    USING (auth.uid() = user_id);

-- RLS Policy: Users can delete their own scheduled updates
CREATE POLICY "Users can delete their own scheduled updates"
    ON scheduled_updates FOR DELETE
    USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_scheduled_updates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_scheduled_updates_updated_at
    BEFORE UPDATE ON scheduled_updates
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_updates_updated_at();

-- Add comment
COMMENT ON TABLE scheduled_updates IS 'Stores scheduled system updates (playlists, firmware, maintenance, content) for the Operations page';
