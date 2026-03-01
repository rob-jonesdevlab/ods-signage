
// Force dynamic rendering for authenticated page
export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation';

export default function SettingsPage() {
    // Default to Organization for roles with access (odsadmin, owner)
    // Profile is fallback — but since role check requires client-side auth,
    // redirect to organization (it handles its own access check)
    redirect('/settings/organization');
}
