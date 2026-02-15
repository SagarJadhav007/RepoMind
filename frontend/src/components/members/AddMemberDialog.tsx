import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTabs } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { addRepoMember } from "@/lib/roleService";
import { Loader2, AlertCircle, Search } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";

interface RepoMindUser {
  id: string;
  username: string;
  full_name: string;
  skills?: string[];
}

interface AddMemberDialogProps {
  repo: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function AddMemberDialog({ repo, open, onOpenChange, onSuccess }: AddMemberDialogProps) {
  const [selectedUser, setSelectedUser] = useState<RepoMindUser | null>(null);
  const [role, setRole] = useState<"contributor" | "maintainer">("contributor");
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [users, setUsers] = useState<RepoMindUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch available RepoMind users when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableUsers();
    }
  }, [open]);

  const fetchAvailableUsers = async () => {
    try {
      setFetchingUsers(true);
      setError(null);

      const session = (await supabase.auth.getSession()).data.session;
      if (!session) throw new Error("Not authenticated");

      const response = await fetch(
        `https://repomind-577n.onrender.com/user/directory`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch users");
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch users");
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAddMember = async () => {
    if (!selectedUser) {
      toast({
        title: "Error",
        description: "Please select a user",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      await addRepoMember(repo, {
        github_username: selectedUser.username,
        role: role as any,
      });

      toast({
        title: "Success",
        description: `${selectedUser.full_name} added as ${role}`,
      });

      setSelectedUser(null);
      setRole("contributor");
      setSearchQuery("");
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add member",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
          <DialogDescription>
            Add someone from RepoMind to your repository team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {fetchingUsers ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or username..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* User List */}
              <div className="space-y-2">
                {filteredUsers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {users.length === 0
                      ? "No users available"
                      : "No matching users found"}
                  </p>
                ) : (
                  filteredUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className={`w-full p-3 rounded-lg border transition-colors text-left ${
                        selectedUser?.id === user.id
                          ? "border-primary bg-primary/10"
                          : "border-border hover:bg-muted"
                      }`}
                      disabled={loading}
                    >
                      <div className="font-medium text-sm">{user.full_name}</div>
                      <div className="text-xs text-muted-foreground">@{user.username}</div>
                      {user.skills && user.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {user.skills.slice(0, 3).map((skill) => (
                            <span
                              key={skill}
                              className="text-xs bg-muted px-2 py-0.5 rounded"
                            >
                              {skill}
                            </span>
                          ))}
                          {user.skills.length > 3 && (
                            <span className="text-xs text-muted-foreground">
                              +{user.skills.length - 3} more
                            </span>
                          )}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>

              {/* Role Selection */}
              {selectedUser && (
                <div className="space-y-2 pt-2 border-t">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select
                    value={role}
                    onValueChange={(value: any) => setRole(value)}
                    disabled={loading}
                  >
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
                    {role === "contributor" &&
                      "Can view repository data and planning boards"}
                    {role === "maintainer" &&
                      "Can create and manage planning items, and assign tasks"}
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleAddMember} disabled={loading || !selectedUser}>
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Member"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
