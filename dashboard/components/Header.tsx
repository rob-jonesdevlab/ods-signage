'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useState } from 'react';
import AppsMenu from '@/components/AppsMenu';
import { BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';

export default function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { signOut, profile } = useAuth();
    const [showDropdown, setShowDropdown] = useState(false);

    const handleLogout = async () => {
        await signOut();
        window.location.href = '/login';
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md h-16">
            <div className="px-6 h-full flex items-center justify-between">
                {/* Left side: Logo */}
                <div className="flex items-center">
                    <Link href="/dashboard" className="flex items-center gap-2 group">
                        <img
                            src="/ods-cloud-logo.png"
                            alt="ODS Cloud"
                            className="h-20 w-auto"
                        />
                    </Link>
                </div>

                {/* Center-Left: Apps Menu */}
                <div className="flex-1 flex items-center ml-8">
                    <AppsMenu />
                </div>

                {/* Right side: Status + Notifications + Profile */}
                <div className="flex items-center gap-4">
                    {/* System Status */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Online</span>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-gray-200"></div>

                    {/* Notification Bell */}
                    <button className="text-gray-500 hover:text-gray-700 transition-colors relative p-2 rounded-lg hover:bg-gray-100">
                        <BellIcon className="w-5 h-5" />
                        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
                    </button>

                    {/* User Menu */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-3 group p-1 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                            <div className="h-8 w-8 rounded-full overflow-hidden ring-2 ring-transparent group-hover:ring-blue-500 transition-all">
                                <img
                                    alt="User Avatar"
                                    className="h-full w-full object-cover"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnbAUKRWg7cwB2oRH-qRJ3qzts2BP1vgmPX8zwROd6lNo0G_LdXBYJOS92DB4QjbI9_PSEBS86_0OQ0EIXh8s7Ipbpl5htYQHs8wygw50ELBsWYBb48mbrnOMnvhIWPBSQaGm6O9pMXE2IUMXQq-wPC3qdG8NpSjX4axBmTX69zkzHjfDNY5qXQIB6JVxgkvsBMtrW8MScf1NySXfDHkQv7rlv8W14WT1ukKzZl_2Zlwj-soz_RExvuppzdWZRGzXgYLg3TsQ-W570"
                                />
                            </div>
                        </button>

                        {/* Dropdown Menu */}
                        {showDropdown && (
                            <div className="absolute right-0 mt-2 w-56 rounded-lg bg-white border border-gray-200 shadow-lg overflow-hidden z-50">
                                {/* User Info */}
                                <div className="px-4 py-3 border-b border-gray-200">
                                    <p className="text-sm font-medium text-gray-900">{profile?.full_name || 'User'}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{profile?.email}</p>
                                </div>

                                {/* Menu Items */}
                                <div className="py-2">
                                    <Link
                                        href="/settings/profile"
                                        className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        onClick={() => setShowDropdown(false)}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">settings</span>
                                        Settings
                                    </Link>
                                    <button
                                        onClick={handleLogout}
                                        className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[18px]">logout</span>
                                        Sign Out
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

