-- Create avatars storage bucket and RLS policies
-- Run this in Supabase SQL Editor

-- Create storage bucket (if not exists via UI)
-- Bucket name: avatars
-- Public: true
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/png, image/webp

-- RLS Policies for avatars bucket
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
