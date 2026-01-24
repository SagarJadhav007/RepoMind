import { supabase } from "@/lib/supabase";

export interface AssistantResponse {
  answer: string;
  confidence?: "high" | "medium" | "low";
  sources?: string[]; // Changed: now just file names
  reasoning?: string;
}

export async function sendChatMessage(
  repoFullName: string,
  message: string,
): Promise<AssistantResponse> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("User not authenticated");
  }

  const token = data.session.access_token;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || "https://repomind-577n.onrender.com"}/chat?repo_full_name=${encodeURIComponent(repoFullName)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message }),
      },
    );

    if (!res.ok) {
      const text = await res.text();
      console.error("CHAT ERROR:", res.status, text);
      throw new Error(`${res.status}: ${text}`);
    }

    const data = await res.json();
    return data as AssistantResponse;
  } catch (err) {
    console.error("Chat request failed:", err);
    throw err;
  }
}
