import { useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { removeRepoMember, RepoMember } from "@/lib/roleService";

interface RemoveMemberDialogProps {
  repo: string;
  member: RepoMember | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function RemoveMemberDialog({ repo, member, open, onOpenChange, onSuccess }: RemoveMemberDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleRemove = async () => {
    if (!member) return;

    setLoading(true);
    try {
      await removeRepoMember(repo, member.user_id);

      toast({
        title: "Success",
        description: `${member.github_username} has been removed from the repository`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to remove member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!member) return null;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Remove Member</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to remove <strong>{member.github_username}</strong> from this repository? They will
            lose access to all repository features.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleRemove} disabled={loading} className="bg-destructive hover:bg-destructive/90">
            {loading ? "Removing..." : "Remove"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
