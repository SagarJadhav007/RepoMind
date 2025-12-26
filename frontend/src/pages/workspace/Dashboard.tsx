import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { RepoHeader } from "@/components/RepoHeader";
import { HealthScore } from "@/components/HealthScore";
import { StatCard } from "@/components/StatCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { repoData, healthMetrics } from "@/data/mockData";
import { GitCommit, Users, GitMerge, XCircle, GitPullRequest, CircleDot } from "lucide-react";

export default function Dashboard() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Repo Header */}
        <RepoHeader
          name={repoData.name}
          description={repoData.description}
          stars={repoData.stars}
          forks={repoData.forks}
          watchers={repoData.watchers}
        />

        {/* Health Score and Status */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Health Score Card */}
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">Repository Health</h2>
            <div className="mt-4 flex justify-center">
              <HealthScore score={repoData.healthScore} size="lg" />
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Updated {repoData.lastUpdated}
            </p>
          </div>

          {/* Status Indicators Card */}
          <div className="lg:col-span-2 rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">Current Status</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              <StatusIndicator
                status={healthMetrics.ciStatus}
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
                  <p className="text-lg font-bold text-card-foreground">
                    {healthMetrics.openPRs} open
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-muted/50 p-4">
                <CircleDot className="h-5 w-5 text-warning" />
                <div>
                  <p className="text-sm text-muted-foreground">Issues</p>
                  <p className="text-lg font-bold text-card-foreground">
                    {healthMetrics.openIssues} open
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Commits (30 days)"
            value={healthMetrics.commits30Days}
            icon={GitCommit}
            trend={{ value: 12, positive: true }}
          />
          <StatCard
            title="Active Contributors"
            value={healthMetrics.activeContributors}
            icon={Users}
            trend={{ value: 8, positive: true }}
          />
          <StatCard
            title="PR Merge Rate"
            value={`${healthMetrics.prMergeRate}%`}
            icon={GitMerge}
            trend={{ value: 3, positive: true }}
          />
          <StatCard
            title="Deploy Failures"
            value={healthMetrics.deploymentFailures}
            icon={XCircle}
            trend={{ value: 50, positive: false }}
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}
