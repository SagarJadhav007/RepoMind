import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

/* ---------------- TYPES ---------------- */

type Repo = {
  full_name: string;
  owner: string;
  private: boolean;
};

/* ---------------- COMPONENT ---------------- */

export default function SelectRepo() {
  const [repos, setRepos] = useState<Repo[]>([]);
  const [loading, setLoading] = useState(true);

   // Invite code state (moved from profile setup)
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteValid, setInviteValid] = useState<any | null>(null);
  const [inviteChecking, setInviteChecking] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState(false);

  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const installationId = params.get("installation_id");

  /* Profile check moved to ProfileSetup — load repos below */

  /* ---------------- FETCH REPOS ---------------- */

  useEffect(() => {
    async function loadRepos() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!data.session) {
          throw new Error("Not authenticated");
        }

        let url = "https://repomind-577n.onrender.com/github/repos";

        // If GitHub redirected back after install
        if (installationId) {
          url += `?installation_id=${installationId}`;
        }

        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${data.session.access_token}`,
          },
        });

        if (!res.ok) {
          throw new Error("Failed to fetch repositories");
        }

        const json = await res.json();
        setRepos(Array.isArray(json) ? json : []);
      } catch (err) {
        console.error(err);
        setRepos([]);
      } finally {
        setLoading(false);
      }
    }

    loadRepos();
  }, [installationId]);

  /* ---------------- ADD / UPDATE INSTALLATION ---------------- */

  const addRepo = async () => {
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      alert("Not authenticated");
      return;
    }

    const userId = data.session.user.id;

    window.location.href =
      `https://github.com/apps/RepoMind-App/installations/new?state=${userId}`;
  };

  /* ---------------- INVITE CODE HELPERS ---------------- */

  const validateInviteCode = async () => {
    if (!inviteCodeInput) return;
    try {
      setInviteChecking(true);

      const res = await fetch(
        `https://repomind-577n.onrender.com/invite/validate?code=${inviteCodeInput}`,
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail || "Invalid or expired invite");
      }

      const data = await res.json();
      setInviteValid(data);
      toast({
        title: "Invite valid",
        description: `Invite to ${data.repo_full_name}`,
      });
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to validate invite";
      setInviteValid(null);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setInviteChecking(false);
    }
  };

  const acceptInviteCode = async () => {
    try {
      setAcceptingInvite(true);
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        navigate("/auth");
        return;
      }

      const res = await fetch(
        "https://repomind-577n.onrender.com/invite/accept",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({ code: inviteCodeInput }),
        },
      );

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.detail || "Failed to accept invite");
      }

      const result = await res.json();
      toast({ title: "Success", description: result.message });
      navigate(`/workspace/${encodeURIComponent(result.repo)}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to accept invite";
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setAcceptingInvite(false);
    }
  };

  /* ---------------- SELECT REPO ---------------- */

  const selectRepo = async (repoFullName: string) => {
    try {
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
            Authorization: `Bearer ${data.session.access_token}`,
          },
          body: JSON.stringify({
            installation_id: installationId
              ? Number(installationId)
              : undefined,
            repo: repoFullName,
          }),
        }
      );

      if (!res.ok) {
        throw new Error("Sync failed");
      }

      navigate(`/workspace/${encodeURIComponent(repoFullName)}`);
    } catch (err) {
      console.error(err);
      alert("Failed to sync repository");
    }
  };

  /* ---------------- UI ---------------- */

  if (loading) {
    return <div className="p-6">Loading repositories…</div>;
  }

  return (
    <div className="min-h-screen flex justify-center p-6">
      <div className="w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">GitHub Repositories</h1>

          <Button variant="outline" onClick={addRepo}>
            Add / Manage Repos
          </Button>
        </div>

        {repos.length === 0 && (
          <p className="text-muted-foreground text-sm">
            No repositories connected yet
          </p>
        )}

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

        {/* Invite code section */}
        <Card>
          <CardHeader>
            <CardTitle>Have an invite code?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex gap-2">
              <Input
                placeholder="Invite code"
                value={inviteCodeInput}
                onChange={(e) => setInviteCodeInput(e.target.value)}
                disabled={inviteChecking}
              />
              <Button
                onClick={validateInviteCode}
                disabled={inviteChecking || !inviteCodeInput}
              >
                {inviteChecking ? "Checking..." : "Validate"}
              </Button>
            </div>

            {inviteValid && (
              <div className="mt-2 p-3 bg-muted rounded">
                <p className="text-sm">
                  Repository: {inviteValid.repo_full_name}
                </p>
                <p className="text-sm">Role: {inviteValid.role}</p>
                <Button
                  onClick={acceptInviteCode}
                  disabled={acceptingInvite}
                  className="mt-2"
                >
                  {acceptingInvite ? "Accepting..." : "Accept Invite"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
