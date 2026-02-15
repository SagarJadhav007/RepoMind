import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ContributorCard } from "@/components/ContributorCard";
import { MembersList } from "@/components/members/MembersList";
import { RoleBadge } from "@/components/RoleBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useUserRole } from "@/hooks/useUserRole";
import { Users } from "lucide-react";

/* ---------------- TYPES ---------------- */

type Contributor = {
  id: string;
  name: string | null;
  username: string;
  commits: number;
  prs_merged: number;
  issues_closed: number;
  score: number;
  type: "core" | "regular" | "first-time" | "inactive";
};

/* ---------------- COMPONENT ---------------- */

export default function Contributors() {
  const { repo } = useParams<{ repo: string }>();

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("contributors");

  const { role: userRole, loading: roleLoading } = useUserRole();

  async function fetchContributors(pageNum: number) {
    if (!repo) return;

    setLoading(true);
    try {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const res = await fetch(
        `https://repomind-577n.onrender.com/contributors?repo=${encodeURIComponent(
          repo
        )}&page=${pageNum}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (!res.ok) {
        throw new Error("Failed to fetch contributors");
      }

      const data = await res.json();
      setContributors(data.contributors ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      console.error(err);
      setContributors([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- EFFECT ---------------- */

  useEffect(() => {
    setPage(1);
    fetchContributors(1);
  }, [repo]);

  /* ---------------- STATES ---------------- */

  if (!repo) {
    return (
      <WorkspaceLayout>
        <div className="p-6 text-muted-foreground">
          Repository not selected
        </div>
      </WorkspaceLayout>
    );
  }

  const coreCount = contributors.filter(c => c.type === "core").length;
  const firstTimeCount = contributors.filter(c => c.type === "first-time").length;
  const inactiveCount = contributors.filter(c => c.type === "inactive").length;

  const hasNext = page * 10 < total;
  const hasPrev = page > 1;

  /* ---------------- UI ---------------- */

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">Contributors & Members</h1>
            <p className="text-muted-foreground">
              Contribution metrics and team management
            </p>
          </div>
          {!roleLoading && userRole && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your role:</span>
              <RoleBadge role={userRole} />
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
            <TabsTrigger value="contributors">Contributors</TabsTrigger>
            <TabsTrigger value="members">Team Members</TabsTrigger>
          </TabsList>

          {/* Contributors Tab */}
          <TabsContent value="contributors" className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Total" value={total} />
            <StatCard label="Core" value={coreCount} variant="warning" />
            <StatCard label="First-time" value={firstTimeCount} variant="success" />
            <StatCard label="Inactive" value={inactiveCount} variant="muted" />
          </div>

          {/* List */}
          <div className="space-y-3 min-h-[300px]">
            {loading ? (
              <p className="text-sm text-muted-foreground">
                Loading contributors…
              </p>
            ) : contributors.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No contributors found
              </p>
            ) : (
              contributors.map((c) => (
                <ContributorCard
                  key={c.id}
                  name={c.name}
                  username={c.username}
                  commits={c.commits}
                  prsMerged={c.prs_merged}
                  issuesClosed={c.issues_closed}
                  score={c.score}
                  type={c.type}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          <div className="flex justify-end gap-2">
            <button
              disabled={!hasPrev}
              onClick={() => {
                const p = page - 1;
                setPage(p);
                fetchContributors(p);
              }}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Previous
            </button>

            <button
              disabled={!hasNext}
              onClick={() => {
                const p = page + 1;
                setPage(p);
                fetchContributors(p);
              }}
              className="rounded-md border px-3 py-1 text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </TabsContent>

        {/* Members Tab */}
        {repo && (
          <TabsContent value="members">
            <MembersList repo={repo} />
          </TabsContent>
        )}
        </Tabs>
      </div>
    </WorkspaceLayout>
  );
}

/* ---------------- STAT CARD ---------------- */

function StatCard({
  label,
  value,
  variant = "accent",
}: {
  label: string;
  value: number;
  variant?: "accent" | "warning" | "success" | "muted";
}) {
  const color = {
    accent: "text-accent",
    warning: "text-warning",
    success: "text-green-500",
    muted: "text-muted-foreground",
  }[variant];

  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="flex items-center gap-3">
        <Users className={`h-4 w-4 ${color}`} />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
