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

            if (!res.ok) {
                throw new Error(data.message || 'Signup failed');
            }

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

            if (!res.ok) {
                throw new Error(data.message || 'Verification failed');
            }

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
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-80px)] px-4 relative overflow-hidden">
            {/* Abstract Background Elements */}
            <div className="absolute top-1/4 -right-32 w-96 h-96 bg-[#c084fc]/10 rounded-full blur-[150px] pointer-events-none" />
            <div className="absolute bottom-1/4 -left-32 w-96 h-96 bg-[#00E5FF]/10 rounded-full blur-[150px] pointer-events-none" />

            <div className="w-full max-w-md glass-panel p-10 rounded-[2rem] relative z-10 animate-in zoom-in-95 duration-500">
                <div className="mb-10 text-center flex flex-col items-center">
                    <Logo className="w-16 h-16 mb-6" />
                    <h1 className="text-3xl font-black text-white tracking-tight">
                        {step === 'signup' ? 'Create Account' : 'Verify Email'}
                    </h1>
                    <p className="text-gray-400 mt-2 font-medium">
                        {step === 'signup' ? 'Join the arena and start dueling' : `Enter the code sent to ${formData.email}`}
                    </p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm font-semibold flex items-center justify-center">
                        {error}
                    </div>
                )}

                {step === 'signup' ? (
                    <form onSubmit={handleSignup} className="space-y-5">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Username
                            </label>
                            <input
                                type="text"
                                required
                                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none transition-all placeholder-gray-600 text-white font-medium"
                                placeholder="coding_wizard"
                                value={formData.username}
                                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Email Address
                            </label>
                            <input
                                type="email"
                                required
                                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none transition-all placeholder-gray-600 text-white font-medium"
                                placeholder="name@example.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                Password
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    required
                                    className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none transition-all placeholder-gray-600 text-white font-medium pr-12"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors p-1"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 mt-4 bg-gradient-to-r from-[#00E5FF] to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-black font-bold rounded-xl shadow-[0_0_20px_rgba(0,229,255,0.3)] hover:shadow-[0_0_30px_rgba(0,229,255,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {loading ? 'Creating Account...' : 'Sign Up'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                                One-Time Password
                            </label>
                            <input
                                type="text"
                                required
                                maxLength={6}
                                className="w-full px-5 py-4 bg-black/40 border border-white/10 rounded-xl focus:ring-2 focus:ring-[#00E5FF] focus:border-transparent outline-none transition-all placeholder-gray-600 text-white text-center text-3xl tracking-[0.5em] font-medium"
                                placeholder="000000"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || otp.length !== 6}
                            className="w-full py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
                            {loading ? 'Verifying...' : 'Verify Email'}
                        </button>

                        <button
                            type="button"
                            onClick={() => setStep('signup')}
                            className="w-full mt-4 text-sm font-bold text-gray-500 hover:text-white transition-colors"
                        >
                            Back to Signup
                        </button>
                    </form>
                )}

                <div className="mt-8 text-center text-sm font-medium text-gray-400">
                    Already have an account?{' '}
                    <Link href="/login" className="text-[#00E5FF] hover:text-white transition-colors hover:underline">
                        Sign in
                    </Link>
                </div>
            </div>
        </div>
    );
}
