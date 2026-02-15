import { Draggable, Droppable } from "@hello-pangea/dnd";
import { cn } from "@/lib/utils";
import { GripVertical, Plus, Pencil, Trash2, MoreHorizontal } from "lucide-react";
import { PlanningColumnType, PlanningCardType } from "./types";
import { KanbanCard } from "./KanbanCard";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface KanbanColumnProps {
  column: PlanningColumnType;
  index: number;
  userRole?: string | null;
  onEditColumn: (column: PlanningColumnType) => void;
  onDeleteColumn: (columnId: string) => void;
  onAddCard: (columnId: string) => void;
  onEditCard: (card: PlanningCardType, columnId: string) => void;
  onDeleteCard: (cardId: string, columnId: string) => void;
}

export function KanbanColumn({
  column,
  index,
  userRole,
  onEditColumn,
  onDeleteColumn,
  onAddCard,
  onEditCard,
  onDeleteCard,
}: KanbanColumnProps) {
  const isContributor = userRole === "contributor";
  return (
    <Draggable draggableId={column.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={cn(
            "flex w-72 shrink-0 flex-col rounded-xl border border-border bg-muted/30 transition-all duration-200",
            snapshot.isDragging && "shadow-xl ring-2 ring-primary/20"
          )}
        >
          {/* Column Header */}
          <div
            className="flex items-center gap-2 rounded-t-xl px-3 py-3"
            style={{ backgroundColor: `${column.color}20` }}
          >
            <div
              {...provided.dragHandleProps}
              className="shrink-0 cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground/70" />
            </div>
            <div
              className="h-3 w-3 shrink-0 rounded-full"
              style={{ backgroundColor: column.color }}
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-card-foreground text-sm truncate">
                {column.title}
              </h3>
              {column.description && (
                <p className="text-[10px] text-muted-foreground truncate">
                  {column.description}
                </p>
              )}
            </div>
            <span className="shrink-0 rounded-full bg-background px-2 py-0.5 text-xs font-medium text-muted-foreground">
              {column.cards.length}
            </span>
            {!isContributor && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => onEditColumn(column)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Column
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDeleteColumn(column.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Column
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Cards Container */}
          <Droppable droppableId={column.id} type="card">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className={cn(
                  "flex-1 space-y-2 p-2 min-h-[100px] transition-colors",
                  snapshot.isDraggingOver && "bg-primary/5"
                )}
              >
                {column.cards.map((card, cardIndex) => (
                  <KanbanCard
                    key={card.id}
                    card={card}
                    index={cardIndex}
                    userRole={userRole}
                    onEdit={(card) => onEditCard(card, column.id)}
                    onDelete={(cardId) => onDeleteCard(cardId, column.id)}
                  />
                ))}
                {provided.placeholder}
                {column.cards.length === 0 && !snapshot.isDraggingOver && (
                  <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-border/50">
                    <p className="text-xs text-muted-foreground">No cards</p>
                  </div>
                )}
              </div>
            )}
          </Droppable>

          {/* Add Card Button */}
          {!isContributor && (
            <div className="p-2 pt-0">
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start text-muted-foreground hover:text-foreground"
                onClick={() => onAddCard(column.id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Card
              </Button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  );
}
