import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { KanbanBoard } from "@/components/planning/KanbanBoard";
import { useParams } from "react-router-dom";
import { useRepo } from "@/context/RepoContext";
import { useEffect } from "react";

export default function Planning() {
  const { repo: urlRepo } = useParams<{ repo: string }>();
  const { setRepo } = useRepo();

  // Set repo from URL param when component mounts or URL changes
  useEffect(() => {
    if (urlRepo) {
      setRepo(urlRepo);
    }
  }, [urlRepo, setRepo]);

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