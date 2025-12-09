
import React from "react";
import Editor from "@monaco-editor/react";
import { Copy, Check } from "lucide-react";

interface CodeEditorProps {
    value: string;
    onChange: (value: string | undefined) => void;
    language?: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({ value, onChange, language = "cpp" }) => {
    const [copied, setCopied] = React.useState(false);

    const handleCopy = () => {
        navigator.clipboard.writeText(value);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex flex-col h-full bg-[#1e1e1e] rounded-xl overflow-hidden border border-gray-800 shadow-xl">
            <div className="flex justify-between items-center px-4 py-2 bg-[#252526] border-b border-gray-700">
                <span className="text-sm font-mono text-gray-400">main.cpp</span>
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
                    value={value}
                    onChange={onChange}
                    options={{
                        minimap: { enabled: false },
                        fontSize: 14,
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 4,
                    }}
                />
            </div>
        </div>
    );
};
