'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Logo } from '@/components/Logo';

export default function SignupPage() {
    const router = useRouter();
    const { refreshUser } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
    });
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'signup' | 'verify'>('signup');
    const [userId, setUserId] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Signup failed');

            if (data.requireVerification && data.userId) {
                setUserId(data.userId);
                setStep('verify');
            } else {
                refreshUser();
                router.push('/');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, otp }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.message || 'Verification failed');

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
                        {step === 'signup' ? 'Create account' : 'Verify your email'}
                    </h1>
                    <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', margin: 0 }}>
                        {step === 'signup'
                            ? 'Join the arena and start dueling'
                            : `Enter the code sent to ${formData.email}`}
                    </p>
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

                    {step === 'signup' ? (
                        <form onSubmit={handleSignup} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label className="form-label">Username</label>
                                <input
                                    id="signup-username"
                                    type="text"
                                    required
                                    className="form-input"
                                    placeholder="coding_wizard"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="form-label">Email Address</label>
                                <input
                                    id="signup-email"
                                    type="email"
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
                                        id="signup-password"
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
                                id="signup-submit"
                                type="submit"
                                disabled={loading}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                                {loading ? 'Creating account…' : 'Sign Up'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                            <div>
                                <label className="form-label">Verification Code</label>
                                <input
                                    id="verify-otp"
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="form-input"
                                    placeholder="000000"
                                    style={{
                                        textAlign: 'center',
                                        fontSize: '2rem',
                                        letterSpacing: '0.4em',
                                        fontFamily: 'monospace',
                                        padding: '1.5rem',
                                    }}
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>

                            <button
                                id="verify-submit"
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="btn-primary"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                {loading ? <Loader2 size={20} className="animate-spin" /> : null}
                                {loading ? 'Verifying…' : 'Verify Email'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('signup')}
                                className="btn-ghost"
                                style={{ width: '100%', justifyContent: 'center' }}
                            >
                                Back to Signup
                            </button>
                        </form>
                    )}
                </div>

                {/* Footer link */}
                <p style={{ textAlign: 'center', fontSize: '1rem', color: 'var(--text-secondary)', marginTop: '32px' }}>
                    Already have an account?{' '}
                    <Link href="/login" style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 800, fontFamily: 'var(--font-jakarta)' }}>
                        Sign in
                    </Link>
                </p>
            </div>
        </div>
    );
}
