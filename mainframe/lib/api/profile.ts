import { supabase } from '@/lib/supabase';
import { ProfileFormData } from '@/lib/validations/profile';

/**
 * Update user profile in Supabase
 */
export async function updateProfile(userId: string, data: ProfileFormData) {
    const { error } = await supabase
        .from('profiles')
        .update({
            full_name: `${data.firstName} ${data.lastName}`.trim(),
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

/**
 * Upload avatar to Supabase Storage and update profile
 */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
    // 1. Validate file size (2MB max)
    const MAX_SIZE = 2 * 1024 * 1024; // 2MB
    if (file.size > MAX_SIZE) {
        throw new Error('File size must be less than 2MB');
    }

    // 2. Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        throw new Error('File must be a JPEG, PNG, or WebP image');
    }

    // 3. Upload to Supabase Storage
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

    // 4. Get public URL
    const { data } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

    // 5. Update profile with avatar URL
    const { error: updateError } = await supabase
        .from('profiles')
        .update({
            avatar_url: data.publicUrl,
            updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

    if (updateError) throw updateError;

    return data.publicUrl;
}
