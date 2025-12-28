import { useEffect, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { RepoHeader } from "@/components/RepoHeader";
import { HealthScore } from "@/components/HealthScore";
import { StatCard } from "@/components/StatCard";
import { StatusIndicator } from "@/components/StatusIndicator";

import {
  GitCommit,
  Users,
  GitMerge,
  XCircle,
  GitPullRequest,
  CircleDot,
} from "lucide-react";

/**
 * Maps backend / placeholder CI status
 * → UI-safe StatusIndicator status
 */
const mapCiStatus = (
  status?: string
): "passing" | "failing" | "warning" | "pending" => {
  switch (status) {
    case "success":
    case "passed":
      return "passing";
    case "failed":
    case "error":
      return "failing";
    case "running":
      return "pending";
    default:
      return "warning";
  }
};

export default function Dashboard() {
  const [repoData, setRepoData] = useState<null | {
    name: string;
    description: string;
    stars: number;
    forks: number;
    watchers: number;
    healthScore: number;
    lastUpdated: string;
  }>(null);

  const [healthMetrics, setHealthMetrics] = useState<null | {
    ciStatus: string;
    openPRs: number;
    openIssues: number;
    commits30Days: number;
    activeContributors: number;
    prMergeRate: number;
    deploymentFailures: number;
  }>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const res = await fetch(
          "https://repomind-577n.onrender.com/dashboard/?repo=SagarJadhav007/repo-insights-hub"
        );

        if (!res.ok) throw new Error("API failed");

        const data = await res.json();

        setRepoData({
          name: data.repo.full_name,
          description: data.repo.description,
          stars: data.repo.stars,
          forks: data.repo.forks,
          watchers: data.repo.watchers,
          healthScore: data.health.score,
          lastUpdated: "just now",
        });

        setHealthMetrics({
          ciStatus: "success", // placeholder until CI API exists
          openPRs: data.status.open_prs,
          openIssues: data.status.open_issues,
          commits30Days: data.activity.commits_30d,
          activeContributors: data.activity.contributors,
          prMergeRate: data.activity.merge_rate ?? 0,
          deploymentFailures: 0,
        });
      } catch (err) {
        console.error("Failed to load dashboard", err);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  if (loading) {
    return <div className="p-6">Loading dashboard...</div>;
  }

  if (!repoData || !healthMetrics) {
    return <div className="p-6">Failed to load dashboard</div>;
  }

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Repo Header */}
        <RepoHeader {...repoData} />

        {/* Health Score + Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Health */}
          <div className="rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">
              Repository Health
            </h2>
            <div className="mt-4 flex justify-center">
              <HealthScore score={repoData.healthScore} size="lg" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Updated {repoData.lastUpdated}
            </p>
          </div>

          {/* Status */}
          <div className="lg:col-span-2 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">
              Current Status
            </h2>

            <div className="mt-4 flex flex-wrap gap-3">
              <StatusIndicator
                status={mapCiStatus(healthMetrics.ciStatus)}
                label="CI Status"
              />
              <StatusIndicator
                status="warning"
                label="Open PRs"
                value={healthMetrics.openPRs}
              />
              <StatusIndicator
                status="warning"
                label="Open Issues"
                value={healthMetrics.openIssues}
              />
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <GitPullRequest className="h-5 w-5 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">Pull Requests</p>
                  <p className="text-lg font-bold">
                    {healthMetrics.openPRs} open
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <CircleDot className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-lg font-bold">
                    {healthMetrics.openIssues} open
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
            value={healthMetrics.commits30Days}
            icon={GitCommit}
          />
          <StatCard
            title="Active Contributors"
            value={healthMetrics.activeContributors}
            icon={Users}
          />
          <StatCard
            title="PR Merge Rate"
            value={`${healthMetrics.prMergeRate}%`}
            icon={GitMerge}
          />
          <StatCard
            title="Deploy Failures"
            value={healthMetrics.deploymentFailures}
            icon={XCircle}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
