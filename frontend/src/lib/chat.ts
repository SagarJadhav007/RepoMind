import { supabase } from "@/lib/supabase";

export async function sendChatMessage(
  repoFullName: string,
  message: string
) {
  const { data, error } = await supabase.auth.getSession();

  if (error || !data.session) {
    throw new Error("User not authenticated");
  }

  const token = data.session.access_token;

  console.log("CHAT TOKEN:", token); 

  const res = await fetch(
    `https://repomind-577n.onrender.com/chat?repo_full_name=${encodeURIComponent(repoFullName)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("CHAT ERROR:", res.status, text);
    throw new Error(text);
  }

  return res.json();
}
