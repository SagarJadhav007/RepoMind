import { cn } from "@/lib/utils";
import { GitPullRequest, CircleDot, GripVertical } from "lucide-react";

interface PlanningCardProps {
  title: string;
  description: string;
  linkedPR?: number | null;
  linkedIssue?: number | null;
  className?: string;
}

export function PlanningCard({
  title,
  description,
  linkedPR,
  linkedIssue,
  className,
}: PlanningCardProps) {
  return (
    <div
      className={cn(
        "group cursor-grab rounded-lg border border-border bg-card p-4 shadow-card transition-all duration-200 hover:shadow-card-hover active:cursor-grabbing",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-card-foreground truncate">{title}</h4>
          <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
            {description}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {linkedPR && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent/10 px-2 py-1 text-xs font-medium text-accent">
                <GitPullRequest className="h-3 w-3" />
                #{linkedPR}
              </span>
            )}
            {linkedIssue && (
              <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                <CircleDot className="h-3 w-3" />
                #{linkedIssue}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
