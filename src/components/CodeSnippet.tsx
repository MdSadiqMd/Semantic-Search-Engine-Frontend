import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CodeSnippetProps {
    code: string;
    language: string;
    className?: string;
    showLineNumbers?: boolean;
    maxHeight?: string;
}

export default function CodeSnippet({
    code,
    language,
    className,
    showLineNumbers = true,
    maxHeight = "300px"
}: CodeSnippetProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error("Failed to copy code:", error);
        }
    };

    const lines = code.split('\n');

    return (
        <div className={cn("relative group", className)}>
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCopy}
                    className="h-8 px-2 bg-card/80 backdrop-blur-sm border border-border/50"
                    data-testid="button-copy-code"
                >
                    {copied ? (
                        <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                            </svg>
                            Copied
                        </>
                    ) : (
                        <>
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                            </svg>
                            Copy
                        </>
                    )}
                </Button>
            </div>

            <div
                className="bg-muted rounded-md overflow-auto font-mono text-sm border border-border"
                style={{ maxHeight }}
            >
                <div className="relative">
                    {showLineNumbers && (
                        <div className="absolute left-0 top-0 bottom-0 w-12 bg-muted-foreground/10 border-r border-border flex flex-col text-xs text-muted-foreground">
                            {lines.map((_, index) => (
                                <div
                                    key={index}
                                    className="px-2 py-0.5 text-right leading-relaxed"
                                    style={{ minHeight: '1.5rem' }}
                                >
                                    {index + 1}
                                </div>
                            ))}
                        </div>
                    )}

                    <pre className={cn("p-4 overflow-auto", showLineNumbers && "pl-16")}>
                        <code className={`language-${language}`} data-testid="code-content">
                            {code}
                        </code>
                    </pre>
                </div>
            </div>

            <div className="absolute top-2 left-2 px-2 py-1 bg-card/80 backdrop-blur-sm border border-border/50 rounded text-xs text-muted-foreground">
                {language}
            </div>
        </div>
    );
}
