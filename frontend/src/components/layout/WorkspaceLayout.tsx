import { ReactNode, useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useRepo } from "@/context/RepoContext";
import { supabase } from "@/lib/supabase";
import {
  LayoutDashboard,
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
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { logout } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

const navigation = [
  { name: "Dashboard", href: "/workspace/demo", icon: LayoutDashboard },
  { name: "Health", href: "/workspace/demo/health", icon: Heart },
  { name: "Manage", href: "/workspace/demo/manage", icon: Settings },
  { name: "Contributors", href: "/workspace/demo/contributors", icon: Users },
  { name: "Planning", href: "/workspace/demo/planning", icon: KanbanSquare },
  { name: "AI Assistant", href: "/workspace/demo/assistant", icon: MessageSquare },
  { name: "Activity", href: "/workspace/demo/activity", icon: History },
];

export function WorkspaceLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [repos, setRepos] = useState<string[]>([]);
  const { repo, setRepo } = useRepo();

  useEffect(() => {
    async function loadRepos() {
      const session = (await supabase.auth.getSession()).data.session;
      if (!session) return;

      const res = await fetch(
        "https://repomind-577n.onrender.com/github/repos",
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      const data = await res.json();
      setRepos(data.map((r: any) => r.full_name));

      if (!repo && data.length) {
        setRepo(data[0].full_name);
      }
    }

    loadRepos();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur">
        <div className="flex h-14 items-center gap-4 px-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <PanelLeftClose /> : <PanelLeft />}
          </Button>

          <Link to="/" className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-accent" />
            <span className="font-semibold">RepoMind</span>
          </Link>

          <div className="ml-auto flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await logout();
                navigate("/auth");
              }}
            >
              Logout
            </Button>
            <ThemeToggle />
            <Link to="/workspace/demo/profile">
              <Button variant="ghost" size="icon">
                <User />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside
          className={cn(
            "border-r bg-card/50 transition-all",
            sidebarOpen ? "w-64" : "w-0 overflow-hidden"
          )}
        >
          <nav className="p-4 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md",
                  location.pathname === item.href
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            ))}
          </nav>

          {/* Projects */}
          <div className="border-t p-4">
            <div className="flex items-center gap-2 mb-2">
              <FolderGit2 className="h-4 w-4" />
              <span className="text-xs font-semibold">Projects</span>
            </div>

            {repos.map((r) => (
              <div
                key={r}
                onClick={() => setRepo(r)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded cursor-pointer",
                  repo === r
                    ? "bg-accent/10 text-accent"
                    : "hover:bg-muted"
                )}
              >
                <GitBranch className="h-4 w-4" />
                <span className="truncate">{r.split("/")[1]}</span>
              </div>
            ))}
          </div>
        </aside>

        <main className="flex-1 p-6 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
