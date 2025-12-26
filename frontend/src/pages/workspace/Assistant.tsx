import { useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ChatBubble } from "@/components/ChatBubble";
import { chatMessages } from "@/data/mockData";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles } from "lucide-react";

const suggestedQuestions = [
  "What are good first issues for new contributors?",
  "Explain the authentication module",
  "What are the most important files to review?",
  "How do I set up the development environment?",
];

export default function Assistant() {
  const [inputValue, setInputValue] = useState("");

  return (
    <WorkspaceLayout>
      <div className="flex h-[calc(100vh-8rem)] flex-col">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-accent p-2">
              <Bot className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">RepoMind Assistant</h1>
              <p className="text-muted-foreground">
                AI-powered help for understanding and navigating the repository.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-1 flex-col rounded-lg border border-border bg-card shadow-card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {chatMessages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}
          </div>

          {/* Suggested Questions */}
          <div className="border-t border-border bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">Suggested questions</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((question, index) => (
                <button
                  key={index}
                  onClick={() => setInputValue(question)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {question}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about the repository..."
                className="flex-1"
              />
              <Button size="icon" disabled={!inputValue.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              This is a demo UI. No actual AI functionality is implemented.
            </p>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
