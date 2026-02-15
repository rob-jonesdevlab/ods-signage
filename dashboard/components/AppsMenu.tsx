'use client';

import { Fragment, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    HomeIcon,
    TvIcon,
    RectangleStackIcon,
    FolderIcon,
    ChartBarIcon,
    SignalIcon,
    Cog6ToothIcon,
    Squares2X2Icon,
    ChevronDownIcon,
} from '@heroicons/react/24/outline';

// Role-based filtering (TODO: integrate with actual auth)
function useUserRole(): 'client' | 'admin' {
    // For now, return 'admin' - replace with actual auth check
    // Example: const { user } = useAuth(); return user?.role || 'client';
    return 'admin';
}

interface AppMenuItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    adminOnly?: boolean;
}

// NOTE: Dashboard intentionally NOT included here - accessed via logo click only
// When integrated into Otter BM, Dashboard would be added to Apps menu
// Current: Logo → ODS Dashboard | Future (integrated): Logo → BM Dashboard, Apps → ODS Dashboard
const digitalSignageApps: AppMenuItem[] = [
    { name: 'Players', href: '/players', icon: TvIcon },
    { name: 'Playlists', href: '/playlists', icon: RectangleStackIcon },
    { name: 'Content Library', href: '/content', icon: FolderIcon },
    { name: 'Analytics', href: '/analytics', icon: ChartBarIcon, adminOnly: true },
    { name: 'Network', href: '/network', icon: SignalIcon, adminOnly: true },
    { name: 'Operations', href: '/operations', icon: Cog6ToothIcon, adminOnly: true },
];

export default function AppsMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();
    const userRole = useUserRole();

    // Filter apps based on role
    const visibleApps = digitalSignageApps.filter(
        (app) => !app.adminOnly || userRole === 'admin'
    );

    return (
        <div className="relative">
            {/* Apps Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                <Squares2X2Icon className="w-5 h-5" />
                <span>Apps</span>
                <ChevronDownIcon
                    className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''
                        }`}
                />
            </button>

            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-[600px] bg-white rounded-xl shadow-2xl z-50 overflow-hidden">
                    <div className="grid grid-cols-2 divide-x divide-gray-200">
                        {/* My Apps Column */}
                        <div className="p-6">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                My apps
                            </h3>

                            {/* Digital Signage Category */}
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Digital Signage
                                </p>
                                {visibleApps.map((app) => {
                                    const Icon = app.icon;
                                    const isActive = pathname === app.href;

                                    return (
                                        <Link
                                            key={app.name}
                                            href={app.href}
                                            onClick={() => setIsOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${isActive
                                                ? 'bg-blue-50 text-blue-600'
                                                : 'text-gray-700 hover:bg-gray-50'
                                                }`}
                                        >
                                            <div
                                                className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive
                                                    ? 'bg-blue-100'
                                                    : 'bg-gray-100'
                                                    }`}
                                            >
                                                <Icon className="w-5 h-5" />
                                            </div>
                                            <span className="text-sm font-medium">{app.name}</span>
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Explore Otter Column */}
                        <div className="p-6 bg-gray-50">
                            <h3 className="text-sm font-semibold text-gray-900 mb-4">
                                Explore Otter
                            </h3>

                            {/* Intelligence & Reporting */}
                            <div className="space-y-1 mb-6">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Intelligence & Reporting
                                </p>
                                <div className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed rounded-lg">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <ChartBarIcon className="w-5 h-5" />
                                    </div>
                                    <span className="text-sm font-medium">Analytics</span>
                                </div>
                            </div>

                            {/* Guest engagement & Growth */}
                            <div className="space-y-1">
                                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                                    Guest engagement & Growth
                                </p>
                                <div className="flex items-center gap-3 px-3 py-2 text-gray-400 cursor-not-allowed rounded-lg">
                                    <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center">
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                                        </svg>
                                    </div>
                                    <span className="text-sm font-medium">CloudKitchens</span>
                                </div>
                            </div>

                            {/* Footer Link */}
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <a
                                    href="https://www.tryotter.com"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                                >
                                    Visit Otter shop
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
