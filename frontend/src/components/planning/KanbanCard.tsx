import { Draggable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { GitPullRequest, CircleDot, GripVertical, Pencil, Trash2 } from "lucide-react";
import { PlanningCardType } from "./types";
import { Button } from "@/components/ui/button";

interface KanbanCardProps {
  card: PlanningCardType;
  index: number;
  onEdit: (card: PlanningCardType) => void;
  onDelete: (cardId: string) => void;
}

export function KanbanCard({ card, index, onEdit, onDelete }: KanbanCardProps) {
  return (
    <Draggable draggableId={card.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "group rounded-lg border border-border bg-card p-3 shadow-sm transition-all duration-200",
            snapshot.isDragging && "shadow-lg ring-2 ring-primary/20 rotate-2"
          )}
        >
          <div className="flex items-start gap-2">
            <div
              {...provided.dragHandleProps}
              className="mt-0.5 shrink-0 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/50 transition-colors group-hover:text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-medium text-card-foreground text-sm leading-tight">
                  {card.title}
                </h4>
                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => onEdit(card)}
                  >
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-destructive hover:text-destructive"
                    onClick={() => onDelete(card.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              {card.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {card.description}
                </p>
              )}
              {(card.linkedPR || card.linkedIssue) && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {card.linkedPR && (
                    <span className="inline-flex items-center gap-1 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-medium text-accent">
                      <GitPullRequest className="h-2.5 w-2.5" />
                      #{card.linkedPR}
                    </span>
                  )}
                  {card.linkedIssue && (
                    <span className="inline-flex items-center gap-1 rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      <CircleDot className="h-2.5 w-2.5" />
                      #{card.linkedIssue}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );
}
