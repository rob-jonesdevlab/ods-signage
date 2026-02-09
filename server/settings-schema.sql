-- =====================================================
-- ODS Cloud - Settings System Database Schema
-- =====================================================
-- This script creates the necessary tables and policies
-- for the user settings system (Phase 2)
-- =====================================================

-- 1. Extend profiles table with additional fields
-- =====================================================
ALTER TABLE profiles 
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS organization TEXT,
  ADD COLUMN IF NOT EXISTS job_title TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Los_Angeles',
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. Create notification_preferences table
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Email notifications
  email_notifications BOOLEAN DEFAULT true,
  
  -- Push notifications
  push_notifications BOOLEAN DEFAULT true,
  
  -- Notification categories
  player_offline BOOLEAN DEFAULT true,
  player_connection_issues BOOLEAN DEFAULT true,
  content_expiring BOOLEAN DEFAULT true,
  content_upload_complete BOOLEAN DEFAULT true,
  system_updates BOOLEAN DEFAULT false,
  system_maintenance BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT false,
  product_updates BOOLEAN DEFAULT true,
  
  -- Quiet hours
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- RLS Policies for notification_preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own notification preferences" ON notification_preferences;
CREATE POLICY "Users can insert own notification preferences"
  ON notification_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Create api_keys table
-- =====================================================
CREATE TABLE IF NOT EXISTS api_keys (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Key information
  name TEXT NOT NULL,
  key_prefix TEXT NOT NULL, -- e.g., "sk_live_51Msz"
  key_hash TEXT NOT NULL, -- Hashed full key (bcrypt)
  
  -- Environment
  environment TEXT CHECK (environment IN ('production', 'staging', 'development')) DEFAULT 'development',
  
  -- Usage tracking
  last_used_at TIMESTAMPTZ,
  request_count BIGINT DEFAULT 0,
  
  -- Status
  active BOOLEAN DEFAULT true,
  revoked_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(key_hash)
);

-- RLS Policies for api_keys
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own API keys" ON api_keys;
CREATE POLICY "Users can view own API keys"
  ON api_keys FOR SELECT
  USING (auth.uid() = user_id AND revoked_at IS NULL);

DROP POLICY IF EXISTS "Users can insert own API keys" ON api_keys;
CREATE POLICY "Users can insert own API keys"
  ON api_keys FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own API keys" ON api_keys;
CREATE POLICY "Users can update own API keys"
  ON api_keys FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own API keys" ON api_keys;
CREATE POLICY "Users can delete own API keys"
  ON api_keys FOR DELETE
  USING (auth.uid() = user_id);

-- 4. Create webhooks table
-- =====================================================
CREATE TABLE IF NOT EXISTS webhooks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Webhook information
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT, -- Optional webhook secret for signature verification
  
  -- Events to listen for
  events TEXT[] NOT NULL, -- e.g., ['player.offline', 'content.uploaded']
  
  -- Status
  active BOOLEAN DEFAULT true,
  
  -- Usage tracking
  last_success_at TIMESTAMPTZ,
  last_failure_at TIMESTAMPTZ,
  failure_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for webhooks
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own webhooks" ON webhooks;
CREATE POLICY "Users can manage own webhooks"
  ON webhooks FOR ALL
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_webhooks_updated_at ON webhooks;
CREATE TRIGGER update_webhooks_updated_at
    BEFORE UPDATE ON webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Create security_activity table (for audit log)
-- =====================================================
CREATE TABLE IF NOT EXISTS security_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Event information
  event_type TEXT NOT NULL, -- e.g., 'login', 'password_change', 'settings_update'
  description TEXT NOT NULL,
  
  -- Location information
  ip_address INET,
  user_agent TEXT,
  location TEXT, -- e.g., "San Francisco, US"
  
  -- Status
  status TEXT CHECK (status IN ('completed', 'failed', 'pending')) DEFAULT 'completed',
  
  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_security_activity_user_id ON security_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_security_activity_created_at ON security_activity(created_at DESC);

-- RLS Policies for security_activity
ALTER TABLE security_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own security activity" ON security_activity;
CREATE POLICY "Users can view own security activity"
  ON security_activity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can insert security activity" ON security_activity;
CREATE POLICY "System can insert security activity"
  ON security_activity FOR INSERT
  WITH CHECK (true); -- Allow system to insert for any user

-- 6. Create default notification preferences for existing users
-- =====================================================
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- =====================================================
-- Schema creation complete!
-- =====================================================
-- Next steps:
-- 1. Run this script in Supabase SQL Editor
-- 2. Verify tables were created successfully
-- 3. Test RLS policies with test user
-- =====================================================
