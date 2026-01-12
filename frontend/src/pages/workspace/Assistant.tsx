import { useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ChatBubble } from "@/components/ChatBubble";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, RefreshCcw } from "lucide-react";
import { sendChatMessage } from "@/lib/chat";
import { syncRepoFiles } from "@/lib/repoSync";
import { nanoid } from "nanoid";

/* ---------------- Types ---------------- */

type Source = {
  file: string;
  lines?: string;
  snippet?: string;
};

type AssistantResponse = {
  answer: string;
  confidence?: "high" | "medium" | "low";
  sources?: Source[];
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: "high" | "medium" | "low";
  sources?: Source[];
};

/* ---------------- Constants ---------------- */

const suggestedQuestions = [
  "What is this repository about?",
  "Where is the core logic implemented?",
  "Explain the winning conditions",
  "What files should I read first?",
];

const repoFullName = "SagarJadhav007/TIC-TAC-TOC";

/* ---------------- Component ---------------- */

export default function Assistant() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  /* ---------------- Chat ---------------- */

  async function handleSend(message: string) {
    if (!message.trim() || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        id: nanoid(),
        role: "user",
        content: message,
      },
    ]);

    setInputValue("");
    setLoading(true);

    try {
      const res: AssistantResponse = await sendChatMessage(
        repoFullName,
        message
      );

      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content:
            res.answer || "I couldn’t find an answer in this repository.",
          confidence: res.confidence,
          sources: res.sources || [],
        },
      ]);
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

  /* ---------------- Repo Sync ---------------- */

  async function handleSyncRepo() {
    setSyncing(true);
    try {
      const res = await syncRepoFiles(repoFullName);
      alert(
        `Repo synced successfully!\n\nFiles synced: ${res.synced_files}\nChunks embedded: ${res.embedded_chunks}`
      );
    } catch (err) {
      console.error(err);
      alert("Repo sync failed. Check backend logs.");
    } finally {
      setSyncing(false);
    }
  }

  /* ---------------- UI ---------------- */

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
              <h1 className="text-2xl font-bold">RepoMind Assistant</h1>
              <p className="text-muted-foreground">
                Ask questions and get answers with file-level citations.
              </p>
            </div>
          </div>
        </div>

        {/* Chat Container */}
        <div className="flex flex-1 flex-col rounded-lg border bg-card shadow-card overflow-hidden">
          {/* Sync Button */}
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

            {messages.map((msg) => (
              <ChatBubble
                key={msg.id}
                role={msg.role}
                content={msg.content}
                confidence={msg.confidence}
                sources={msg.sources}
              />
            ))}

            {loading && (
              <ChatBubble role="assistant" content="Thinking…" />
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
              {suggestedQuestions.map((q) => (
                <button
                  key={q}
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
