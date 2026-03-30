import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { updateMemberRole, UserRole } from "@/lib/roleService";
import { Loader2 } from "lucide-react";
import { RepoMember } from "@/lib/roleService";

interface EditMemberDialogProps {
  repo: string;
  member: RepoMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function EditMemberDialog({ repo, member, open, onOpenChange, onSuccess }: EditMemberDialogProps) {
  const [role, setRole] = useState<UserRole>(member?.role || "contributor");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!member) return;

    if (role === member.role) {
      toast({
        title: "Info",
        description: "Role is already set to this value",
      });
      return;
    }

    setLoading(true);
    try {
      await updateMemberRole(repo, member.user_id, { role: role as any });

      toast({
        title: "Success",
        description: `${member.github_username} role updated to ${role}`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update member role",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Member Role</DialogTitle>
          <DialogDescription>Change the role for {member.github_username}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="role" className="text-sm font-medium">
              Role
            </label>
            <Select value={role || "contributor"} onValueChange={(value: any) => setRole(value)} disabled={loading}>
              <SelectTrigger id="role">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contributor">Contributor (Read-only)</SelectItem>
                <SelectItem value="maintainer">Maintainer (Can edit planning)</SelectItem>
                <SelectItem value="admin">Admin (Full control)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || role === member.role}>
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Update Role
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
