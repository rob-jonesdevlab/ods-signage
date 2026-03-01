'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SettingsLayoutProps {
    children: ReactNode;
}

interface NavItem {
    href: string;
    label: string;
    icon: string;
    key: string;
}

// Base nav items visible to all users
const baseNavItems: NavItem[] = [
    { href: '/settings/profile', label: 'Profile', icon: 'person', key: 'profile' },
    { href: '/settings/security', label: 'Security', icon: 'lock', key: 'security' },
    { href: '/settings/notifications', label: 'Notifications', icon: 'notifications', key: 'notifications' },
    { href: '/settings/team', label: 'Team Members', icon: 'group', key: 'team' },
    { href: '/settings/billing', label: 'Billing', icon: 'receipt_long', key: 'billing' },
    { href: '/settings/api', label: 'API Access', icon: 'api', key: 'api' },
];

// Organization nav item (shown only to odsadmin, owner, or odstech in View As)
const orgNavItem: NavItem = {
    href: '/settings/organization',
    label: 'Organization',
    icon: 'business',
    key: 'organization'
};

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();
    const { profile } = useAuth();

    const isActive = (href: string) => pathname === href;

    // Role-gated Organization section:
    // - odsadmin: always visible
    // - owner: always visible (managing their own org)
    // - odstech: visible only when using View As for an owner role
    //   (view_as context not yet in AuthContext, so odstech gets it later)
    // - viewer/editor/manager: never
    const canSeeOrg = profile?.role === 'odsadmin' || profile?.role === 'owner';

    const navItems = canSeeOrg ? [orgNavItem, ...baseNavItems] : baseNavItems;

    return (
        <div className="min-h-screen bg-gray-50">
            <main className="max-w-7xl w-full mx-auto p-6 md:p-8">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Account Settings</h1>
                    <p className="text-gray-500 mt-1">Manage your profile details and workspace preferences.</p>
                </header>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:col-span-3">
                        <nav className="space-y-1 lg:sticky lg:top-24">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive(item.href)
                                        ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/20'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                        }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[20px] ${isActive(item.href)
                                            ? 'text-white'
                                            : 'text-gray-400 group-hover:text-gray-600'
                                            }`}
                                    >
                                        {item.icon}
                                    </span>
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <div className="lg:col-span-9">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
