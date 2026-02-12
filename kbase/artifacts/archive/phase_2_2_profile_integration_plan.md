# Phase 2.2: Profile Integration - Implementation Plan

## 🎯 Objective
Transform the Profile settings page from UI-only to a fully functional, production-ready implementation with form validation, Supabase integration, toast notifications, and avatar upload capabilities.

## 📦 Dependencies to Install

### Required Packages
```bash
npm install zod react-hook-form @hookform/resolvers
```

- **zod**: Schema validation library
- **react-hook-form**: Performant form library with React hooks
- **@hookform/resolvers**: Zod resolver for react-hook-form

> [!NOTE]
> **Toast system already exists!** We have `useToast` hook with Zustand at [`dashboard/hooks/useToast.ts`](file:///Users/robert.leejones/Documents/GitHub/ods-signage/dashboard/hooks/useToast.ts)

---

## 🏗️ Implementation Steps

### Step 1: Install Dependencies
```bash
cd dashboard && npm install zod react-hook-form @hookform/resolvers
```

### Step 2: Create Validation Schema
**File:** `dashboard/lib/validations/profile.ts`

```typescript
import { z } from 'zod';

export const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  organization: z.string().max(100).optional(),
  jobTitle: z.string().max(100).optional(),
  bio: z.string().max(240).optional(),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number').optional().or(z.literal('')),
  timezone: z.string().optional(),
  language: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
```

### Step 3: Create Profile API Client
**File:** `dashboard/lib/api/profile.ts`

```typescript
import { supabase } from '@/lib/supabase';
import { ProfileFormData } from '@/lib/validations/profile';

export async function updateProfile(userId: string, data: ProfileFormData) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: `${data.firstName} ${data.lastName}`,
      organization: data.organization || null,
      job_title: data.jobTitle || null,
      bio: data.bio || null,
      phone: data.phone || null,
      timezone: data.timezone || null,
      language: data.language || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId);

  if (error) throw error;
}

export async function uploadAvatar(userId: string, file: File) {
  // 1. Upload to Supabase Storage
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  // 2. Get public URL
  const { data } = supabase.storage
    .from('avatars')
    .getPublicUrl(filePath);

  // 3. Update profile with avatar URL
  const { error: updateError } = await supabase
    .from('profiles')
    .update({ avatar_url: data.publicUrl })
    .eq('id', userId);

  if (updateError) throw updateError;

  return data.publicUrl;
}
```

### Step 4: Update Profile Page Component
**File:** `dashboard/app/settings/profile/page.tsx`

**Changes:**
1. Import react-hook-form and zod
2. Replace `useState` with `useForm` from react-hook-form
3. Add form validation with Zod schema
4. Implement `handleSubmit` to call Supabase API
5. Add toast notifications for success/error
6. Add avatar upload functionality
7. Add loading states during submission

**Key Features:**
- Form validation on blur and submit
- Optimistic UI updates
- Error handling with toast notifications
- Success feedback with toast
- Avatar upload with preview
- Disabled state during submission

### Step 5: Create Supabase Storage Bucket
**Action:** Create `avatars` bucket in Supabase Dashboard

**Settings:**
- Public bucket: Yes
- File size limit: 2MB
- Allowed MIME types: `image/jpeg`, `image/png`, `image/webp`

**RLS Policies:**
```sql
-- Allow users to upload their own avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to update their own avatars
CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow public read access to avatars
CREATE POLICY "Public avatar access"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');
```

### Step 6: Add Avatar Upload UI
**Component:** Avatar section in Profile page

**Features:**
- Click avatar to trigger file input
- File validation (size, type)
- Image preview before upload
- Upload progress indicator
- Error handling for failed uploads

---

## 🎨 Reusable Patterns Created

### 1. Form Validation Pattern
```typescript
// Zod schema definition
export const schema = z.object({ ... });

// React Hook Form integration
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema),
  defaultValues: { ... }
});
```

### 2. API Client Pattern
```typescript
// Centralized API functions
export async function updateResource(id: string, data: FormData) {
  const { error } = await supabase.from('table').update(data).eq('id', id);
  if (error) throw error;
}
```

### 3. Toast Notification Pattern
```typescript
const { showToast } = useToast();

try {
  await updateProfile(userId, data);
  showToast({
    type: 'success',
    title: 'Success',
    message: 'Profile updated successfully',
  });
} catch (error) {
  showToast({
    type: 'error',
    title: 'Error',
    message: error.message,
  });
}
```

### 4. File Upload Pattern
```typescript
async function handleFileUpload(file: File) {
  // 1. Validate file
  if (file.size > MAX_SIZE) throw new Error('File too large');
  
  // 2. Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from('bucket')
    .upload(path, file);
  
  // 3. Get public URL
  const { data: { publicUrl } } = supabase.storage
    .from('bucket')
    .getPublicUrl(path);
  
  // 4. Update database record
  await supabase.from('table').update({ url: publicUrl });
}
```

---

## 📁 File Structure

```
dashboard/
├── app/settings/profile/
│   └── page.tsx                    # [MODIFY] Add form handling
├── lib/
│   ├── validations/
│   │   └── profile.ts              # [NEW] Zod schema
│   └── api/
│       └── profile.ts              # [NEW] API client functions
├── hooks/
│   └── useToast.ts                 # [EXISTS] Already implemented ✅
└── components/
    └── ToastContainer.tsx          # [EXISTS] Already implemented ✅
```

---

## ✅ Acceptance Criteria

- [ ] Form validates on blur and submit
- [ ] Profile updates persist to Supabase `profiles` table
- [ ] Success toast shows after successful update
- [ ] Error toast shows with specific error message on failure
- [ ] Avatar upload works and updates `avatar_url` in profile
- [ ] Avatar preview updates immediately after upload
- [ ] Form is disabled during submission (loading state)
- [ ] All fields properly map to database columns
- [ ] Phone number validation works correctly
- [ ] Bio character count updates in real-time
- [ ] Email field remains disabled (read-only)

---

## 🧪 Testing Checklist

### Manual Testing
1. **Form Validation**
   - [ ] Submit with empty first name → shows error
   - [ ] Submit with empty last name → shows error
   - [ ] Enter invalid phone number → shows error
   - [ ] Enter bio > 240 chars → shows error

2. **Profile Update**
   - [ ] Update all fields → saves successfully
   - [ ] Update partial fields → saves successfully
   - [ ] Check database → values persisted correctly
   - [ ] Refresh page → form shows updated values

3. **Avatar Upload**
   - [ ] Upload valid image → succeeds
   - [ ] Upload file > 2MB → shows error
   - [ ] Upload non-image file → shows error
   - [ ] Check Supabase Storage → file uploaded
   - [ ] Check database → `avatar_url` updated

4. **Toast Notifications**
   - [ ] Success toast appears after update
   - [ ] Error toast appears on failure
   - [ ] Toast auto-dismisses after duration

---

## 🚀 Deployment Steps

1. **Install dependencies** in `dashboard/`
2. **Create Supabase Storage bucket** (`avatars`)
3. **Apply RLS policies** for avatar storage
4. **Create validation schema** (`lib/validations/profile.ts`)
5. **Create API client** (`lib/api/profile.ts`)
6. **Update Profile page** with form handling
7. **Test locally** with `npm run dev`
8. **Commit and push** to GitHub
9. **Verify Vercel deployment** succeeds
10. **Test on production** at ods-cloud.com/settings/profile

---

## 📊 Success Metrics

- ✅ Form validation prevents invalid submissions
- ✅ Profile updates complete in < 1 second
- ✅ Avatar uploads complete in < 3 seconds
- ✅ Zero console errors during normal operation
- ✅ Toast notifications provide clear feedback
- ✅ All patterns are reusable for other settings pages

---

## 🔄 Next Steps (Phase 2.3-2.6)

After completing Profile Integration, these patterns will be reused for:

1. **Security Settings**: Password change form with validation
2. **Notifications Settings**: Toggle switches with Supabase updates
3. **Team Settings**: Member management with CRUD operations
4. **Billing Settings**: Stripe integration (UI patterns)
5. **API Settings**: Key generation with validation

**Estimated Time:** 1 day for Phase 2.2, then 3-4 days for remaining pages using established patterns.
