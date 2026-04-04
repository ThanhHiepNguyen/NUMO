import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usersMe } from '../lib/api';

type AuthState = {
    isAuthed: boolean;
    displayName: string;
    hydrated: boolean;
};

type AuthContextValue = AuthState & {
    setAuthed: (next: AuthState) => void;
    clear: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [state, setState] = useState<AuthState>({ isAuthed: false, displayName: '', hydrated: false });

    useEffect(() => {
        let alive = true;
        (async () => {
            try {
                const me = await usersMe();
                const username = me?.data?.user?.username as string | undefined;
                const email = me?.data?.user?.email as string | undefined;
                const displayName = (username || (email ? email.split('@')[0] : '') || '').trim();
                if (!alive) return;
                setState({ isAuthed: true, displayName, hydrated: true });
            } catch {
                if (!alive) return;
                setState({ isAuthed: false, displayName: '', hydrated: true });
            }
        })();
        return () => {
            alive = false;
        };
    }, []);

    const value = useMemo<AuthContextValue>(
        () => ({
            ...state,
            setAuthed: (next) => setState(next),
            clear: () => setState({ isAuthed: false, displayName: '', hydrated: true }),
        }),
        [state],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}

