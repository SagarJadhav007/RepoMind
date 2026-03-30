import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

/* ---------------- TYPES ---------------- */

type Repo = {
  full_name: string;
  private: boolean;
};

/* ---------------- DISPLAY ITEM ---------------- */

type DisplayItem =
  | { kind: "connect" }
  | { kind: "no-repos" }
  | { kind: "repo"; repo: Repo };

/* ---------------- COMPONENT ---------------- */

export default function AddRepository() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasGithub, setHasGithub] = useState(false);

  const navigate = useNavigate();

  /* ---------------- LOAD REPOS ---------------- */

  useEffect(() => {
    loadRepos();
  }, []);

  async function loadRepos() {
    try {
      setLoading(true);

      const { data } = await supabase.auth.getSession();
      if (!data.session) return;

      const res = await fetch(
        "https://repomind-577n.onrender.com/github/repos/available",
        {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        }
      );

      if (res.status === 404) {
        setHasGithub(false);
        setRepos([]);
        return;
      }

      if (!res.ok) throw new Error("Failed to fetch repos");

      const json = await res.json();
      setRepos(json);
      setHasGithub(true);
    } catch (err) {
      console.error(err);
      setHasGithub(false);
      setRepos([]);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- CONNECT GITHUB ---------------- */

  async function connectGithub() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const userId = data.session.user.id;

    window.location.href =
      `https://github.com/apps/RepoMind-App/installations/new?state=${userId}`;
  }

  /* ---------------- SELECT REPO ---------------- */

  async function selectRepo(repoFullName: string) {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const res = await fetch(
      "https://repomind-577n.onrender.com/github/sync",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ repo: repoFullName }),
      }
    );

    if (!res.ok) {
      alert("Failed to sync repository");
      return;
    }

    navigate(`/workspace/${encodeURIComponent(repoFullName)}`);
  }

  /* ---------------- BUILD DISPLAY LIST ---------------- */

  const items: DisplayItem[] = [];

  if (!hasGithub) {
    items.push({ kind: "connect" });
  } else if (repos.length === 0) {
    items.push({ kind: "no-repos" });
  } else {
    repos.forEach((repo) => items.push({ kind: "repo", repo }));
  }

  /* ---------------- UI ---------------- */

  if (loading) {
    return <div className="p-6">Loading repositories…</div>;
  }

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-2xl space-y-4">
        <h1 className="text-2xl font-bold">Add Repository</h1>

        {items.map((item, idx) => {
          if (item.kind === "connect") {
            return (
              <Card key="connect-github">
                <CardContent className="space-y-4 py-6">
                  <p className="text-sm text-muted-foreground">
                    Connect your GitHub account to select repositories.
                  </p>
                  <Button onClick={connectGithub}>
                    Connect GitHub
                  </Button>
                </CardContent>
              </Card>
            );
          }

          if (item.kind === "no-repos") {
            return (
              <Card key="no-repos">
                <CardContent className="space-y-4 py-6">
                  <p className="text-sm text-muted-foreground">
                    No repositories available.
                  </p>

                  <Button variant="outline" onClick={connectGithub}>
                    Add repositories on GitHub
                  </Button>

                  <Button variant="ghost" onClick={loadRepos}>
                    Refresh
                  </Button>
                </CardContent>
              </Card>
            );
          }

          // repo card
          return (
            <Card key={item.repo.full_name}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  {item.repo.full_name}
                  {item.repo.private && (
                    <span className="text-xs text-muted-foreground">
                      Private
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-end">
                <Button onClick={() => selectRepo(item.repo.full_name)}>
                  Use this repo
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
