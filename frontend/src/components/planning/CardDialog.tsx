import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { PlanningCardType } from "./types";

interface CardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card?: PlanningCardType | null;
  onSave: (data: {
    title: string;
    description: string;
    linkedPR?: number | null;
    linkedIssue?: number | null;
  }) => void;
}

export function CardDialog({
  open,
  onOpenChange,
  card,
  onSave,
}: CardDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [linkedPR, setLinkedPR] = useState("");
  const [linkedIssue, setLinkedIssue] = useState("");

  useEffect(() => {
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setLinkedPR(card.linkedPR?.toString() || "");
      setLinkedIssue(card.linkedIssue?.toString() || "");
    } else {
      setTitle("");
      setDescription("");
      setLinkedPR("");
      setLinkedIssue("");
    }
  }, [card, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSave({
      title: title.trim(),
      description: description.trim(),
      linkedPR: linkedPR ? parseInt(linkedPR, 10) : null,
      linkedIssue: linkedIssue ? parseInt(linkedIssue, 10) : null,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{card ? "Edit Card" : "Add Card"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title..."
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="card-description">Description</Label>
            <Textarea
              id="card-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the task..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="linked-pr">Linked PR #</Label>
              <Input
                id="linked-pr"
                type="number"
                value={linkedPR}
                onChange={(e) => setLinkedPR(e.target.value)}
                placeholder="e.g., 123"
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="linked-issue">Linked Issue #</Label>
              <Input
                id="linked-issue"
                type="number"
                value={linkedIssue}
                onChange={(e) => setLinkedIssue(e.target.value)}
                placeholder="e.g., 456"
                min={1}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim()}>
              {card ? "Save Changes" : "Add Card"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
