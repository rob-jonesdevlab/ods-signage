'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

type UserRole = 'system' | 'odsadmin' | 'odsmanager' | 'supervisor' | 'standard'

interface UserProfile {
    id: string
    email: string
    full_name: string | null
    role: UserRole
    organization_id: string | null
    // Extended profile fields
    bio: string | null
    avatar_url: string | null
    organization: string | null
    job_title: string | null
    phone: string | null
    timezone: string | null
    language: string | null
    created_at: string
    updated_at: string | null
}


interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    hasRole: (roles: UserRole[]) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setLoading(false)
            }
        })

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null)
            if (session?.user) {
                fetchProfile(session.user.id)
            } else {
                setProfile(null)
                setLoading(false)
            }
        })

        return () => subscription.unsubscribe()
    }, [])

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single()

            if (error) throw error
            setProfile(data)
        } catch (error) {
            console.error('Error fetching profile:', error)
        } finally {
            setLoading(false)
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) return { error }

            // Sync session to cookie for middleware
            if (data.session) {
                const tokenKey = 'sb-dimcecmdkoaxakknftwg-auth-token'
                document.cookie = `${tokenKey}=${encodeURIComponent(JSON.stringify(data.session))}; path=/; max-age=604800; SameSite=Lax`
            }

            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signOut = async () => {
        await supabase.auth.signOut()
    }

    const hasRole = (roles: UserRole[]) => {
        if (!profile) return false
        return roles.includes(profile.role)
    }

    return (
        <AuthContext.Provider
            value={{
                user,
                profile,
                loading,
                signIn,
                signOut,
                hasRole,
            }}
        >
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
