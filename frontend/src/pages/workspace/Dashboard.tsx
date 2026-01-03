import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { RepoHeader } from "@/components/RepoHeader";
import { HealthScore } from "@/components/HealthScore";
import { StatCard } from "@/components/StatCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { supabase } from "@/lib/supabase";
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
  message?: string;
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

type Activity = {
  username: string;
  activity_type: "commit" | "pr_merged" | "issue_closed";
  count: number;
  latest_title: string | null;
  latest_url: string | null;
  latest_at: string;
};

/* -------------------- TYPE GUARD -------------------- */

function isSynced(
  data: DashboardResponse
): data is SyncedDashboardResponse {
  return (data as SyncedDashboardResponse).repo_full_name !== undefined;
}

/* -------------------- HELPERS -------------------- */

function activityLabel(type: Activity["activity_type"], count: number) {
  if (type === "commit") return `made ${count} commit${count > 1 ? "s" : ""}`;
  if (type === "pr_merged") return `merged ${count} PR${count > 1 ? "s" : ""}`;
  if (type === "issue_closed")
    return `closed ${count} issue${count > 1 ? "s" : ""}`;
  return "";
}

function activityIcon(type: Activity["activity_type"]) {
  if (type === "commit") return GitCommit;
  if (type === "pr_merged") return GitMerge;
  return CircleDot;
}

/* -------------------- COMPONENT -------------------- */

export default function Dashboard() {
  const { repo } = useParams<{ repo: string }>();

  const [data, setData] = useState<DashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLoading, setActivityLoading] = useState(true);

  /* -------------------- LOAD DASHBOARD -------------------- */

  const loadDashboard = async (isRefresh = false) => {
    if (!repo) return;

    isRefresh ? setRefreshing(true) : setLoading(true);
    setActivityLoading(true);

    try {
      const session = (await supabase.auth.getSession()).data.session;

      if (!session) {
        setData({
          status: "not_synced",
          repo,
          message: "User not authenticated",
        });
        return;
      }

      /* -------- Dashboard Snapshot -------- */
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

      if (!res.ok) {
        setData({
          status: "not_synced",
          repo,
          message: "Repository not analyzed yet",
        });
        return;
      }

      const json = await res.json();
      setData(json);

      /* -------- Recent Activity -------- */
      const activityRes = await fetch(
        "https://repomind-577n.onrender.com/dashboard/activity?days=1",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (activityRes.ok) {
        const activityJson = await activityRes.json();
        setActivities(activityJson.activities || []);
      }
    } catch (err) {
      setData({
        status: "not_synced",
        repo,
        message: String(err),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
      setActivityLoading(false);
    }
  };

  /* -------------------- INITIAL LOAD -------------------- */

  useEffect(() => {
    loadDashboard();
  }, [repo]);

  /* -------------------- NO REPO -------------------- */

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

  if (!isSynced(data)) {
    return (
      <WorkspaceLayout>
        <div className="p-6 space-y-4">
          <h2 className="text-xl font-semibold">Repository not synced</h2>
          <p className="text-muted-foreground">
            {data.message ?? "This repository has not been analyzed yet."}
          </p>
          <Button onClick={() => loadDashboard(true)}>
            {refreshing ? "Syncing…" : "Sync repository"}
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
        {/* Refresh Button */}
        <div className="flex justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={() => loadDashboard(true)}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </Button>
        </div>

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
          <div className="rounded-lg border bg-card p-6 shadow-card">
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

          <div className="lg:col-span-2 rounded-lg border bg-card p-6 shadow-card">
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

        {/* Recent Activity */}
        <div className="rounded-lg border bg-card shadow-card">
          <div className="border-b px-6 py-4">
            <h2 className="text-sm font-medium text-muted-foreground">
              Recent Activity (last 24h)
            </h2>
          </div>

          <div className="divide-y">
            {activityLoading ? (
              <div className="px-6 py-4 text-sm text-muted-foreground">
                Loading activity…
              </div>
            ) : activities.length === 0 ? (
              <div className="px-6 py-4 text-sm text-muted-foreground">
                No recent activity
              </div>
            ) : (
              activities.map((a, i) => {
                const Icon = activityIcon(a.activity_type);

                return (
                  <div
                    key={i}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <Icon className="h-5 w-5 text-accent shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-medium">
                          @{a.username}
                        </span>{" "}
                        {activityLabel(a.activity_type, a.count)}
                      </p>
                      {a.latest_title && (
                        <p className="text-xs text-muted-foreground truncate">
                          {a.latest_title}
                        </p>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(a.latest_at).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
