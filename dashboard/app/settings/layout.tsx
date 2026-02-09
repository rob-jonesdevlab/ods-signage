import { ReactNode } from 'react';
import Header from '@/components/Header';
import SettingsLayout from '@/components/SettingsLayout';

export default function SettingsRootLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <Header />
            <SettingsLayout>{children}</SettingsLayout>
        </>
    );
}
