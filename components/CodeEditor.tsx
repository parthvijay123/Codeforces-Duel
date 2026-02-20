
import React, { useRef, useEffect } from "react";
import Editor, { OnMount } from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";
import * as Y from 'yjs';
import { YjsSocketProvider } from '@/lib/yjs-socket-provider';

interface CodeEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    language?: string;
    // Collaborative editing props
    collaborative?: boolean;
    ydoc?: Y.Doc | null;
    provider?: YjsSocketProvider | null;
    userName?: string;
    userColor?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
    value,
    onChange,
    language = "cpp",
    collaborative = false,
    ydoc,
    provider,
    userName,
    userColor,
}) => {
    const [copied, setCopied] = React.useState(false);
    const editorRef = useRef<any>(null);
    const bindingRef = useRef<any>(null);

    const handleCopy = () => {
        const text = collaborative && ydoc
            ? ydoc.getText('code').toString()
            : value;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;

        if (collaborative && ydoc && provider) {
            // Dynamically import y-monaco to avoid SSR issues
            import('y-monaco').then(({ MonacoBinding }) => {
                const ytext = ydoc.getText('code');

                // Clean up previous binding
                if (bindingRef.current) {
                    bindingRef.current.destroy();
                }

                bindingRef.current = new MonacoBinding(
                    ytext,
                    editor.getModel()!,
                    new Set([editor]),
                    provider.awareness
                );
            }).catch(err => {
                console.error('Failed to load y-monaco:', err);
            });
        }
    };

    // Cleanup binding on unmount or when collaborative props change
    useEffect(() => {
        return () => {
            if (bindingRef.current) {
                bindingRef.current.destroy();
                bindingRef.current = null;
            }
        };
    }, [collaborative, ydoc, provider]);

    // Re-bind when collaborative props change
    useEffect(() => {
        if (collaborative && ydoc && provider && editorRef.current) {
            import('y-monaco').then(({ MonacoBinding }) => {
                const ytext = ydoc.getText('code');
                
                if (bindingRef.current) {
                    bindingRef.current.destroy();
                }

                bindingRef.current = new MonacoBinding(
                    ytext,
                    editorRef.current.getModel()!,
                    new Set([editorRef.current]),
                    provider.awareness
                );
            }).catch(err => {
                console.error('Failed to load y-monaco:', err);
            });
        }
    }, [collaborative, ydoc, provider]);

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-gray-700">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-gray-400">main.cpp</span>
                    {collaborative && (
                        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                            style={{
                                background: 'rgba(168, 85, 247, 0.15)',
                                color: '#a855f7',
                                border: '1px solid rgba(168, 85, 247, 0.3)',
                            }}
                        >
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#a855f7', display: 'inline-block', animation: 'pulse 1.5s infinite' }} />
                            Live Collab
                        </span>
                    )}
                </div>
                <button
                    onClick={handleCopy}
                    className="flex items-center gap-1.5 text-xs bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded transition-colors text-gray-200"
                >
                    {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? "Copied" : "Copy Code"}
                </button>
            </div>
            <div className="flex-1">
                <Editor
                    height="100%"
                    defaultLanguage={language}
                    theme="vs-dark"
                    value={collaborative ? undefined : value}
                    onChange={collaborative ? undefined : onChange}
                    onMount={handleMount}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                        readOnly: false,
                    }}
                />
            </div>
        </div>
    );
};
