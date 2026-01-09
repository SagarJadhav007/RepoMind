import { useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ChatBubble } from "@/components/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, RefreshCcw } from "lucide-react";
import { sendChatMessage } from "@/lib/chat";
import { syncRepoFiles } from "@/lib/repoSync";
import { nanoid } from "nanoid";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

const suggestedQuestions = [
  "What are good first issues for new contributors?",
  "Explain the authentication module",
  "What are the most important files to review?",
  "How do I set up the development environment?",
];

export default function Assistant() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // TEMP: hardcoded repo for debugging
  const repoFullName = "SagarJadhav007/TIC-TAC-TOC";

  async function handleSend(message: string) {
    if (!message.trim()) return;

    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      const res = await sendChatMessage(repoFullName, message);

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content:
          res.answer || "I couldn’t find an answer in this repository.",
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: "Something went wrong. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncRepo() {
    setSyncing(true);
    try {
      const res = await syncRepoFiles(repoFullName);
      console.log("SYNC RESULT:", res);
      alert(
        `Repo synced!\nFiles synced: ${res.synced_files}\nChunks embedded: ${res.embedded_chunks}`
      );
    } catch (e) {
      console.error(e);
      alert("Repo sync failed. Check backend logs.");
    } finally {
      setSyncing(false);
    }
  }

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
              <h1 className="text-2xl font-bold">
                RepoMind Assistant
              </h1>
              <p className="text-muted-foreground">
                AI-powered help for understanding and navigating the repository.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-1 flex-col rounded-lg border bg-card shadow-card overflow-hidden">
          {/* Debug Sync Button */}
          <div className="flex justify-end px-6 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleSyncRepo}
              disabled={syncing}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {syncing ? "Syncing…" : "Sync Repo (Debug)"}
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Ask anything about this repository 👇
              </p>
            )}

            {messages.map((message) => (
              <ChatBubble
                key={message.id}
                role={message.role}
                content={message.content}
              />
            ))}

            {loading && (
              <ChatBubble
                role="assistant"
                content="Thinking…"
              />
            )}
          </div>

          {/* Suggested Questions */}
          <div className="border-t bg-muted/30 px-6 py-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-accent" />
              <span className="text-xs font-medium text-muted-foreground">
                Suggested questions
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(q)}
                  className="rounded-full border bg-card px-3 py-1.5 text-xs text-muted-foreground hover:bg-muted"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about the repository..."
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(inputValue);
                }}
                className="flex-1"
              />
              <Button
                size="icon"
                disabled={!inputValue.trim() || loading}
                onClick={() => handleSend(inputValue)}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
