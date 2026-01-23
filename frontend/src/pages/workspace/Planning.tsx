import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { KanbanBoard } from "@/components/planning/KanbanBoard";

export default function Planning() {
  return (
    <WorkspaceLayout>
      <div className="flex flex-col h-full">
        {/* Page Header */}
        <div className="shrink-0 pb-6">
          <h1 className="text-2xl font-bold text-foreground">Feature Planning</h1>
          <p className="mt-1 text-muted-foreground">
            Drag columns and cards to organize your roadmap. Click + to add new items.
          </p>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard />
        </div>
      </div>
    </WorkspaceLayout>
  );
}