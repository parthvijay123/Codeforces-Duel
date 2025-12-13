'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export interface User {
    username: string;
    email: string;
    codeforcesHandle?: string;
    isVerified: boolean;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const refreshUser = () => {
        setRefreshTrigger(prev => prev + 1);
    };

    useEffect(() => {
        const fetchUser = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/auth/me', { cache: 'no-store' });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.user);
                } else {
                    setUser(null);
                }
            } catch (error) {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [refreshTrigger]);

    return (
        <AuthContext.Provider value={{ user, loading, refreshUser }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
