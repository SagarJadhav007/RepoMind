import { cn } from "@/lib/utils";
import { Bot, User, FileText } from "lucide-react";

interface Source {
  file: string;
  lines?: string;
  snippet?: string;
}

interface ChatBubbleProps {
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  confidence?: "high" | "medium" | "low";
}

export function ChatBubble({
  role,
  content,
  sources = [],
  confidence,
}: ChatBubbleProps) {
  const isAssistant = role === "assistant";

  return (
    <div
      className={cn(
        "flex gap-3",
        isAssistant ? "flex-row" : "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          isAssistant
            ? "bg-accent text-accent-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isAssistant ? <Bot size={16} /> : <User size={16} />}
      </div>

      {/* Bubble */}
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm space-y-3",
          isAssistant
            ? "rounded-tl-sm bg-card border"
            : "rounded-tr-sm bg-primary text-primary-foreground"
        )}
      >
        {/* Answer */}
        <div className="whitespace-pre-wrap leading-relaxed">
          {content}
        </div>

        {/* Sources */}
        {isAssistant && sources.length > 0 && (
          <div className="pt-2 border-t space-y-2">
            <p className="text-xs font-medium text-muted-foreground">
              Sources
            </p>

            {sources.map((src, idx) => (
              <div key={idx} className="text-xs space-y-1">
                <a
                  href={`https://github.com/${src.file}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1 text-accent hover:underline"
                >
                  <FileText size={12} />
                  {src.file}
                  {src.lines && (
                    <span className="text-muted-foreground">
                      (lines {src.lines})
                    </span>
                  )}
                </a>

                {src.snippet && (
                  <pre className="rounded-md bg-muted p-2 overflow-x-auto text-xs">
                    <code>{src.snippet}</code>
                  </pre>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Confidence */}
        {isAssistant && confidence && (
          <div className="pt-1 text-xs">
            <span className="text-muted-foreground">Confidence:</span>{" "}
            <span
              className={cn(
                "font-medium",
                confidence === "high" && "text-green-600",
                confidence === "medium" && "text-yellow-600",
                confidence === "low" && "text-red-600"
              )}
            >
              {confidence.toUpperCase()}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
