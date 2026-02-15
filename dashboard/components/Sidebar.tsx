'use client';

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
} from '@heroicons/react/24/outline';

interface NavItem {
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
}

// NOTE: Dashboard accessed via logo click, not sidebar navigation
const navItems: NavItem[] = [
    { name: 'Players', href: '/players', icon: TvIcon },
    { name: 'Content Library', href: '/content', icon: FolderIcon },
    { name: 'Playlists', href: '/playlists', icon: RectangleStackIcon },
    { name: 'Network', href: '/network', icon: SignalIcon },
    { name: 'Operations', href: '/operations', icon: Cog6ToothIcon },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-60 h-screen fixed left-0 top-16 bg-white border-r border-gray-200 flex flex-col">
            {/* Header */}
            <div className="px-4 py-4 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <TvIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-semibold text-gray-900">
                        Digital Signage
                    </span>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-50'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
