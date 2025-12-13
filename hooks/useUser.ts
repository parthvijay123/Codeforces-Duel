'use client';

import { useAuth } from '@/context/AuthContext';

export function useUser() {
    return useAuth();
}

