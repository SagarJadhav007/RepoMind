import { useEffect, useState } from "react";
import { WorkspaceLayout } from "@/components/layout/WorkspaceLayout";
import { RepoHeader } from "@/components/RepoHeader";
import { HealthScore } from "@/components/HealthScore";
import { StatCard } from "@/components/StatCard";
import { StatusIndicator } from "@/components/StatusIndicator";
import { supabase } from "@/lib/supabase";
import { useRepo } from "@/context/RepoContext";

import {
  GitCommit,
  Users,
  GitMerge,
  XCircle,
} from "lucide-react";

export default function Dashboard() {
  const { repo } = useRepo();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!repo) return;

      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return;

      const res = await fetch(
        `https://repomind-577n.onrender.com/dashboard/?repo=${repo}`,
        {
          headers: {
            Authorization: `Bearer ${session.session.access_token}`,
          },
        }
      );

      setData(await res.json());
      setLoading(false);
    }

    load();
  }, [repo]);

  if (!repo)
    return (
      <WorkspaceLayout>
        <div className="p-6 text-muted-foreground">
          Select a repository from the sidebar
        </div>
      </WorkspaceLayout>
    );

  if (loading)
    return (
      <WorkspaceLayout>
        <div className="p-6">Loading dashboard…</div>
      </WorkspaceLayout>
    );

  return (
    <WorkspaceLayout>
      <RepoHeader {...data.repo} />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mt-6">
        <StatCard title="Commits (30 days)" value={data.activity.commits_30d} icon={GitCommit} />
        <StatCard title="Active Contributors" value={data.activity.contributors} icon={Users} />
        <StatCard title="PR Merge Rate" value={`${data.activity.merge_rate ?? 0}%`} icon={GitMerge} />
        <StatCard title="Deploy Failures" value={0} icon={XCircle} />
      </div>
    </WorkspaceLayout>
  );
}
