import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useRepo } from "@/context/RepoContext";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderGit2,
  GitBranch,
} from "lucide-react";

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const { repo, setRepo } = useRepo();
  const navigate = useNavigate();
  const location = useLocation();
  const [repos, setRepos] = useState<string[]>([]);

useEffect(() => {
  async function loadRepos() {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return;

    const res = await fetch(
      "https://repomind-577n.onrender.com/github/repos/available",
      {
        headers: {
          Authorization: `Bearer ${data.session.access_token}`,
        },
      }
    );

    const json = await res.json();
    setRepos(json.map((r: any) => r.repo_full_name));

    if (!repo && json.length) {
      setRepo(json[0].repo_full_name);
      navigate(`/workspace/demo?repo=${json[0].repo_full_name}`);
    }
  }

  loadRepos();
}, []);

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 border-r p-4">
        <div className="mb-4 flex items-center gap-2">
          <FolderGit2 />
          <span className="font-semibold">Projects</span>
        </div>

        {repos.map((r) => (
          <div
            key={r}
            onClick={() => {
              setRepo(r);
              navigate(`/workspace/demo?repo=${r}`);
            }}
            className={cn(
              "cursor-pointer flex items-center gap-2 px-3 py-2 rounded",
              repo === r ? "bg-accent/10 text-accent" : "hover:bg-muted"
            )}
          >
            <GitBranch className="h-4 w-4" />
            {r.split("/")[1]}
          </div>
        ))}
      </aside>

      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
