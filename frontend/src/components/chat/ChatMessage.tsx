import { MessageCircle, CheckCircle, AlertCircle, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Source = {
    file: string;
    snippet?: string;
};

type MessageProps = {
    role: "user" | "assistant";
    content: string;
    confidence?: "high" | "medium" | "low";
    sources?: Source[];
    reasoning?: string;
};

export function ChatMessage({
    role,
    content,
    confidence,
    sources,
    reasoning,
}: MessageProps) {
    const isUser = role === "user";

    const confidenceColor = {
        high: "text-green-500 bg-green-500/10",
        medium: "text-yellow-500 bg-yellow-500/10",
        low: "text-red-500 bg-red-500/10",
    };

    const confidenceIcon = {
        high: <CheckCircle className="w-4 h-4" />,
        medium: <AlertCircle className="w-4 h-4" />,
        low: <AlertCircle className="w-4 h-4" />,
    };

    return (
        <div className={cn("flex gap-4 mb-6", isUser ? "justify-end" : "justify-start")}>
            {!isUser && (
                <div className="flex-shrink-0">
                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                        <MessageCircle className="w-5 h-5 text-white" />
                    </div>
                </div>
            )}

            <div className={cn("max-w-2xl", isUser && "order-last")}>
                {/* Message Content */}
                <div
                    className={cn(
                        "rounded-lg p-4 mb-2",
                        isUser
                            ? "bg-blue-600 text-white"
                            : "bg-slate-800 text-slate-100 border border-slate-700"
                    )}
                >
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{content}</p>
                </div>

                {/* Confidence Badge & Reasoning */}
                {!isUser && confidence && (
                    <div className="space-y-2">
                        <div className={cn("flex items-center gap-2 px-3 py-2 rounded-md text-xs font-medium", confidenceColor[confidence])}>
                            {confidenceIcon[confidence]}
                            <span className="capitalize">Confidence: {confidence}</span>
                        </div>

                        {reasoning && (
                            <p className="text-xs text-slate-400 px-3">{reasoning}</p>
                        )}
                    </div>
                )}

                {/* Sources */}
                {!isUser && sources && sources.length > 0 && (
                    <div className="mt-3 space-y-2">
                        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sources</p>
                        <div className="space-y-2">
                            {sources.map((source, idx) => (
                                <div
                                    key={idx}
                                    className="bg-slate-900 border border-slate-700 rounded-md p-3 hover:border-slate-600 transition-colors"
                                >
                                    <div className="flex items-start gap-2 mb-2">
                                        <FileText className="w-4 h-4 text-slate-500 flex-shrink-0 mt-0.5" />
                                        <a
                                            href="#"
                                            className="text-xs font-mono text-blue-400 hover:text-blue-300 break-all"
                                        >
                                            {source.file}
                                        </a>
                                    </div>
                                    {source.snippet && (
                                        <pre className="text-xs text-slate-400 bg-black/30 p-2 rounded border border-slate-800 overflow-auto max-h-24">
                                            <code>{source.snippet}</code>
                                        </pre>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}