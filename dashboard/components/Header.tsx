'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Header() {
    const pathname = usePathname();

    const navLinks = [
        { href: '/dashboard', label: 'Dashboard' },
        { href: '/players', label: 'Players' },
        { href: '/playlists', label: 'Playlists' },
        { href: '/content', label: 'Content Library' },
        { href: '/analytics', label: 'Analytics' },
        { href: '/network', label: 'Network' },
        { href: '/operations', label: 'Operations' },
    ];

    const isActive = (href: string) => pathname === href;

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
            <div className="px-6 h-16 flex items-center justify-between">
                {/* Left side: Logo + Navigation */}
                <div className="flex items-center gap-8">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="size-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                            <span className="material-symbols-outlined text-white text-lg">bolt</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-white">
                            ODS <span className="text-slate-400 font-medium">Cloud</span>
                        </span>
                    </Link>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${isActive(link.href)
                                        ? 'text-blue-400 bg-blue-500/10 border border-blue-500/20'
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                </div>

                {/* Right side: Status + Actions + Profile */}
                <div className="flex items-center gap-5">
                    {/* System Status */}
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Online</span>
                    </div>

                    {/* Divider */}
                    <div className="h-6 w-px bg-slate-800"></div>

                    {/* Notification Bell */}
                    <button className="text-slate-400 hover:text-white transition-colors relative">
                        <span className="material-symbols-outlined text-[20px]">notifications</span>
                        <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border border-slate-950"></span>
                    </button>

                    {/* User Avatar */}
                    <div className="flex items-center gap-3 cursor-pointer group">
                        <div className="h-9 w-9 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 border border-slate-700 overflow-hidden ring-offset-2 ring-offset-slate-950 group-hover:ring-2 ring-blue-500 transition-all">
                            <img
                                alt="User Avatar"
                                className="h-full w-full object-cover"
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBnbAUKRWg7cwB2oRH-qRJ3qzts2BP1vgmPX8zwROd6lNo0G_LdXBYJOS92DB4QjbI9_PSEBS86_0OQ0EIXh8s7Ipbpl5htYQHs8wygw50ELBsWYBb48mbrnOMnvhIWPBSQaGm6O9pMXE2IUMXQq-wPC3qdG8NpSjX4axBmTX69zkzHjfDNY5qXQIB6JVxgkvsBMtrW8MScf1NySXfDHkQv7rlv8W14WT1ukKzZl_2Zlwj-soz_RExvuppzdWZRGzXgYLg3TsQ-W570"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
}
