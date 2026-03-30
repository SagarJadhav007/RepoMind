import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { TimelineItem } from "@/components/TimelineItem";
import { activityEvents } from "@/data/mockData";
import { History } from "lucide-react";

export default function Activity() {
  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-muted p-2">
              <History className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Activity Timeline</h1>
              <p className="text-muted-foreground">
                Recent events and activity across the repository.
              </p>
            </div>
          </div>
        </div>

        {/* Timeline */}
        <div className="rounded-lg border border-border bg-card p-6 shadow-card">
          <div className="max-w-2xl">
            {activityEvents.map((event, index) => (
              <TimelineItem
                key={event.id}
                type={event.type}
                title={event.title}
                description={event.description}
                timestamp={event.timestamp}
                isLast={index === activityEvents.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
