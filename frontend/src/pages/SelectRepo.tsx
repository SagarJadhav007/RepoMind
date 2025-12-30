import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

type Repo = {
  full_name: string;
  owner: string;
  private: boolean;
};

export default function SelectRepo() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [params] = useSearchParams();
  const navigate = useNavigate();

  const installationId = params.get("installation_id");

  useEffect(() => {
    async function loadRepos() {
      try {
        if (!installationId) throw new Error("Missing installation_id");

        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("Not authenticated");

        const res = await fetch(
          `https://repomind-577n.onrender.com/github/repos?installation_id=${installationId}`,
          {
            headers: {
              Authorization: `Bearer ${data.session.access_token}`,
            },
          }
        );

        const json = await res.json();
        if (!Array.isArray(json)) throw new Error("Invalid repo response");

        setRepos(json);
      } catch (e) {
        console.error(e);
        alert("Failed to fetch repositories");
      } finally {
        setLoading(false);
      }
    }

    loadRepos();
  }, [installationId]);

  const selectRepo = async (repo: string) => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      alert("Not authenticated");
      return;
    }

    const res = await fetch(
      "https://repomind-577n.onrender.com/github/sync",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`, // ✅ FIX
        },
        body: JSON.stringify({
          installation_id: Number(installationId),
          repo,
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error(err);
      alert("Failed to sync repository");
      return;
    }

    navigate("/workspace/demo");
  };

  if (loading) return <div className="p-6">Loading repositories…</div>;

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Select Repository</h1>

        {repos.map((repo) => (
          <Card key={repo.full_name}>
            <CardHeader>
              <CardTitle>{repo.full_name}</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-end">
              <Button onClick={() => selectRepo(repo.full_name)}>
                Use this repo
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
