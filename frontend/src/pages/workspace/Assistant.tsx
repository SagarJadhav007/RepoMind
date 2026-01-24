import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { nanoid } from "nanoid";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { SuggestedQuestions } from "@/components/chat/SuggestedQuestions";
import { sendChatMessage } from "@/lib/chat";
import { getConversationHistory, clearConversation, exportConversation } from "@/lib/memory";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { RefreshCw, Download, Trash2 } from "lucide-react";

/* ============ Types ============ */

type Source = {
  file: string;
  snippet?: string;
};

type AssistantResponse = {
  answer: string;
  confidence?: "high" | "medium" | "low";
  sources?: Source[];
  reasoning?: string;
};

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  confidence?: "high" | "medium" | "low";
  sources?: string[];  // Changed: now just file names
  reasoning?: string;
};

/* ============ Constants ============ */

const SUGGESTED_QUESTIONS = [
  "What is this repository about?",
  "Where is the core logic implemented?",
  "What are the main components?",
  "How do I get started with this project?",
];

/* ============ Component ============ */

export default function Assistant() {
  const { repo } = useParams<{ repo: string }>();

  if (!repo) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-red-400">
          Invalid repository identifier.
        </div>
      </WorkspaceLayout>
    );
  }

  const repoFullName = repo;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ============ Load Conversation History ============ */

  useEffect(() => {
    loadConversationHistory();
  }, [repoFullName]);

  async function loadConversationHistory() {
    try {
      setLoadingHistory(true);
      const history = await getConversationHistory(repoFullName);

      if (history && history.messages && history.messages.length > 0) {
        // Convert stored messages to UI format
        const loadedMessages: Message[] = history.messages.map((msg) => ({
          id: nanoid(),
          role: msg.role as "user" | "assistant",
          content: msg.content,
          confidence: (msg.confidence as any) || undefined,
        }));

        setMessages(loadedMessages);
      }
    } catch (err) {
      console.error("Failed to load conversation history:", err);
      // Don't show error, just continue with empty chat
    } finally {
      setLoadingHistory(false);
    }
  }

  /* ============ Chat Handlers ============ */

  async function handleSendMessage(message: string) {
    if (!message.trim() || loading) return;

    // Add user message
    setMessages((prev) => [
      ...prev,
      {
        id: nanoid(),
        role: "user",
        content: message,
      },
    ]);

    setLoading(true);
    setError(null);

    try {
      const res = await sendChatMessage(repoFullName, message);

      // Map sources to string[] if necessary
      let sources: string[] = [];
      if (Array.isArray(res.sources) && res.sources.length > 0) {
        // If sources are array of objects, map to file names
        if (
          res.sources[0] != null &&
          typeof res.sources[0] === "object" &&
          "file" in res.sources[0]
        ) {
          sources = res.sources.map((s: any) => s.file);
        } else {
          sources = res.sources as string[];
        }
      }

      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: res.answer || "I couldn't generate a response. Please try again.",
          confidence: res.confidence,
          sources,
          reasoning: res.reasoning,
        },
      ]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);

      setMessages((prev) => [
        ...prev,
        {
          id: nanoid(),
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          confidence: "low",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSyncRepo() {
  setSyncing(true);
  setError(null);

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw new Error("User not authenticated");
    }

    const response = await fetch(
      `https://repomind-577n.onrender.com/repos/${encodeURIComponent(repoFullName)}/files/sync`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error("Failed to sync repository");
    }

    setMessages((prev) => [
  ...prev,
  {
    id: nanoid(),
    role: "assistant",
    content: "Repository synced successfully!",
    confidence: "high",
  },
]);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Sync failed";
    setError(errorMessage);
  } finally {
    setSyncing(false);
  }
}


  async function handleClearConversation() {
    if (
      window.confirm(
        "Are you sure you want to clear all conversation history? This cannot be undone."
      )
    ) {
      const success = await clearConversation(repoFullName);
      if (success) {
        setMessages([]);
      } else {
        setError("Failed to clear conversation");
      }
    }
  }

  async function handleExportConversation() {
    const data = await exportConversation(repoFullName);
    if (data) {
      const element = document.createElement("a");
      element.setAttribute(
        "href",
        "data:text/plain;charset=utf-8," + encodeURIComponent(data)
      );
      element.setAttribute("download", `${repoFullName.replace("/", "-")}-chat.json`);
      element.style.display = "none";
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } else {
      setError("Failed to export conversation");
    }
  }

  /* ============ Render ============ */

  if (loadingHistory) {
    return (
      <WorkspaceLayout>
        <div className="flex items-center justify-center h-screen bg-slate-950">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">Loading conversation history...</p>
          </div>
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="flex flex-col h-screen bg-slate-950">
        {/* Header */}
        <div className="border-b border-slate-700 bg-slate-900 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">RepoMind Assistant</h1>
              <p className="text-sm text-slate-400 mt-1">
                Ask questions and get answers with file-level citations
              </p>
            </div>
            <div className="flex gap-2">
              {messages.length > 0 && (
                <>
                  <Button
                    onClick={handleExportConversation}
                    variant="outline"
                    size="sm"
                    className="text-slate-300 border-slate-600 hover:border-slate-500 hover:bg-slate-800"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    onClick={handleClearConversation}
                    variant="outline"
                    size="sm"
                    className="text-red-400 border-slate-600 hover:border-red-500 hover:bg-red-500/10"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                </>
              )}
              <Button
                onClick={handleSyncRepo}
                disabled={syncing}
                variant="outline"
                size="sm"
                className="text-slate-300 border-slate-600 hover:border-slate-500 hover:bg-slate-800"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
                {syncing ? "Syncing..." : "Sync Repo"}
              </Button>
            </div>
          </div>

          {/* Repository Info */}
          <div className="mt-4 flex items-center gap-2">
            <span className="text-sm text-slate-400">Repository:</span>
            <span className="text-sm font-mono bg-slate-800 px-3 py-1 rounded text-blue-400">
              {repoFullName}
            </span>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-red-900/20 border-b border-red-900/50 px-6 py-3">
            <p className="text-sm text-red-200">⚠️ {error}</p>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {messages.length === 0 ? (
            <div className="flex-1 flex flex-col">
              <ChatContainer
                messages={messages.map((msg) => ({
                  ...msg,
                  sources:
                    msg.sources && Array.isArray(msg.sources)
                      ? msg.sources.map((file) => ({ file }))
                      : undefined,
                }))}
                loading={loading}
                onSendMessage={handleSendMessage}
                placeholder="Ask a question about this repository..."
              />
              <SuggestedQuestions
                questions={SUGGESTED_QUESTIONS}
                onSelectQuestion={handleSendMessage}
                disabled={loading}
              />
            </div>
          ) : (
            <ChatContainer
              messages={messages.map((msg) => ({
                ...msg,
                sources:
                  msg.sources && Array.isArray(msg.sources)
                    ? msg.sources.map((file) => ({ file }))
                    : undefined,
              }))}
              loading={loading}
              onSendMessage={handleSendMessage}
              placeholder="Ask a follow-up question..."
            />
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
