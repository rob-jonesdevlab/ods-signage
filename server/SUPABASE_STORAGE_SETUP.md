# Supabase Storage Setup for Avatar Uploads

## Step 1: Create Storage Bucket

1. Go to Supabase Dashboard → Storage
2. Click "New bucket"
3. Configure bucket:
   - **Name**: `avatars`
   - **Public bucket**: ✅ Yes (checked)
   - **File size limit**: `2097152` (2MB in bytes)
   - **Allowed MIME types**: `image/jpeg,image/png,image/webp`

## Step 2: Apply RLS Policies

1. Go to Supabase Dashboard → SQL Editor
2. Click "New query"
3. Paste the contents of [`server/avatar-storage-policies.sql`](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/avatar-storage-policies.sql)
4. Click "Run"

## Step 3: Verify Setup

### Test Upload
1. Navigate to https://ods-cloud.com/settings/profile
2. Click "Change Avatar" or the edit button on the avatar
3. Select an image file (< 2MB, JPEG/PNG/WebP)
4. Verify upload completes successfully
5. Check Supabase Storage → avatars bucket for the uploaded file

### Test RLS Policies
1. Upload an avatar as user A
2. Log out and log in as user B
3. Verify user B cannot delete/modify user A's avatar
4. Verify user B can view user A's avatar (public read)

## Troubleshooting

### Upload Fails with "Permission Denied"
- Check that RLS policies were applied correctly
- Verify the bucket is set to public
- Check that the user is authenticated

### Upload Fails with "File Too Large"
- Verify file is < 2MB
- Check bucket file size limit setting

### Avatar Doesn't Display
- Check browser console for CORS errors
- Verify the `avatar_url` was saved to the profiles table
- Check that the file exists in the avatars bucket

## SQL Script

The RLS policies are defined in:
[`server/avatar-storage-policies.sql`](file:///Users/robert.leejones/Documents/GitHub/ods-signage/server/avatar-storage-policies.sql)

```sql
-- Users can upload own avatar
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can update own avatar
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public avatar access
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- Users can delete own avatar
CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```
