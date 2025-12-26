import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { PlanningCard } from "@/components/PlanningCard";
import { planningItems } from "@/data/mockData";
import { cn } from "@/lib/utils";

const columns = [
  { id: "planned", title: "Planned", items: planningItems.planned, color: "bg-muted" },
  { id: "inProgress", title: "In Progress", items: planningItems.inProgress, color: "bg-accent/10" },
  { id: "shipped", title: "Shipped", items: planningItems.shipped, color: "bg-success/10" },
];

export default function Planning() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Feature Planning</h1>
          <p className="mt-1 text-muted-foreground">
            Track features from ideation to release with linked PRs and issues.
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid gap-6 lg:grid-cols-3">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col">
              {/* Column Header */}
              <div
                className={cn(
                  "flex items-center justify-between rounded-t-lg border border-b-0 border-border px-4 py-3",
                  column.color
                )}
              >
                <h3 className="font-semibold text-card-foreground">{column.title}</h3>
                <span className="rounded-full bg-card px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {column.items.length}
                </span>
              </div>

              {/* Column Content */}
              <div className="flex-1 space-y-3 rounded-b-lg border border-t-0 border-border bg-muted/30 p-3">
                {column.items.map((item) => (
                  <PlanningCard
                    key={item.id}
                    title={item.title}
                    description={item.description}
                    linkedPR={item.linkedPR}
                    linkedIssue={item.linkedIssue}
                  />
                ))}
                {column.items.length === 0 && (
                  <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border">
                    <p className="text-sm text-muted-foreground">No items</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceLayout>
  );
}
