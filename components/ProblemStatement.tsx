'use client';

import { useEffect, useRef } from 'react';

interface ProblemStatementProps {
    html: string;
}

declare global {
    interface Window {
        MathJax: any;
    }
}

export function ProblemStatement({ html }: ProblemStatementProps) {
    const containerRef = useRef<HTMLDivElement>(null);

    // Load MathJax once on mount
    useEffect(() => {
        if (typeof window === 'undefined') return;

        // Configure MathJax before loading
        if (!window.MathJax) {
            window.MathJax = {
                tex: {
                    inlineMath: [['$', '$'], ['\\(', '\\)']],
                    displayMath: [['$$', '$$'], ['\\[', '\\]']],
                    processEscapes: true,
                    processEnvironments: true,
                },
                options: {
                    skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
                },
                startup: {
                    typeset: false, // Don't auto-typeset the whole page
                },
            };

            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-chtml.js';
            script.async = true;
            script.id = 'mathjax-script';
            document.head.appendChild(script);
        }
    }, []);

    // Re-typeset whenever html content changes
    useEffect(() => {
        if (!html || !containerRef.current) return;

        const typeset = () => {
            if (window.MathJax && window.MathJax.typesetPromise) {
                window.MathJax.typesetPromise([containerRef.current]).catch(console.error);
            } else {
                // MathJax not loaded yet, retry
                setTimeout(typeset, 300);
            }
        };

        // Small delay to allow DOM to update
        const timer = setTimeout(typeset, 100);
        return () => clearTimeout(timer);
    }, [html]);

    return (
        <div ref={containerRef}>
            <style>{`
                .problem-statement { color: #c9d1d9; font-size: 14px; line-height: 1.7; }
                .problem-statement .header { margin-bottom: 20px; }
                .problem-statement .title { font-size: 1.4em; font-weight: bold; margin-bottom: 8px; color: #e6edf3; }
                .problem-statement .time-limit,
                .problem-statement .memory-limit,
                .problem-statement .input-file,
                .problem-statement .output-file { font-size: 0.82em; color: #8b949e; margin-bottom: 4px; }
                .problem-statement p { margin-bottom: 1em; }
                .problem-statement .section-title { font-weight: bold; font-size: 1.05em; color: #58a6ff; margin: 1.5em 0 0.5em 0; }
                .problem-statement .input-specification,
                .problem-statement .output-specification,
                .problem-statement .note { margin-top: 1.2em; }
                .sample-test .input, .sample-test .output { border: 1px solid #30363d; background: #161b22; border-radius: 6px; margin-bottom: 10px; overflow: hidden; }
                .sample-test .title { font-size: 0.8em; color: #8b949e; padding: 6px 12px; border-bottom: 1px solid #30363d; }
                .sample-test pre { padding: 10px 12px; margin: 0; font-family: 'Fira Mono', 'Consolas', monospace; white-space: pre-wrap; font-size: 13px; color: #c9d1d9; }
                .tex-font-style-tt { font-family: 'Fira Mono', monospace; background: #21262d; padding: 2px 5px; border-radius: 4px; font-size: 0.9em; }
                .tex-font-style-bf { font-weight: bold; }
                .tex-font-style-it { font-style: italic; }
                mjx-container { font-size: 1em !important; }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: html }} />
        </div>
    );
}
