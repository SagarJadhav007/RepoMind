import { useEffect, useRef, useState } from "react";
import { ChatMessage } from "./ChatMessage";
import { Button } from "@/components/ui/button";
import { Send, Loader } from "lucide-react";
import { cn } from "@/lib/utils";

type Source = {
    file: string;
    snippet?: string;
};

type AssistantMessage = {
    id: string;
    role: "user" | "assistant";
    content: string;
    confidence?: "high" | "medium" | "low";
    sources?: Source[];
    reasoning?: string;
};

type ChatContainerProps = {
    messages: AssistantMessage[];
    loading: boolean;
    onSendMessage: (message: string) => void;
    placeholder?: string;
};

export function ChatContainer({
    messages,
    loading,
    onSendMessage,
    placeholder = "Ask a question about this repository...",
}: ChatContainerProps) {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = () => {
        if (input.trim() && !loading) {
            onSendMessage(input);
            setInput("");
            inputRef.current?.focus();
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-900">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.length === 0 ? (
                    <div className="flex items-center justify-center h-full text-slate-400">
                        <div className="text-center">
                            <h3 className="text-lg font-semibold mb-2">Start a conversation</h3>
                            <p className="text-sm">{placeholder}</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {messages.map((msg) => (
                            <ChatMessage
                                key={msg.id}
                                role={msg.role}
                                content={msg.content}
                                confidence={msg.confidence}
                                sources={msg.sources}
                                reasoning={msg.reasoning}
                            />
                        ))}
                        {loading && (
                            <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                    <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center">
                                        <Loader className="w-5 h-5 text-white animate-spin" />
                                    </div>
                                </div>
                                <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-2 text-slate-400">
                                    <span className="text-sm">Thinking...</span>
                                    <span className="flex gap-1">
                                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.1s" }}></span>
                                        <span className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                                    </span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="border-t border-slate-700 p-4 bg-slate-800">
                <div className="flex gap-3">
                    <input
                        ref={inputRef}
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                        placeholder={placeholder}
                        disabled={loading}
                        className={cn(
                            "flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-lg px-4 py-2 text-sm",
                            "border border-slate-600 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20",
                            "disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        )}
                    />
                    <Button
                        onClick={handleSend}
                        disabled={!input.trim() || loading}
                        size="icon"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                    </Button>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                    Press Enter to send, Shift+Enter for new line
                </p>
            </div>
        </div>
    );
}