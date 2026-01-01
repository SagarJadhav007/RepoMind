import { useEffect, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { ContributorCard } from "@/components/ContributorCard";
import { Users } from "lucide-react";

type Contributor = {
  id: string;
  name: string | null;
  username: string;
  avatar_url?: string;
  commits: number;
  prs_merged: number;
  issues_closed: number;
  score: number;
  type: "core" | "regular" | "first-time" | "inactive";
};

export default function Contributors() {
  const repoFullName = "SagarJadhav007/TruthSpotter"; // 🔥 make dynamic later

  const [contributors, setContributors] = useState<Contributor[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // ---------------------------
  // Fetch Contributors (list only)
  // ---------------------------
  const fetchContributors = async (pageNum: number) => {
    setLoading(true);
    try {
      const res = await fetch(
        `https://repomind-577n.onrender.com/contributors?page=1&limit=10`
      );
      const data = await res.json();

      setContributors(data.contributors);
      setTotal(data.total);
    } catch (err) {
      console.error("Failed to fetch contributors", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContributors(1);
  }, []);

  // ---------------------------
  // Derived counts (from DB data)
  // ---------------------------
  const coreCount = contributors.filter(c => c.type === "core").length;
  const firstTimeCount = contributors.filter(c => c.type === "first-time").length;
  const inactiveCount = contributors.filter(c => c.type === "inactive").length;

  const hasNext = page * 10 < total;
  const hasPrev = page > 1;

  return (
    <WorkspaceLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contributors</h1>
          <p className="mt-1 text-muted-foreground">
            View contribution metrics and recognize your team members.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="grid gap-4 sm:grid-cols-4">
          <StatCard label="Total Contributors" value={total} />
          <StatCard label="Core Contributors" value={coreCount} variant="warning" />
          <StatCard label="First-time" value={firstTimeCount} variant="success" />
          <StatCard label="Inactive" value={inactiveCount} variant="muted" />
        </div>

        {/* Table Header */}
        <div className="hidden items-center gap-4 rounded-lg bg-muted/50 px-4 py-3 text-sm font-medium text-muted-foreground lg:flex">
          <div className="flex-1">Contributor</div>
          <div className="w-16 text-center">Commits</div>
          <div className="w-16 text-center">PRs</div>
          <div className="w-16 text-center">Issues</div>
          <div className="w-16 text-right">Score</div>
        </div>

        {/* Contributors List */}
        <div className="space-y-3 min-h-[300px]">
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading contributors...</p>
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
      </div>
    </WorkspaceLayout>
  );
}

// ---------------------------
// Small helper component
// ---------------------------
function StatCard({
  label,
  value,
  variant = "accent",
}: {
  label: string;
  value: number;
  variant?: "accent" | "warning" | "success" | "muted";
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex items-center gap-3">
        <div className={`rounded-lg bg-${variant}/10 p-2`}>
          <Users className={`h-4 w-4 text-${variant}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-card-foreground">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </div>
    </div>
  );
}
