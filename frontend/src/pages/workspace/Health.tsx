import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { HealthScore } from "@/components/HealthScore";
import { healthDetails, needsAttention, repoData } from "@/data/mockData";
import { cn } from "@/lib/utils";
import {
  Clock,
  CheckCircle2,
  Activity,
  Rocket,
  AlertTriangle,
  GitPullRequest,
  CircleDot,
  AlertCircle,
  Shield,
} from "lucide-react";

const metricIcons = {
  prReviewLatency: Clock,
  issueResolutionTime: CheckCircle2,
  ciStability: Activity,
  releaseCadence: Rocket,
};

const metricLabels = {
  prReviewLatency: "PR Review Latency",
  issueResolutionTime: "Issue Resolution Time",
  ciStability: "CI Stability",
  releaseCadence: "Release Cadence",
};

const attentionIcons = {
  pr: GitPullRequest,
  issue: CircleDot,
  ci: AlertCircle,
  security: Shield,
};

export default function Health() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Repository Health Overview</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor key health indicators and identify areas that need attention.
          </p>
        </div>

        {/* Health Score Overview */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-lg border border-border bg-card p-6 shadow-card">
            <h2 className="text-sm font-medium text-muted-foreground">Overall Health</h2>
            <div className="mt-4 flex justify-center">
              <HealthScore score={repoData.healthScore} size="lg" />
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="lg:col-span-2 grid gap-4 sm:grid-cols-2">
            {(Object.keys(healthDetails) as Array<keyof typeof healthDetails>).map((key) => {
              const metric = healthDetails[key];
              const Icon = metricIcons[key];
              const statusColors = {
                excellent: "text-health-excellent bg-health-excellent/10 border-health-excellent/20",
                good: "text-health-good bg-health-good/10 border-health-good/20",
                warning: "text-health-warning bg-health-warning/10 border-health-warning/20",
                critical: "text-health-critical bg-health-critical/10 border-health-critical/20",
              };

              return (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-card p-4 shadow-card"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-muted p-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">{metricLabels[key]}</p>
                        <p className="text-lg font-bold text-card-foreground">{metric.value}</p>
                      </div>
                    </div>
                    <span
                      className={cn(
                        "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                        statusColors[metric.status]
                      )}
                    >
                      {metric.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Needs Attention Section */}
        <div className="rounded-lg border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <h2 className="text-lg font-semibold text-card-foreground">Needs Attention</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Items that require immediate review or action
            </p>
          </div>
          <div className="divide-y divide-border">
            {needsAttention.map((item) => {
              const Icon = attentionIcons[item.type];
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="rounded-lg bg-warning/10 p-2">
                    <Icon className="h-4 w-4 text-warning" />
                  </div>
                  <p className="flex-1 text-sm text-card-foreground">{item.title}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
