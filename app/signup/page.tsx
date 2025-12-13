'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff } from 'lucide-react';

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

            if (!res.ok) {
                throw new Error(data.message || 'Signup failed');
            }

            if (data.requireVerification && data.userId) {
                setUserId(data.userId);
                setStep('verify');
            } else {
                // Fallback for immediate login if verification checks are disabled or fail to trigger
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

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed');
            }

            // Login successful after verification
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
        <div className="min-h-screen bg-black text-white font-sans selection:bg-purple-500/30">

            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 relative overflow-hidden">
                {/* Abstract Background Elements */}
                <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-600/20 rounded-full blur-[128px] pointer-events-none" />
                <div className="absolute bottom-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] pointer-events-none" />

                <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
                    <div className="mb-8 text-center">
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                            {step === 'signup' ? 'Create Account' : 'Verify Email'}
                        </h1>
                        <p className="text-gray-400 mt-2">
                            {step === 'signup' ? 'Join the arena and start dueling' : `Enter the code sent to ${formData.email}`}
                        </p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                            {error}
                        </div>
                    )}

                    {step === 'signup' ? (
                        <form onSubmit={handleSignup} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    required
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-600 text-white"
                                    placeholder="coding_wizard"
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    required
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-600 text-white"
                                    placeholder="name@example.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-600 text-white pr-10"
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-lg shadow-lg shadow-purple-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Creating Account...' : 'Sign Up'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-2">
                                    One-Time Password
                                </label>
                                <input
                                    type="text"
                                    required
                                    maxLength={6}
                                    className="w-full px-4 py-3 bg-black/40 border border-white/10 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all placeholder-gray-600 text-white text-center text-2xl tracking-widest"
                                    placeholder="000000"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.length !== 6}
                                className="w-full py-3.5 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white font-semibold rounded-lg shadow-lg shadow-green-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Verifying...' : 'Verify Email'}
                            </button>

                            <button
                                type="button"
                                onClick={() => setStep('signup')}
                                className="w-full mt-2 text-sm text-gray-400 hover:text-white transition-colors"
                            >
                                Back to Signup
                            </button>
                        </form>
                    )}

                    <div className="mt-8 text-center text-sm text-gray-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-purple-400 hover:text-purple-300 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
