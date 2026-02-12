
// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function SettingsPage() {
    // Redirect to profile as the default settings page
    redirect('/settings/profile');
}
