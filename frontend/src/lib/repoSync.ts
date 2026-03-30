import { supabase } from "@/lib/supabase";

const API_BASE ="https://repomind-577n.onrender.com";

export async function syncRepoFiles(repoFullName: string) {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) {
    throw new Error("User not authenticated");
  }

  const res = await fetch(
    `${API_BASE}/repos/${encodeURIComponent(repoFullName)}/files/sync`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${data.session.access_token}`,
      },
    }
  );

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }

  return res.json();
}
