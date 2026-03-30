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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, AlertCircle, Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabase";

interface InviteMemberDialogProps {
  repo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({
  repo,
  open,
  onOpenChange,
}: InviteMemberDialogProps) {
  const { toast } = useToast();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [role, setRole] = useState<"contributor" | "maintainer">("contributor");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInviteLink = async () => {
    try {
      setGenerating(true);
      setError(null);

      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        "https://repomind-577n.onrender.com/invite/generate",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            repo_full_name: repo,
            role,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.detail || "Failed to generate invite link");
      }

      const data = await response.json();
      setInviteLink(data.link);

      toast({
        title: "Success",
        description: "Invite link generated successfully",
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate invite link";
      setError(message);
      toast({
        title: "Error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast({
        title: "Copied",
        description: "Invite link copied to clipboard",
      });
    } catch (err) {
      toast({
        title: "Error",
        description: "Failed to copy link",
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Generate Invite Link</DialogTitle>
          <DialogDescription>
            Create a shareable invite link for new members to join this repository
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {!inviteLink ? (
            <>
              <div className="space-y-2">
                <Label htmlFor="role">Default Role for Invitees</Label>
                <Select value={role} onValueChange={(value: any) => setRole(value)}>
                  <SelectTrigger id="role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="contributor">
                      Contributor (Read-only)
                    </SelectItem>
                    <SelectItem value="maintainer">
                      Maintainer (Can edit planning)
                    </SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  This link will assign all users who join with this role
                </p>
              </div>

              <div className="p-3 bg-muted rounded-lg text-sm text-muted-foreground">
                <p>The invite link will:</p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  <li>Expire in 7 days</li>
                  <li>Assign {role} role to new members</li>
                  <li>Work for any RepoMind user</li>
                </ul>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 bg-success/10 border border-success/30 rounded-lg">
                <p className="text-sm font-medium text-success mb-2">Link Generated!</p>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={inviteLink}
                    className="text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={copyToClipboard}
                    variant="outline"
                  >
                    {copied ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>

              <p className="text-sm text-muted-foreground text-center">
                Share this link with your team members. They can use it to join this repository.
              </p>

              <Button
                onClick={() => {
                  setInviteLink(null);
                  setRole("contributor");
                }}
                variant="outline"
                className="w-full"
              >
                Generate Another Link
              </Button>
            </>
          )}
        </div>

        <DialogFooter>
          {!inviteLink && (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                onClick={generateInviteLink}
                disabled={generating}
              >
                {generating ? (
                  <>
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  "Generate Link"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
