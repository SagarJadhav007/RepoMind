import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";

import {
  LayoutDashboard,
  Activity,
  Heart,
  Settings,
  Users,
  KanbanSquare,
  MessageSquare,
  History,
  ChevronLeft,
  PanelLeftClose,
  PanelLeft,
  FolderGit2,
  GitBranch,
  User,
  Plus
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getLatestInstallationId } from "@/lib/utils";

/* -------------------- TYPES -------------------- */

interface WorkspaceLayoutProps {
  children: ReactNode;
}

type RepoItem = {
  repo_full_name: string;
};

/* -------------------- NAV FACTORY -------------------- */

function nav(repo: string) {
  return [
    { name: "Dashboard", href: `/workspace/${encodeURIComponent(repo)}`, icon: LayoutDashboard },
    { name: "Health", href: `/workspace/${encodeURIComponent(repo)}/health`, icon: Heart },
    { name: "Manage", href: `/workspace/${encodeURIComponent(repo)}/manage`, icon: Settings },
    { name: "Contributors", href: `/workspace/${encodeURIComponent(repo)}/contributors`, icon: Users },
    { name: "Planning", href: `/workspace/${encodeURIComponent(repo)}/planning`, icon: KanbanSquare },
    { name: "AI Assistant", href: `/workspace/${encodeURIComponent(repo)}/assistant`, icon: MessageSquare },
    { name: "Activity", href: `/workspace/${encodeURIComponent(repo)}/activity`, icon: History },
  ];
}

/* -------------------- COMPONENT -------------------- */

export function WorkspaceLayout({ children }: WorkspaceLayoutProps) {
  const { repo } = useParams<{ repo: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [repos, setRepos] = useState<string[]>([]);
  const [loadingRepos, setLoadingRepos] = useState(true);

  /* -------------------- LOAD USER REPOS -------------------- */

  useEffect(() => {
    async function loadRepos() {
      try {
        const session = (await supabase.auth.getSession()).data.session;
        if (!session) return;

        const res = await fetch(
          "https://repomind-577n.onrender.com/github/repos/available",
          {
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );

        if (!res.ok) return;

        const data: RepoItem[] = await res.json();
        const repoNames = data.map((r) => r.repo_full_name);

        setRepos(repoNames);

        // If no repo in URL → redirect to first repo
        if (!repo && repoNames.length > 0) {
          navigate(`/workspace/${encodeURIComponent(repoNames[0])}`, {
            replace: true,
          });
        }
      } finally {
        setLoadingRepos(false);
      }
    }

    loadRepos();
  }, [repo, navigate]);

  if (!repo) return null;

  const navigation = nav(repo);

  /* -------------------- RENDER -------------------- */

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-sm">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="h-8 w-8"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="h-4 w-4" />
            ) : (
              <PanelLeft className="h-4 w-4" />
            )}
          </Button>

          <div className="h-4 w-px bg-border" />

          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-sm">Back</span>
          </Link>

          <div className="h-4 w-px bg-border" />

          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <span className="font-semibold text-foreground">RepoMind</span>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <Link to={`/workspace/${repo}/profile`}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <User className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "sticky top-14 h-[calc(100vh-3.5rem)] shrink-0 border-r border-border bg-card/50 transition-all duration-300 flex flex-col",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden border-r-0"
          )}
        >
          {/* Navigation */}
          <nav className="flex flex-col gap-1 p-4 flex-1">
            {navigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap",
                    isActive
                      ? "bg-accent/10 text-accent"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Projects */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <FolderGit2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Projects
              </span>
            </div>

            {loadingRepos && (
              <div className="text-xs text-muted-foreground px-2">
                Loading repos…
              </div>
            )}

            <div className="flex flex-col gap-1">
              {repos.map((r) => {
                const active = r === repo;
                return (
                  <div
                    key={r}
                    onClick={() => navigate(`/workspace/${encodeURIComponent(r)}`)}
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-colors",
                      active
                        ? "bg-accent/10 text-accent"
                        : "hover:bg-muted"
                    )}
                  >
                    <GitBranch className="h-3.5 w-3.5 shrink-0" />
                    <span className="text-sm truncate">
                      {r.split("/")[1]}
                    </span>
                    {active && (
                      <span className="ml-auto h-2 w-2 rounded-full bg-green-500 shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>

            {/* ✅ ADD REPO BUTTON */}
            <Button
              variant="outline"
              size="sm"
              className="mt-3 w-full"
              onClick={async () => {
                const installationId = await getLatestInstallationId();

                if (installationId) {
                  navigate(`/select-repo?installation_id=${installationId}`);
                  return;
                }

                const session = (await supabase.auth.getSession()).data.session;
                if (!session) return;

                window.location.href =
                  `https://github.com/apps/RepoMind-App/installations/new?state=${session.user.id}`;
              }}
            >
              <Plus/>
              Add Repository
            </Button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
