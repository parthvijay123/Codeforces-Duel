import React from 'react';

interface LogoProps {
    className?: string;
}

export function Logo({ className = "w-10 h-10" }: LogoProps) {
    return (
        <svg
            viewBox="0 0 100 100"
            className={className}
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            {/* Bold round frame */}
            <rect x="10" y="10" width="80" height="80" rx="24" fill="#18181b" />
            <rect x="10" y="10" width="80" height="80" rx="24" stroke="#ccff00" strokeWidth="4" />

            {/* Code brackets */}
            <path
                d="M 38 35 L 24 50 L 38 65"
                stroke="var(--text-primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M 62 35 L 76 50 L 62 65"
                stroke="var(--text-primary)"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
            />

            {/* Bold Slash */}
            <path
                d="M 58 25 L 42 75"
                stroke="#ccff00"
                strokeWidth="10"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
}
