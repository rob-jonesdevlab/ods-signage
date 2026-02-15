import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ToastProvider from '@/components/ToastProvider'
import { AuthProvider } from '@/contexts/AuthContext'
import ErrorBoundary from '@/components/ErrorBoundary'

const inter = Inter({ subsets: ['latin'] })

// Force dynamic rendering for the entire app
// This prevents build-time prerendering which fails for auth-dependent pages
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export const metadata: Metadata = {
    title: 'ODS Digital Signage',
    description: 'Manage your digital signage players',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200"
                    rel="stylesheet"
                />
            </head>
            <body className={inter.className}>
                <ErrorBoundary>
                    <AuthProvider>
                        {children}
                        <ToastProvider />
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
