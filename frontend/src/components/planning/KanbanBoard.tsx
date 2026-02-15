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
import { useUserRole } from "@/hooks/useUserRole";
import { useIsMaintainerOrAbove } from "@/hooks/useUserRole";
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

const initialColumns: PlanningColumnType[] = [];

export function KanbanBoard() {
  const { repo } = useRepo();
  const { toast } = useToast();
  const { role: userRole, loading: roleLoading } = useUserRole();
  const { canAssignTasks } = useIsMaintainerOrAbove();
  
  const [columns, setColumns] = useState<PlanningColumnType[]>([]);
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
  const [deleteBoardOpen, setDeleteBoardOpen] = useState(false);

  const isAdmin = userRole === "admin";

  // Load board data on mount
  useEffect(() => {
    if (!repo) {
      setError("No repository selected. Please select a repository first.");
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const board = await planningApi.getBoard(repo);

        setColumns(
          board.columns.map((col) => ({
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
          }))
        );
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Failed to load board";
        setError(errorMessage);
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    })();
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

  const confirmDeleteBoard = async () => {
    if (!repo) return;
    try {
      setSaving(true);
      await planningApi.deleteBoard(repo);
      setColumns([]);
      toast({
        title: "Success",
        description: "Planning board deleted",
      });
      setDeleteBoardOpen(false);
    } catch (error) {
      console.error("Failed to delete board:", error);
      toast({
        title: "Error",
        description: "Failed to delete board",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;
    if (!destination || !repo) return;

    // Contributors cannot drag
    if (userRole === "contributor") {
      toast({
        title: "Permission Denied",
        description: "Contributors cannot modify the board",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      if (type === "column") {
        const updated = Array.from(columns);
        const [moved] = updated.splice(source.index, 1);
        updated.splice(destination.index, 0, moved);
        setColumns(updated);

        const columnIds = updated.map(c => c.id).filter(Boolean);
        await planningApi.reorderColumns(repo, columnIds);
      } else {
        const sourceCol = columns.find(c => c.id === source.droppableId);
        const destCol = columns.find(c => c.id === destination.droppableId);
        if (!sourceCol || !destCol) return;

        if (sourceCol.id === destCol.id) {
          const cards = Array.from(sourceCol.cards);
          const [moved] = cards.splice(source.index, 1);
          cards.splice(destination.index, 0, moved);

          setColumns(cols =>
            cols.map(c => c.id === sourceCol.id ? { ...c, cards } : c)
          );

          const cardIds = cards.map(c => c.id).filter(Boolean);
          await planningApi.reorderCards(sourceCol.id, cardIds);
        } else {
          const sourceCards = Array.from(sourceCol.cards);
          const destCards = Array.from(destCol.cards);
          const [moved] = sourceCards.splice(source.index, 1);
          destCards.splice(destination.index, 0, moved);

          setColumns(cols =>
            cols.map(c => {
              if (c.id === sourceCol.id) return { ...c, cards: sourceCards };
              if (c.id === destCol.id) return { ...c, cards: destCards };
              return c;
            })
          );

          await planningApi.moveCard(moved.id, destCol.id, destination.index);
        }
      }

      toast({ title: "Success", description: "Changes saved" });
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save changes",
        variant: "destructive",
      });
      // Reload board to sync state with server
      if (repo) {
        try {
          const board = await planningApi.getBoard(repo);
          setColumns(
            board.columns.map((col) => ({
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
            }))
          );
        } catch (reloadError) {
          console.error("Failed to reload board:", reloadError);
        }
      }
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

  // Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3 text-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-destructive">{error}</p>
          <Button
            onClick={() => {
              setError(null);
              setLoading(true);
              if (repo) {
                planningApi.getBoard(repo)
                  .then(board => {
                    setColumns(
                      board.columns.map((col) => ({
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
                      }))
                    );
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
      <div className="flex justify-end gap-2 mb-4">
        {isAdmin && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteBoardOpen(true)}
          >
            Delete Board
          </Button>
        )}
      </div>

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
                  userRole={userRole}
                  onEditColumn={handleEditColumn}
                  onDeleteColumn={handleDeleteColumn}
                  onAddCard={handleAddCard}
                  onEditCard={handleEditCard}
                  onDeleteCard={handleDeleteCard}
                />
              ))}
              {provided.placeholder}
              {userRole !== "contributor" && (
                <Button
                  variant="outline"
                  className="h-auto min-h-[120px] w-72 shrink-0 flex-col gap-2 border-dashed"
                  onClick={handleAddColumn}
                  disabled={saving}
                >
                  <Plus className="h-6 w-6" />
                  Add Column
                </Button>
              )}
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

      {/* Delete Board Confirmation */}
      <AlertDialog open={deleteBoardOpen} onOpenChange={setDeleteBoardOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Planning Board</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire planning board? All columns and cards will be permanently removed. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteBoard} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? "Deleting..." : "Delete Board"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}