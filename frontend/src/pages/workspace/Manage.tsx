import { useEffect, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useRepo } from "@/context/RepoContext";

import {
  GitPullRequest,
  CircleDot,
  MessageSquare,
} from "lucide-react";

type PR = {
  id: number;
  title: string;
  author: string;
  created_at: string;
  labels: string[];
};

type Issue = {
  id: number;
  title: string;
  created_at: string;
  labels: string[];
  comments: number;
};

export default function Manage() {
  const { repo } = useRepo();
  const [prs, setPrs] = useState<PR[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) return;

    const [owner, repoName] = repo.split("/");

    async function loadManagerData() {
      try {
        setLoading(true);

        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const headers = {
          Authorization: `Bearer ${session.access_token}`,
        };

        const prRes = await fetch(
          `https://repomind-577n.onrender.com/manager/pull-requests`,
          { headers }
        );

        const issueRes = await fetch(
          `https://repomind-577n.onrender.com/manager/issues`,
          { headers }
        );

        setPrs((await prRes.json()).pull_requests || []);
        setIssues((await issueRes.json()).issues || []);
      } catch (err) {
        console.error(err);
        setPrs([]);
        setIssues([]);
      } finally {
        setLoading(false);
      }
    }

    loadManagerData();
  }, [repo]);

  if (!repo) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-muted-foreground">
          Select a repository from the sidebar
        </div>
      </WorkspaceLayout>
    );
  }

  if (loading) {
    return (
      <WorkspaceLayout>
        <div className="p-6">Loading manager console…</div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Manager Console</h1>
          <p className="text-muted-foreground">
            Review pull requests and issues
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pull Requests */}
          <div className="rounded-lg border bg-card">
            <div className="border-b px-6 py-4 flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-accent" />
              <h2 className="font-semibold">Pull Requests</h2>
            </div>

            <div className="divide-y">
              {prs.map((pr) => (
                <div key={pr.id} className="px-6 py-4">
                  <p className="font-medium">
                    #{pr.id} {pr.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    by @{pr.author}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {pr.labels.map((l) => (
                      <Badge key={l} variant="outline" className="text-xs">
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Issues */}
          <div className="rounded-lg border bg-card">
            <div className="border-b px-6 py-4 flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-warning" />
              <h2 className="font-semibold">Issues</h2>
            </div>

            <div className="divide-y">
              {issues.map((issue) => (
                <div key={issue.id} className="px-6 py-4">
                  <p className="font-medium">
                    #{issue.id} {issue.title}
                  </p>

                  <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    {issue.comments}
                  </div>

                  <div className="mt-2 flex flex-wrap gap-1">
                    {issue.labels.map((l) => (
                      <Badge
                        key={l}
                        variant="outline"
                        className={cn(
                          "text-xs",
                          l === "high-impact" &&
                            "bg-destructive/10 text-destructive border-destructive/20"
                        )}
                      >
                        {l}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
