import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Loader2, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getRepoMembers, RepoMember } from "@/lib/roleService";

interface AssignTaskDialogProps {
  repo: string;
  taskId: string;
  taskTitle: string;
  assignedTo?: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (assignedTo: string[]) => Promise<void>;
}

export function AssignTaskDialog({
  repo,
  taskId,
  taskTitle,
  assignedTo = [],
  open,
  onOpenChange,
  onSave,
}: AssignTaskDialogProps) {
  const { toast } = useToast();
  const [contributors, setContributors] = useState<RepoMember[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>(assignedTo);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch contributors when dialog opens
  useEffect(() => {
    if (open) {
      fetchContributors();
      setSelectedMembers(assignedTo);
    }
  }, [open, assignedTo]);

  const fetchContributors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRepoMembers(repo, 1, 100);
      // Filter to only show contributors (exclude admins from visual perspective)
      const contribs = data.members.filter(m => m.role !== "admin");
      setContributors(contribs);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch contributors");
      toast({
        title: "Error",
        description: "Failed to fetch contributors",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      await onSave(selectedMembers);
      toast({
        title: "Success",
        description: "Task assignments updated",
      });
      onOpenChange(false);
    } catch (err) {
      console.error("Failed to save assignments:", err);
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save assignments",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Task</DialogTitle>
          <DialogDescription>
            Assign "{taskTitle}" to team members
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : contributors.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No contributors available
            </p>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {contributors.map((member) => (
                <div key={member.user_id} className="flex items-center space-x-2">
                  <Checkbox
                    id={member.user_id}
                    checked={selectedMembers.includes(member.user_id)}
                    onCheckedChange={() => handleToggleMember(member.user_id)}
                  />
                  <Label
                    htmlFor={member.user_id}
                    className="flex-1 cursor-pointer font-normal"
                  >
                    {member.github_username}
                  </Label>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || loading || error !== null}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
