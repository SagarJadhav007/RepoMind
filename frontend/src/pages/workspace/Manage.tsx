import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { pullRequests, issues, focusSuggestions } from "@/data/mockData";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  GitPullRequest,
  CircleDot,
  Lightbulb,
  AlertTriangle,
  CheckCircle,
  Clock,
  MessageSquare,
} from "lucide-react";

const prStatusConfig = {
  "needs-review": {
    label: "Needs Review",
    color: "bg-warning/10 text-warning border-warning/20",
  },
  blocked: {
    label: "Blocked",
    color: "bg-destructive/10 text-destructive border-destructive/20",
  },
  ready: {
    label: "Ready to Merge",
    color: "bg-success/10 text-success border-success/20",
  },
};

const priorityConfig = {
  high: {
    icon: AlertTriangle,
    color: "text-destructive",
  },
  medium: {
    icon: Clock,
    color: "text-warning",
  },
  low: {
    icon: CheckCircle,
    color: "text-muted-foreground",
  },
};

export default function Manage() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manager Console</h1>
          <p className="mt-1 text-muted-foreground">
            Review pull requests, manage issues, and get AI-powered focus suggestions.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Pull Requests */}
          <div className="rounded-lg border border-border bg-card shadow-card">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <GitPullRequest className="h-5 w-5 text-accent" />
                <h2 className="text-lg font-semibold text-card-foreground">Pull Requests</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              {pullRequests.map((pr) => {
                const statusConfig = prStatusConfig[pr.status];
                return (
                  <div
                    key={pr.id}
                    className="px-6 py-4 transition-colors hover:bg-muted/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-card-foreground truncate">
                          #{pr.id} {pr.title}
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                          by @{pr.author} · {pr.createdAt}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {pr.labels.map((label) => (
                            <Badge
                              key={label}
                              variant="outline"
                              className="text-xs"
                            >
                              {label}
                            </Badge>
                          ))}
                        </div>
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("shrink-0", statusConfig.color)}
                      >
                        {statusConfig.label}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Issues */}
          <div className="rounded-lg border border-border bg-card shadow-card">
            <div className="border-b border-border px-6 py-4">
              <div className="flex items-center gap-2">
                <CircleDot className="h-5 w-5 text-warning" />
                <h2 className="text-lg font-semibold text-card-foreground">Issues</h2>
              </div>
            </div>
            <div className="divide-y divide-border">
              {issues.map((issue) => (
                <div
                  key={issue.id}
                  className="px-6 py-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-card-foreground truncate">
                        #{issue.id} {issue.title}
                      </p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {issue.createdAt}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {issue.labels.map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className={cn(
                              "text-xs",
                              label === "high-impact" &&
                                "bg-destructive/10 text-destructive border-destructive/20"
                            )}
                          >
                            {label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MessageSquare className="h-3.5 w-3.5" />
                      {issue.comments}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Focus Suggestions */}
        <div className="rounded-lg border border-border bg-card shadow-card">
          <div className="border-b border-border px-6 py-4">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-accent" />
              <h2 className="text-lg font-semibold text-card-foreground">Focus Suggestions</h2>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              AI-powered insights to help you prioritize work
            </p>
          </div>
          <div className="divide-y divide-border">
            {focusSuggestions.map((suggestion) => {
              const config = priorityConfig[suggestion.priority];
              return (
                <div
                  key={suggestion.id}
                  className="flex items-start gap-4 px-6 py-4"
                >
                  <config.icon className={cn("mt-0.5 h-5 w-5 shrink-0", config.color)} />
                  <p className="text-sm text-card-foreground">{suggestion.insight}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
