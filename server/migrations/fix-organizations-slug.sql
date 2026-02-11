-- Quick Fix: Add missing slug column to organizations table
-- Run this BEFORE the main migration if you get "column slug does not exist" error

-- Check if slug column exists, if not add it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'organizations' AND column_name = 'slug'
    ) THEN
        ALTER TABLE organizations ADD COLUMN slug TEXT UNIQUE NOT NULL DEFAULT '';
        RAISE NOTICE 'Added slug column to organizations table';
    ELSE
        RAISE NOTICE 'slug column already exists';
    END IF;
END $$;

-- Now you can run the main migration script
