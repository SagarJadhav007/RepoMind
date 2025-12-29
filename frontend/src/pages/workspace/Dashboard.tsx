import { useEffect, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { RepoHeader } from "@/components/RepoHeader";
import { HealthScore } from "@/components/HealthScore";
import { StatCard } from "@/components/StatCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { supabase } from "@/lib/supabase";
import { useRepo } from "@/context/RepoContext";

import {
  GitCommit,
  Users,
  GitMerge,
  XCircle,
  GitPullRequest,
  CircleDot,
} from "lucide-react";

type DashboardResponse = {
  repo: {
    full_name: string;
    description: string;
    stars: number;
    forks: number;
    watchers: number;
  };
  status: {
    open_prs: number;
    open_issues: number;
  };
  activity: {
    commits_30d: number;
    contributors: number;
    merge_rate: number | null;
  };
  health: {
    score: number;
  };
};

const mapCiStatus = (): "passing" | "warning" => "warning";

export default function Dashboard() {
  const { repo } = useRepo();
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) return;

    async function loadDashboard() {
      try {
        setLoading(true);

        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const res = await fetch(
          `https://repomind-577n.onrender.com/dashboard/`,
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!res.ok) throw new Error("Dashboard fetch failed");

        setData(await res.json());
      } catch (err) {
        console.error(err);
        setData(null);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
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
        <div className="p-6">Loading dashboard…</div>
      </WorkspaceLayout>
    );
  }

  if (!data) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-destructive">
          Failed to load dashboard
        </div>
      </WorkspaceLayout>
    );
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Repo Header */}
        <RepoHeader
          name={data.repo.full_name}
          description={data.repo.description}
          stars={data.repo.stars}
          forks={data.repo.forks}
          watchers={data.repo.watchers}
        />

        {/* Health + Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Health */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-sm text-muted-foreground">
              Repository Health
            </h2>
            <div className="mt-4 flex justify-center">
              <HealthScore score={data.health.score} size="lg" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Updated just now
            </p>
          </div>

          {/* Status */}
          <div className="lg:col-span-2 rounded-lg border bg-card p-6">
            <h2 className="text-sm text-muted-foreground">
              Current Status
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <StatusIndicator
                status={mapCiStatus()}
                label="CI Status"
              />
              <StatusIndicator
                status="warning"
                label="Open PRs"
                value={data.status.open_prs}
              />
              <StatusIndicator
                status="warning"
                label="Open Issues"
                value={data.status.open_issues}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <GitPullRequest className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Pull Requests</p>
                  <p className="text-lg font-bold">
                    {data.status.open_prs}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <CircleDot className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-lg font-bold">
                    {data.status.open_issues}
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
            value={data.activity.commits_30d}
            icon={GitCommit}
          />
          <StatCard
            title="Active Contributors"
            value={data.activity.contributors}
            icon={Users}
          />
          <StatCard
            title="PR Merge Rate"
            value={`${data.activity.merge_rate ?? 0}%`}
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
