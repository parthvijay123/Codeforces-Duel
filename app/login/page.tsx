'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function LoginPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Login failed');

            refreshUser();
            router.push('/');
            router.refresh();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{
            minHeight: 'calc(100vh - 80px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
        }}>
            <div style={{ width: '100%', maxWidth: '480px' }}>

                {/* Header */}
                <div style={{ marginBottom: '40px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    <Logo className="w-16 h-16" />
                    <h1 style={{
                        fontFamily: 'var(--font-jakarta), sans-serif',
                        fontSize: '2.5rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        letterSpacing: '-0.03em',
                        margin: '24px 0 8px 0',
                    }}>
                        Welcome back
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>Sign in to continue your duels</p>
                </div>

                {/* Card */}
                <div className="card" style={{ padding: '48px' }}>

                    {/* Error */}
                    {error && (
                        <div style={{
                            marginBottom: '24px',
                            padding: '16px',
                            background: 'rgba(244, 63, 94, 0.1)',
                            border: '1px solid rgba(244, 63, 94, 0.2)',
                            borderRadius: '1rem',
                            fontSize: '0.9rem',
                            color: 'var(--danger)',
                            fontWeight: 600,
                        }}>
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <div>
                            <label className="form-label">Email or Username</label>
                            <input
                                id="login-email"
                                type="text"
                                required
                                className="form-input"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    id="login-password"
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="form-input"
                                    placeholder="••••••••"
                                    style={{ paddingRight: '48px' }}
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute',
                                        right: '16px',
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none',
                                        border: 'none',
                                        cursor: 'pointer',
                                        color: 'var(--text-muted)',
                                        padding: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                    }}
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            id="login-submit"
                            type="submit"
                            disabled={loading}
                            className="btn-primary"
                            style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                        >
                            {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                            {loading ? 'Signing in…' : 'Sign In'}
                        </button>
                    </form>
                </div>

                {/* Footer link */}
                <p style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '32px' }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/signup" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 800, fontFamily: 'var(--font-jakarta)' }}>
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    );
}
