import { Bot, User, Code } from "lucide-react";

export function ChatBubble({ role, content }: any) {
  const isAssistant = role === "assistant";

  let parsed;
  try {
    parsed = isAssistant ? JSON.parse(content) : null;
  } catch {
    parsed = null;
  }

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`}>
      <div className="h-8 w-8 rounded-full flex items-center justify-center bg-muted">
        {isAssistant ? <Bot size={16} /> : <User size={16} />}
      </div>

      <div className="max-w-[80%] rounded-xl border p-4 bg-card text-sm space-y-3">
        {!parsed && <p>{content}</p>}

        {parsed && (
          <>
            {/* Answer */}
            <div className="prose prose-sm max-w-none">
              <p>{parsed.answer}</p>
            </div>

            {/* Confidence */}
            {parsed.confidence && (
              <div className="text-xs text-muted-foreground">
                Confidence: <strong>{parsed.confidence}</strong>
              </div>
            )}

            {/* Sources */}
            {parsed.sources?.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-semibold">Sources</div>

                {parsed.sources.map((s: any, i: number) => (
                  <div key={i} className="rounded-md bg-muted p-3 text-xs">
                    <a
                      href={`https://github.com/${"SagarJadhav007/TIC-TAC-TOC"}/blob/main/${s.file}`}
                      target="_blank"
                      className="font-medium underline"
                    >
                      {s.file} (lines {s.lines})
                    </a>

                    <pre className="mt-2 overflow-x-auto rounded bg-black text-green-400 p-2">
                      <code>{s.snippet}</code>
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
