'use client';

import Header from './Header';
import Sidebar from './Sidebar';
import { usePathname } from 'next/navigation';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();

    // Don't show sidebar on login page
    const showSidebar = !pathname.startsWith('/login');

    return (
        <div className="min-h-screen bg-gray-50">
            <Header />
            {showSidebar && <Sidebar />}
            <main className={showSidebar ? 'ml-60 mt-16' : 'mt-16'}>
                {children}
            </main>
        </div>
    );
}
