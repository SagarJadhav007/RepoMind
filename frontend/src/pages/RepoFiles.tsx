import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type RepoFile = {
  path: string;
  content: string;
};

export default function RepoFilesPage() {
  const [files, setFiles] = useState<RepoFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const repoFullName = "SagarJadhav007/AranyaSetu";

  async function fetchRepoFiles() {
    setLoading(true);
    setError(null);

    try {
      const { data } = await supabase.auth.getSession();
      if (!data.session) throw new Error("Not authenticated");

      const token = data.session.access_token;

      // 1️⃣ Trigger file sync
      const syncRes = await fetch(
        `https://repomind-577n.onrender.com/repos/${repoFullName}/files/sync`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!syncRes.ok) {
        const err = await syncRes.text();
        throw new Error(err || "Failed to sync files");
      }

      // 2️⃣ Fetch stored files (✅ FIXED)
      const filesRes = await fetch(
        `https://repomind-577n.onrender.com/repos/${repoFullName}/files`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!filesRes.ok) {
        throw new Error("Failed to load files");
      }

      const dataFiles = await filesRes.json();
      setFiles(dataFiles);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Repository Files</h1>

      <Button onClick={fetchRepoFiles} disabled={loading}>
        {loading ? "Fetching files..." : "Fetch Repo Files"}
      </Button>

      {error && <p className="text-red-500">{error}</p>}

      <div className="space-y-4">
        {files.map((file) => (
          <Card key={file.path}>
            <CardHeader>
              <CardTitle className="text-sm font-mono">
                {file.path}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-muted p-4 rounded-md text-xs overflow-x-auto max-h-[400px]">
                {file.content}
              </pre>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
