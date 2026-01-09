export async function sendChatMessage(
  repoFullName: string,
  message: string
) {
  const res = await fetch(
    `/chat?repo_full_name=${encodeURIComponent(repoFullName)}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    }
  );

  if (!res.ok) {
    throw new Error("Chat failed");
  }

  return res.json();
}
