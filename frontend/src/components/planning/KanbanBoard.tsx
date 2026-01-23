import { useState, useEffect } from "react";
import { DragDropContext, Droppable, DropResult } from "@hello-pangea/dnd";
import { Plus, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlanningColumnType, PlanningCardType, COLUMN_COLORS } from "./types";
import { KanbanColumn } from "./KanbanColumn";
import { ColumnDialog } from "./ColumnDialog";
import { CardDialog } from "./CardDialog";
import { useToast } from "@/hooks/use-toast";
import { useRepo } from "@/context/RepoContext";
import * as planningApi from "@/lib/planning";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const initialColumns: PlanningColumnType[] = [
  {
    id: "planned",
    title: "Planned",
    description: "Features in the pipeline",
    color: COLUMN_COLORS[0].value,
    cards: [
      {
        id: "card-1",
        title: "Implement notifications",
        description: "Add real-time push notifications for important events",
        linkedIssue: 42,
        linkedPR: null,
      },
      {
        id: "card-2",
        title: "Dark mode improvements",
        description: "Enhance contrast and color palette for dark theme",
        linkedIssue: 38,
        linkedPR: null,
      },
    ],
  },
  {
    id: "in-progress",
    title: "In Progress",
    description: "Currently being worked on",
    color: COLUMN_COLORS[6].value,
    cards: [
      {
        id: "card-3",
        title: "API rate limiting",
        description: "Implement rate limiting for public API endpoints",
        linkedPR: 156,
        linkedIssue: 35,
      },
    ],
  },
  {
    id: "shipped",
    title: "Shipped",
    description: "Released to production",
    color: COLUMN_COLORS[4].value,
    cards: [
      {
        id: "card-4",
        title: "User authentication",
        description: "OAuth2 login with GitHub, Google, and email",
        linkedPR: 142,
        linkedIssue: 20,
      },
      {
        id: "card-5",
        title: "Dashboard redesign",
        description: "New modern dashboard layout with improved metrics",
        linkedPR: 138,
        linkedIssue: 15,
      },
    ],
  },
];

export function KanbanBoard() {
  const { repo } = useRepo();
  const { toast } = useToast();
  const [columns, setColumns] = useState<PlanningColumnType[]>(initialColumns);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Column dialog state
  const [columnDialogOpen, setColumnDialogOpen] = useState(false);
  const [editingColumn, setEditingColumn] = useState<PlanningColumnType | null>(null);

  // Card dialog state
  const [cardDialogOpen, setCardDialogOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<PlanningCardType | null>(null);
  const [activeColumnId, setActiveColumnId] = useState<string | null>(null);

  // Delete confirmation state
  const [deleteColumnId, setDeleteColumnId] = useState<string | null>(null);
  const [deleteCardInfo, setDeleteCardInfo] = useState<{ cardId: string; columnId: string } | null>(null);

  // Load board data on mount
  useEffect(() => {
    if (!repo) {
      setError("No repository selected. Please select a repository first.");
      setLoading(false);
      return;
    }

    const loadBoard = async () => {
      try {
        setLoading(true);
        setError(null);
        const board = await planningApi.getBoard(repo);

        // Convert API response to component format
        const loadedColumns: PlanningColumnType[] = board.columns.map((col) => ({
          id: col.id,
          title: col.title,
          description: col.description,
          color: col.color,
          cards: col.cards.map((card) => ({
            id: card.id,
            title: card.title,
            description: card.description,
            linkedPR: card.linkedPR,
            linkedIssue: card.linkedIssue,
          })),
        }));

        setColumns(loadedColumns);
      } catch (error) {
        console.error("Failed to load planning board:", error);
        const errorMessage = error instanceof Error ? error.message : "Failed to load your planning board";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBoard();
  }, [repo, toast]);

  // Column CRUD Handlers
  const handleAddColumn = () => {
    setEditingColumn(null);
    setColumnDialogOpen(true);
  };

  const handleEditColumn = (column: PlanningColumnType) => {
    setEditingColumn(column);
    setColumnDialogOpen(true);
  };

  const handleSaveColumn = async (data: { title: string; description: string; color: string }) => {
    if (!repo) return;

    try {
      setSaving(true);

      if (editingColumn) {
        // Update existing column
        await planningApi.updateColumn(editingColumn.id, data);
        setColumns(
          columns.map((col) =>
            col.id === editingColumn.id ? { ...col, ...data } : col
          )
        );
      } else {
        // Create new column
        const newColumnData = await planningApi.createColumn(repo, data);
        const newColumn: PlanningColumnType = {
          id: newColumnData.id,
          ...data,
          cards: [],
        };
        setColumns([...columns, newColumn]);
      }

      toast({
        title: "Success",
        description: editingColumn ? "Column updated" : "Column created",
      });
    } catch (error) {
      console.error("Failed to save column:", error);
      toast({
        title: "Error",
        description: "Failed to save column",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setColumnDialogOpen(false);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    setDeleteColumnId(columnId);
  };

  const confirmDeleteColumn = async () => {
    if (deleteColumnId) {
      try {
        setSaving(true);
        await planningApi.deleteColumn(deleteColumnId);
        setColumns(columns.filter((col) => col.id !== deleteColumnId));
        toast({
          title: "Success",
          description: "Column deleted",
        });
      } catch (error) {
        console.error("Failed to delete column:", error);
        toast({
          title: "Error",
          description: "Failed to delete column",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
        setDeleteColumnId(null);
      }
    }
  };

  // Card CRUD Handlers
  const handleAddCard = (columnId: string) => {
    setEditingCard(null);
    setActiveColumnId(columnId);
    setCardDialogOpen(true);
  };

  const handleEditCard = (card: PlanningCardType, columnId: string) => {
    setEditingCard(card);
    setActiveColumnId(columnId);
    setCardDialogOpen(true);
  };

  const handleSaveCard = async (data: {
    title: string;
    description: string;
    linkedPR?: number | null;
    linkedIssue?: number | null;
  }) => {
    if (!activeColumnId) return;

    try {
      setSaving(true);

      if (editingCard) {
        // Update existing card
        await planningApi.updateCard(editingCard.id, data);
        setColumns(
          columns.map((col) =>
            col.id === activeColumnId
              ? {
                ...col,
                cards: col.cards.map((card) =>
                  card.id === editingCard.id ? { ...card, ...data } : card
                ),
              }
              : col
          )
        );
      } else {
        // Create new card
        const newCardData = await planningApi.createCard(activeColumnId, data);
        const newCard: PlanningCardType = {
          id: newCardData.id,
          title: newCardData.title,
          description: newCardData.description,
          linkedPR: newCardData.linkedPR,
          linkedIssue: newCardData.linkedIssue,
        };
        setColumns(
          columns.map((col) =>
            col.id === activeColumnId
              ? { ...col, cards: [...col.cards, newCard] }
              : col
          )
        );
      }

      toast({
        title: "Success",
        description: editingCard ? "Card updated" : "Card created",
      });
    } catch (error) {
      console.error("Failed to save card:", error);
      toast({
        title: "Error",
        description: "Failed to save card",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
      setCardDialogOpen(false);
    }
  };

  const handleDeleteCard = (cardId: string, columnId: string) => {
    setDeleteCardInfo({ cardId, columnId });
  };

  const confirmDeleteCard = async () => {
    if (deleteCardInfo) {
      try {
        setSaving(true);
        await planningApi.deleteCard(deleteCardInfo.cardId);
        setColumns(
          columns.map((col) =>
            col.id === deleteCardInfo.columnId
              ? { ...col, cards: col.cards.filter((card) => card.id !== deleteCardInfo.cardId) }
              : col
          )
        );
        toast({
          title: "Success",
          description: "Card deleted",
        });
      } catch (error) {
        console.error("Failed to delete card:", error);
        toast({
          title: "Error",
          description: "Failed to delete card",
          variant: "destructive",
        });
      } finally {
        setSaving(false);
        setDeleteCardInfo(null);
      }
    }
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;
    if (!repo) return;

    try {
      setSaving(true);

      if (type === "column") {
        const newColumns = Array.from(columns);
        const [removed] = newColumns.splice(source.index, 1);
        newColumns.splice(destination.index, 0, removed);
        setColumns(newColumns);

        // Save to backend
        const columnIds = newColumns.map((col) => col.id);
        await planningApi.reorderColumns(repo, columnIds);
      } else {
        const sourceColumn = columns.find((col) => col.id === source.droppableId);
        const destColumn = columns.find((col) => col.id === destination.droppableId);

        if (!sourceColumn || !destColumn) return;

        if (sourceColumn.id === destColumn.id) {
          // Same column reorder
          const newCards = Array.from(sourceColumn.cards);
          const [removed] = newCards.splice(source.index, 1);
          newCards.splice(destination.index, 0, removed);

          setColumns(
            columns.map((col) =>
              col.id === sourceColumn.id ? { ...col, cards: newCards } : col
            )
          );

          // Save to backend
          const cardIds = newCards.map((card) => card.id);
          await planningApi.reorderCards(sourceColumn.id, cardIds);
        } else {
          // Move between columns
          const sourceCards = Array.from(sourceColumn.cards);
          const destCards = Array.from(destColumn.cards);
          const [removed] = sourceCards.splice(source.index, 1);
          destCards.splice(destination.index, 0, removed);

          setColumns(
            columns.map((col) => {
              if (col.id === sourceColumn.id) return { ...col, cards: sourceCards };
              if (col.id === destColumn.id) return { ...col, cards: destCards };
              return col;
            })
          );

          // Save to backend
          await planningApi.moveCard(removed.id, destColumn.id, destination.index);
        }
      }

      toast({
        title: "Success",
        description: "Changes saved",
      });
    } catch (error) {
      console.error("Failed to save changes:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
      // Reload to sync state
      location.reload();
    } finally {
      setSaving(false);
    }
  };

  // Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading planning board...</p>
        </div>
      </div>
    );
  }

  // Render no repo selected state
  if (!repo) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground">No repository selected</p>
          <p className="text-sm text-muted-foreground/70">Please select a repository first</p>
        </div>
      </div>
    );
  }

  // Render error state
  if (error && !loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              // Reload board
              if (repo) {
                planningApi.getBoard(repo)
                  .then(board => {
                    const loadedColumns: PlanningColumnType[] = board.columns.map((col) => ({
                      id: col.id,
                      title: col.title,
                      description: col.description,
                      color: col.color,
                      cards: col.cards.map((card) => ({
                        id: card.id,
                        title: card.title,
                        description: card.description,
                        linkedPR: card.linkedPR,
                        linkedIssue: card.linkedIssue,
                      })),
                    }));
                    setColumns(loadedColumns);
                  })
                  .catch(err => setError(err instanceof Error ? err.message : "Failed to load"))
                  .finally(() => setLoading(false));
              }
            }}
            variant="outline"
            size="sm"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  // Render main board
  return (
    <>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="board" type="column" direction="horizontal">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="flex gap-4 overflow-x-auto pb-4"
            >
              {columns.map((column, index) => (
                <KanbanColumn
                  key={column.id}
                  column={column}
                  index={index}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
              {provided.placeholder}
              <Button
                variant="outline"
                className="h-auto min-h-[120px] w-72 shrink-0 flex-col gap-2 border-dashed"
                onClick={handleAddColumn}
                disabled={saving}
              >
                <Plus className="h-6 w-6" />
                Add Column
              </Button>
            </div>
          )}
        </Droppable>
      </DragDropContext>

      <ColumnDialog
        open={columnDialogOpen}
        onOpenChange={setColumnDialogOpen}
        column={editingColumn}
        onSave={handleSaveColumn}
      />

      <CardDialog
        open={cardDialogOpen}
        onOpenChange={setCardDialogOpen}
        card={editingCard}
        onSave={handleSaveCard}
      />

      {/* Delete Column Confirmation */}
      <AlertDialog open={!!deleteColumnId} onOpenChange={() => setDeleteColumnId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Column</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this column? All cards within it will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteColumn} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Card Confirmation */}
      <AlertDialog open={!!deleteCardInfo} onOpenChange={() => setDeleteCardInfo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Card</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCard} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}