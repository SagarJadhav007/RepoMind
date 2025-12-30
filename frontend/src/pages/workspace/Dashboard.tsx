import { useEffect, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { RepoHeader } from "@/components/RepoHeader";
import { HealthScore } from "@/components/HealthScore";
import { StatCard } from "@/components/StatCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { supabase } from "@/lib/supabase";
import { useRepo } from "@/context/RepoContext";
import { Button } from "@/components/ui/button";

import {
  GitCommit,
  Users,
  GitMerge,
  XCircle,
  GitPullRequest,
  CircleDot,
} from "lucide-react";

/* -------------------- TYPES -------------------- */

type NotSyncedResponse = {
  status: "not_synced";
  repo: string;
  message: string;
};

type SyncedDashboardResponse = {
  repo_full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  watchers: number;
  open_prs: number;
  open_issues: number;
  commits_30d: number;
  contributors: number;
  merge_rate: number | null;
  health_score: number;
  updated_at?: string;
};

type DashboardResponse = NotSyncedResponse | SyncedDashboardResponse;

/* -------------------- COMPONENT -------------------- */

export default function Dashboard() {
  const { repo } = useRepo();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!repo) return;

    async function loadDashboard() {
      setLoading(true);

      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const res = await fetch(
          `https://repomind-577n.onrender.com/dashboard/?repo=${encodeURIComponent(
            repo
          )}`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        const json = await res.json();
        setData(json);
      } catch (err) {
        setData({
          status: "not_synced",
          repo,
          message: String(err),
        });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [repo]);

  /* -------------------- NO REPO SELECTED -------------------- */

  if (!repo) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-muted-foreground">
          Select a repository from the sidebar
        </div>
      </WorkspaceLayout>
    );
  }

  /* -------------------- LOADING -------------------- */

  if (loading || !data) {
    return (
      <WorkspaceLayout>
        <div className="p-6">Loading dashboard…</div>
      </WorkspaceLayout>
    );
  }

  /* -------------------- NOT SYNCED -------------------- */

  if ("status" in data && data.status === "not_synced") {
    return (
      <WorkspaceLayout>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Repository not synced</h2>
          <p className="text-muted-foreground">{data.message}</p>
          <Button onClick={() => window.location.reload()}>
            Sync repository
          </Button>
        </div>
      </WorkspaceLayout>
    );
  }

  /* -------------------- SYNCED DASHBOARD -------------------- */

  const lastUpdated = data.updated_at
    ? new Date(data.updated_at).toLocaleString()
    : "just now";

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Repo Header */}
        <RepoHeader
          name={data.repo_full_name}
          description={data.description ?? ""}
          stars={data.stars}
          forks={data.forks}
          watchers={data.watchers}
        />

        {/* Health + Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Health */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">
              Repository Health
            </h2>
            <div className="mt-4 flex justify-center">
              <HealthScore score={data.health_score} size="lg" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Updated {lastUpdated}
            </p>
          </div>

          {/* Status */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">
              Current Status
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <StatusIndicator status="warning" label="CI Status" />
              <StatusIndicator
                status="warning"
                label="Open PRs"
                value={data.open_prs}
              />
              <StatusIndicator
                status="warning"
                label="Open Issues"
                value={data.open_issues}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <GitPullRequest className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">
                    Pull Requests
                  </p>
                  <p className="text-lg font-bold">
                    {data.open_prs} open
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <CircleDot className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-lg font-bold">
                    {data.open_issues} open
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Commits (30 days)"
            value={data.commits_30d}
            icon={GitCommit}
          />
          <StatCard
            title="Active Contributors"
            value={data.contributors}
            icon={Users}
          />
          <StatCard
            title="PR Merge Rate"
            value={`${data.merge_rate ?? 0}%`}
            icon={GitMerge}
          />
          <StatCard
            title="Deploy Failures"
            value={0}
            icon={XCircle}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
