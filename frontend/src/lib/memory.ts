import { supabase } from "@/lib/supabase";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  confidence?: string;
}

export interface ConversationHistory {
  conversation_id: string;
  messages: ConversationMessage[];
  summary: string;
  created_at: string;
  updated_at: string;
}

export async function getConversationHistory(
  repoFullName: string,
): Promise<ConversationHistory | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("User not authenticated");
  }

  const token = data.session.access_token;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || "https://repomind-577n.onrender.com"}/memory/conversation?repo_full_name=${encodeURIComponent(repoFullName)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      console.error("Failed to fetch conversation history");
      return null;
    }

    return res.json();
  } catch (err) {
    console.error("Error fetching conversation history:", err);
    return null;
  }
}

export async function clearConversation(
  repoFullName: string,
): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("User not authenticated");
  }

  const token = data.session.access_token;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || "https://repomind-577n.onrender.com"}/memory/conversation?repo_full_name=${encodeURIComponent(repoFullName)}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    return res.ok;
  } catch (err) {
    console.error("Error clearing conversation:", err);
    return false;
  }
}

export async function exportConversation(
  repoFullName: string,
): Promise<string | null> {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("User not authenticated");
  }

  const token = data.session.access_token;

  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL || "https://repomind-577n.onrender.com"}/memory/conversation/export?repo_full_name=${encodeURIComponent(repoFullName)}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!res.ok) {
      return null;
    }

    const response = await res.json();
    return response.data;
  } catch (err) {
    console.error("Error exporting conversation:", err);
    return null;
  }
}
