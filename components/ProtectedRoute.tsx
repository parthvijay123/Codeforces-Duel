'use client';

import { useUser } from '@/hooks/useUser';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { user, loading } = useUser();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-950">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect via effect
    }

    // Optionally, if handle is needed but not verified, the Navbar/Modal handles that.
    // But we might want to block access to the game until verified?
    // User request: "let them in only if logedin"
    // User also says: "verify storing it so when he hogsin it is present before hand"
    // So we probably assume if they are logged in, we use their handle.

    return <>{children}</>;
}
