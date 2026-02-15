import { useEffect, useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RoleBadge } from "@/components/RoleBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Edit, Trash2, Loader2, Link2 } from "lucide-react";
import { getRepoMembers, RepoMember } from "@/lib/roleService";
import { useUserRole } from "@/hooks/useUserRole";
import { AddMemberDialog } from "./AddMemberDialog";
import { EditMemberDialog } from "./EditMemberDialog";
import { RemoveMemberDialog } from "./RemoveMemberDialog";
import { InviteMemberDialog } from "./InviteMemberDialog";

interface MembersListProps {
  repo: string;
}

export function MembersList({ repo }: MembersListProps) {
  const [members, setMembers] = useState<RepoMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editMember, setEditMember] = useState<RepoMember | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [removeMember, setRemoveMember] = useState<RepoMember | null>(null);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { role: userRole, loading: roleLoading } = useUserRole();
  const isAdmin = userRole === "admin";

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getRepoMembers(repo, 1, 100);
      setMembers(data.members);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers();
  }, [repo]);

  if (loading || roleLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Repository Members</h3>
          <Skeleton className="w-32 h-10" />
        </div>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="w-full h-12" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-lg flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-destructive mt-0.5" />
        <div>
          <p className="font-semibold text-destructive">Error loading members</p>
          <p className="text-sm text-destructive/80">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Repository Members ({members.length})</h3>
        {isAdmin && (
          <div className="flex gap-2">
            <Button onClick={() => setAddDialogOpen(true)} size="sm">
              Add Member
            </Button>
            <Button onClick={() => setInviteDialogOpen(true)} size="sm" variant="outline">
              <Link2 className="w-4 h-4 mr-2" />
              Invite Link
            </Button>
          </div>
        )}
      </div>

      {members.length === 0 ? (
        <div className="p-6 text-center text-muted-foreground">No members yet</div>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Added</TableHead>
                {isAdmin && <TableHead className="text-right">Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">{member.github_username}</TableCell>
                  <TableCell>
                    <RoleBadge role={member.role} size="sm" />
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(member.added_at).toLocaleDateString()}
                  </TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditMember(member);
                            setEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => {
                            setRemoveMember(member);
                            setRemoveDialogOpen(true);
                          }}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <AddMemberDialog
        repo={repo}
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        onSuccess={fetchMembers}
      />

      <EditMemberDialog
        repo={repo}
        member={editMember}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onSuccess={fetchMembers}
      />

      <RemoveMemberDialog
        repo={repo}
        member={removeMember}
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onSuccess={fetchMembers}
      />

      <InviteMemberDialog
        repo={repo}
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
      />
        open={removeDialogOpen}
        onOpenChange={setRemoveDialogOpen}
        onSuccess={fetchMembers}
      />
    </div>
  );
}
