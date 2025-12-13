import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { LogOut } from 'lucide-react';

interface HandleVerificationModalProps {
    isOpen: boolean;
    onSuccess: () => void;
}

export default function HandleVerificationModal({ isOpen, onSuccess }: HandleVerificationModalProps) {
    const { refreshUser } = useAuth();
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [handle, setHandle] = useState('');
    const [challengeProblem, setChallengeProblem] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const startVerification = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/verify-handle/challenge', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            setChallengeProblem(data.problem);
            setStep(2);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const checkSubmission = async () => {
        setError('');
        setLoading(true);
        try {
            const res = await fetch('/api/verify-handle/check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ handle }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);

            // Success!
            onSuccess();
            router.refresh();

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };



    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            refreshUser();
            router.push('/signup');
            router.refresh();
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl p-6 relative overflow-hidden">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent mb-4">
                    Verify Codeforces Handle
                </h2>

                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-200 text-sm">
                        {error}
                    </div>
                )}

                <button
                    onClick={handleLogout}
                    className="absolute top-4 right-4 text-gray-400 hover:text-red-400 transition-colors p-2 rounded-full hover:bg-white/5"
                    title="Sign Out"
                >
                    <LogOut size={18} />
                </button>

                {step === 1 && (
                    <div className="space-y-4">
                        <p className="text-gray-400 text-sm">
                            Please enter your Codeforces handle to continue. We need to verify you own this account.
                        </p>
                        <input
                            type="text"
                            value={handle}
                            onChange={(e) => setHandle(e.target.value)}
                            placeholder="Enter your Codeforces handle"
                            className="w-full px-4 py-3 bg-black/40 border border-gray-700 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none text-white placeholder-gray-600"
                        />
                        <button
                            onClick={startVerification}
                            disabled={loading || !handle}
                            className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Checking...' : 'Next'}
                        </button>
                    </div>
                )}

                {step === 2 && challengeProblem && (
                    <div className="space-y-4">
                        <p className="text-gray-300 text-sm">
                            To verify <strong>{handle}</strong>, please submit a solution to the following problem within <strong>5 minutes</strong>:
                        </p>

                        <div className="p-4 bg-black/40 border border-gray-700 rounded-lg">
                            <div className="text-lg font-bold text-white mb-1">
                                {challengeProblem.index}. {challengeProblem.name}
                            </div>
                            <a
                                href={challengeProblem.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 text-sm underline"
                            >
                                Open Problem in Codeforces ↗
                            </a>
                        </div>

                        <p className="text-xs text-gray-500">
                            You can submit any code (Compilation Error is fine). We just look for a recent submission.
                        </p>

                        <button
                            onClick={checkSubmission}
                            disabled={loading}
                            className="w-full py-3 bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                        >
                            {loading ? 'Verifying...' : 'I have submitted'}
                        </button>

                        <button
                            onClick={() => setStep(1)}
                            className="w-full py-2 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                            Back to Handle Input
                        </button>
                    </div>
                )}

                <div className="mt-6 pt-4 border-t border-gray-800 text-center">
                    <button
                        onClick={handleLogout}
                        className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                    >
                        Wrong account? Sign out and create better one
                    </button>
                </div>
            </div>
        </div>
    );
}
