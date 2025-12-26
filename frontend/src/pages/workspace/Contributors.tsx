import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ContributorCard } from "@/components/ContributorCard";
import { contributors } from "@/data/mockData";
import { Users } from "lucide-react";

export default function Contributors() {
  const coreContributors = contributors.filter((c) => c.type === "core");
  const regularContributors = contributors.filter((c) => c.type === "regular");
  const firstTimeContributors = contributors.filter((c) => c.type === "first-time");
  const inactiveContributors = contributors.filter((c) => c.type === "inactive");

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contributors</h1>
          <p className="mt-1 text-muted-foreground">
            View contribution metrics and recognize your team members.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-accent/10 p-2">
                <Users className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{contributors.length}</p>
                <p className="text-sm text-muted-foreground">Total Contributors</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-warning/10 p-2">
                <Users className="h-4 w-4 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{coreContributors.length}</p>
                <p className="text-sm text-muted-foreground">Core Contributors</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/10 p-2">
                <Users className="h-4 w-4 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{firstTimeContributors.length}</p>
                <p className="text-sm text-muted-foreground">First-time</p>
              </div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-muted p-2">
                <Users className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{inactiveContributors.length}</p>
                <p className="text-sm text-muted-foreground">Inactive</p>
              </div>
            </div>
          </div>
        </div>

        {/* Table Header */}
        <div className="hidden items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground lg:flex">
          <div className="flex-1">Contributor</div>
          <div className="w-16 text-center">Commits</div>
          <div className="w-16 text-center">PRs</div>
          <div className="w-16 text-center">Issues</div>
          <div className="w-16 text-right">Score</div>
        </div>

        {/* Contributors List */}
        <div className="space-y-3">
          {contributors.map((contributor) => (
            <ContributorCard
              key={contributor.id}
              name={contributor.name}
              username={contributor.username}
              commits={contributor.commits}
              prsMerged={contributor.prsMerged}
              issuesClosed={contributor.issuesClosed}
              score={contributor.score}
              type={contributor.type}
            />
          ))}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
