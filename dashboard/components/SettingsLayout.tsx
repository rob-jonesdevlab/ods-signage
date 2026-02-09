'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface SettingsLayoutProps {
    children: ReactNode;
}

interface NavItem {
    href: string;
    label: string;
    icon: string;
    key: string;
}

const navItems: NavItem[] = [
    { href: '/settings/profile', label: 'Profile', icon: 'person', key: 'profile' },
    { href: '/settings/security', label: 'Security', icon: 'lock', key: 'security' },
    { href: '/settings/notifications', label: 'Notifications', icon: 'notifications', key: 'notifications' },
    { href: '/settings/team', label: 'Team Members', icon: 'group', key: 'team' },
    { href: '/settings/billing', label: 'Billing', icon: 'receipt_long', key: 'billing' },
    { href: '/settings/api', label: 'API Access', icon: 'api', key: 'api' },
];

export default function SettingsLayout({ children }: SettingsLayoutProps) {
    const pathname = usePathname();

    const isActive = (href: string) => pathname === href;

    return (
        <div className="min-h-screen bg-slate-950">
            <main className="max-w-7xl w-full mx-auto p-6 md:p-8">
                {/* Header */}
                <header className="mb-8">
                    <h1 className="text-2xl font-bold text-white">Account Settings</h1>
                    <p className="text-slate-400 mt-1">Manage your profile details and workspace preferences.</p>
                </header>

                {/* Grid Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="lg:col-span-3">
                        <nav className="space-y-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.key}
                                    href={item.href}
                                    className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors group ${isActive(item.href)
                                            ? 'text-white bg-blue-600 shadow-lg shadow-blue-500/20'
                                            : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-300'
                                        }`}
                                >
                                    <span
                                        className={`material-symbols-outlined text-[20px] ${isActive(item.href)
                                                ? 'text-white'
                                                : 'text-slate-400 group-hover:text-slate-300'
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
